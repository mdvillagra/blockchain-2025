const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Marketplace Contract", function () {
  async function deployMarketplaceFixture() {
    const [owner, buyer, otherAccount] = await ethers.getSigners();

    const MarketplaceFactory = await ethers.getContractFactory("Marketplace");
    const marketplace = await MarketplaceFactory.deploy();

    const testURI = "ipfs://testuri";
    const testPrice = ethers.parseEther("1.0");

    return { marketplace, owner, buyer, otherAccount, testURI, testPrice };
  }

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      const { marketplace, owner } = await loadFixture(deployMarketplaceFixture);
      expect(await marketplace.owner()).to.equal(owner.address);
    });

    it("Should have the correct name and symbol for the NFT", async function () {
      const { marketplace } = await loadFixture(deployMarketplaceFixture);
      expect(await marketplace.name()).to.equal("MyNFT");
      expect(await marketplace.symbol()).to.equal("MNFT");
    });

    it("Should initialize tokenCounter to 0", async function () {
      const { marketplace } = await loadFixture(deployMarketplaceFixture);
      expect(await marketplace.tokenCounter()).to.equal(0);
    });
  });

  describe("mintAndList", function () {
    it("Should allow a user to mint and list an NFT", async function () {
      const { marketplace, owner, testURI, testPrice } = await loadFixture(deployMarketplaceFixture);
      
      await marketplace.connect(owner).mintAndList(testURI, testPrice);
      const tokenId = 0;

      const [listingOwner, listingPrice, listingIsSold] = await marketplace.getListing(tokenId);
      expect(listingOwner).to.equal(owner.address);
      expect(listingPrice).to.equal(testPrice);
      expect(listingIsSold).to.be.false;

      expect(await marketplace.tokenURI(tokenId)).to.equal(testURI);
      expect(await marketplace.ownerOf(tokenId)).to.equal(owner.address);
      expect(await marketplace.tokenCounter()).to.equal(1);
    });

    it("Should emit an ItemListed event", async function () {
      const { marketplace, owner, testURI, testPrice } = await loadFixture(deployMarketplaceFixture);
      const tokenId = 0;
      await expect(marketplace.connect(owner).mintAndList(testURI, testPrice))
        .to.emit(marketplace, "ItemListed")
        .withArgs(tokenId, owner.address, testPrice);
    });

    it("Should fail if price is 0", async function () {
      const { marketplace, owner, testURI } = await loadFixture(deployMarketplaceFixture);
      await expect(marketplace.connect(owner).mintAndList(testURI, 0))
        .to.be.revertedWith("Price must be positive");
    });
  });

  describe("buy", function () {
    let fixture;

    beforeEach(async function() {
      fixture = await loadFixture(deployMarketplaceFixture);
      const { marketplace, owner, testURI, testPrice } = fixture;
      await marketplace.connect(owner).mintAndList(testURI, testPrice);
    });

    it("Should allow a user to buy an item", async function () {
      const { marketplace, buyer, testPrice } = fixture;
      const tokenId = 0;

      await marketplace.connect(buyer).buy(tokenId, { value: testPrice });

      const [, , listingIsSold] = await marketplace.getListing(tokenId); // Solo necesitamos isSold
      expect(listingIsSold).to.be.true;
      expect(await marketplace.ownerOf(tokenId)).to.equal(buyer.address);
    });

    it("Should transfer funds to the seller's balance in contract", async function () {
      const { marketplace, owner, buyer, testPrice } = fixture;
      const tokenId = 0;

      const initialSellerBalance = await marketplace.balances(owner.address);
      await marketplace.connect(buyer).buy(tokenId, { value: testPrice });
      const finalSellerBalance = await marketplace.balances(owner.address);

      expect(finalSellerBalance).to.equal(initialSellerBalance + testPrice);
    });
    
    it("Should emit ItemSold event", async function () {
      const { marketplace, owner, buyer, testPrice } = fixture;
      const tokenId = 0;

      await expect(marketplace.connect(buyer).buy(tokenId, { value: testPrice }))
        .to.emit(marketplace, "ItemSold")
        .withArgs(tokenId, buyer.address, testPrice);
    });

    it("Should fail if item is already sold", async function () {
      const { marketplace, buyer, otherAccount, testPrice } = fixture;
      const tokenId = 0;

      await marketplace.connect(buyer).buy(tokenId, { value: testPrice });
      await expect(marketplace.connect(otherAccount).buy(tokenId, { value: testPrice }))
        .to.be.revertedWith("Item already sold");
    });

    it("Should fail if insufficient funds are sent", async function () {
      const { marketplace, buyer } = fixture;
      const tokenId = 0;
      const insufficientPrice = ethers.parseEther("0.5");

      await expect(marketplace.connect(buyer).buy(tokenId, { value: insufficientPrice }))
        .to.be.revertedWith("Insufficient funds");
    });

    it("Should handle overpayment (contract keeps overpayment for seller)", async function () {
        const { marketplace, owner, buyer, testPrice } = fixture;
        const tokenId = 0;
        const overPayment = ethers.parseEther("1.5");

        const initialSellerBalance = await marketplace.balances(owner.address);
        await marketplace.connect(buyer).buy(tokenId, { value: overPayment });
        const finalSellerBalance = await marketplace.balances(owner.address);

        expect(finalSellerBalance).to.equal(initialSellerBalance + overPayment);
        
        const [, , listingIsSold] = await marketplace.getListing(tokenId); // Solo necesitamos isSold
        expect(listingIsSold).to.be.true;
        expect(await marketplace.ownerOf(tokenId)).to.equal(buyer.address);
    });
  });

  describe("withdraw", function () {
    let fixture;
    const tokenId = 0;

    beforeEach(async function() {
      fixture = await loadFixture(deployMarketplaceFixture);
      const { marketplace, owner, buyer, testURI, testPrice } = fixture;
      await marketplace.connect(owner).mintAndList(testURI, testPrice);
      await marketplace.connect(buyer).buy(tokenId, { value: testPrice });
    });

    it("Should allow a seller to withdraw their funds", async function () {
      const { marketplace, owner, testPrice } = fixture;
      
      const initialContractBalanceForOwner = await marketplace.balances(owner.address);
      expect(initialContractBalanceForOwner).to.equal(testPrice);

      await expect(marketplace.connect(owner).withdraw())
        .to.changeEtherBalances([owner, marketplace], [testPrice, -testPrice]);

      expect(await marketplace.balances(owner.address)).to.equal(0);
    });

    it("Should fail if no funds to withdraw", async function () {
      const { marketplace, otherAccount } = fixture;
      await expect(marketplace.connect(otherAccount).withdraw())
        .to.be.revertedWith("Nothing to withdraw");
    });
  });

  describe("getListing", function () {
    it("Should return correct details for a listed item", async function () {
      const { marketplace, owner, testURI, testPrice } = await loadFixture(deployMarketplaceFixture);
      await marketplace.connect(owner).mintAndList(testURI, testPrice);
      const tokenId = 0;

      const [listingOwner, listingPrice, listingIsSold] = await marketplace.getListing(tokenId);
      expect(listingOwner).to.equal(owner.address);
      expect(listingPrice).to.equal(testPrice);
      expect(listingIsSold).to.be.false;
    });

    it("Should return default values for a non-existent or unlisted item", async function () {
        const { marketplace } = await loadFixture(deployMarketplaceFixture);
        const nonExistentTokenId = 999;
        const [listingOwner, listingPrice, listingIsSold] = await marketplace.getListing(nonExistentTokenId);
        
        expect(listingOwner).to.equal(ethers.ZeroAddress);
        expect(listingPrice).to.equal(0);
        expect(listingIsSold).to.be.false;
      });
  });
});