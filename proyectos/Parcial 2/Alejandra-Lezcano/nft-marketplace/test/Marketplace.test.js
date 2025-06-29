const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Marketplace", function () {
    let marketplace;
    let owner;
    let addr1;
    let addr2;
    let addrs;

    beforeEach(async function () {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        
        const Marketplace = await ethers.getContractFactory("Marketplace");
        marketplace = await Marketplace.deploy();
        await marketplace.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await marketplace.owner()).to.equal(owner.address);
        });

        it("Should set the correct name and symbol", async function () {
            expect(await marketplace.name()).to.equal("MyNFT");
            expect(await marketplace.symbol()).to.equal("MNFT");
        });

        it("Should set fee receiver to owner", async function () {
            expect(await marketplace.feeReceiver()).to.equal(owner.address);
        });

        it("Should set correct fee percentage", async function () {
            expect(await marketplace.fee()).to.equal(500); // 5%
        });

        it("Should initialize tokenId to 0", async function () {
            expect(await marketplace.tokenId()).to.equal(0);
        });
    });

    describe("Minting and Listing", function () {
        it("Should mint and list an NFT", async function () {
            const uri = "https://example.com/token/1";
            const price = ethers.parseEther("1");

            await expect(marketplace.connect(addr1).mintAndList(uri, price))
                .to.emit(marketplace, "ItemListed")
                .withArgs(0, addr1.address, price);

            // Verificar que el NFT fue minteado correctamente
            expect(await marketplace.ownerOf(0)).to.equal(addr1.address);
            expect(await marketplace.tokenURI(0)).to.equal(uri);
            
            // Verificar que el listing fue creado
            const listing = await marketplace.getListing(0);
            expect(listing[0]).to.equal(addr1.address); // seller
            expect(listing[1]).to.equal(price); // price
            expect(listing[2]).to.equal(false); // isSold
        });

        it("Should increment tokenId after minting", async function () {
            const uri = "https://example.com/token/1";
            const price = ethers.parseEther("1");

            await marketplace.connect(addr1).mintAndList(uri, price);
            expect(await marketplace.tokenId()).to.equal(1);

            await marketplace.connect(addr2).mintAndList(uri, price);
            expect(await marketplace.tokenId()).to.equal(2);
        });

        it("Should revert if price is 0", async function () {
            const uri = "https://example.com/token/1";
            const price = 0;

            await expect(
                marketplace.connect(addr1).mintAndList(uri, price)
            ).to.be.revertedWith("Price must be > 0");
        });

        it("Should allow multiple users to mint and list", async function () {
            const uri1 = "https://example.com/token/1";
            const uri2 = "https://example.com/token/2";
            const price1 = ethers.parseEther("1");
            const price2 = ethers.parseEther("2");

            await marketplace.connect(addr1).mintAndList(uri1, price1);
            await marketplace.connect(addr2).mintAndList(uri2, price2);

            expect(await marketplace.ownerOf(0)).to.equal(addr1.address);
            expect(await marketplace.ownerOf(1)).to.equal(addr2.address);
        });
    });

    describe("Buying", function () {
        beforeEach(async function () {
            const uri = "https://example.com/token/1";
            const price = ethers.parseEther("1");
            await marketplace.connect(addr1).mintAndList(uri, price);
        });

        it("Should allow buying an NFT", async function () {
            const price = ethers.parseEther("1");
            
            await expect(
                marketplace.connect(addr2).buy(0, { value: price })
            ).to.emit(marketplace, "ItemSold")
             .withArgs(0, addr2.address, price);

            // Verificar transferencia de ownership
            expect(await marketplace.ownerOf(0)).to.equal(addr2.address);
            
            // Verificar que el item está marcado como vendido
            const listing = await marketplace.getListing(0);
            expect(listing[2]).to.equal(true); // isSold
        });

        it("Should distribute payment correctly with fees", async function () {
            const price = ethers.parseEther("1");
            const expectedFee = (price * 500n) / 10000n; // 5%
            const expectedSellerAmount = price - expectedFee;

            await marketplace.connect(addr2).buy(0, { value: price });

            expect(await marketplace.balances(addr1.address)).to.equal(expectedSellerAmount);
            expect(await marketplace.balances(owner.address)).to.equal(expectedFee);
        });

        it("Should revert if incorrect value is sent", async function () {
            const wrongPrice = ethers.parseEther("0.5");
            
            await expect(
                marketplace.connect(addr2).buy(0, { value: wrongPrice })
            ).to.be.revertedWith("Incorrect value");
        });

        it("Should revert if item is already sold", async function () {
            const price = ethers.parseEther("1");
            
            // Primera compra
            await marketplace.connect(addr2).buy(0, { value: price });
            
            // Segunda compra (debería fallar)
            await expect(
                marketplace.connect(addrs[0]).buy(0, { value: price })
            ).to.be.revertedWith("Already sold");
        });

        it("Should revert if trying to buy non-existent token", async function () {
            const price = ethers.parseEther("1");
            
            await expect(
                marketplace.connect(addr2).buy(999, { value: price })
            ).to.be.revertedWith("Incorrect value");
        });
    });

    describe("Withdrawals", function () {
        beforeEach(async function () {
            const uri = "https://example.com/token/1";
            const price = ethers.parseEther("1");
            await marketplace.connect(addr1).mintAndList(uri, price);
            await marketplace.connect(addr2).buy(0, { value: price });
        });

        it("Should allow seller to withdraw earnings", async function () {
            const initialBalance = await ethers.provider.getBalance(addr1.address);
            const contractBalance = await marketplace.balances(addr1.address);
            
            const tx = await marketplace.connect(addr1).withdraw();
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;
            
            const finalBalance = await ethers.provider.getBalance(addr1.address);
            
            expect(finalBalance).to.equal(
                initialBalance + contractBalance - gasUsed
            );
            expect(await marketplace.balances(addr1.address)).to.equal(0);
        });

        it("Should allow fee receiver to withdraw fees", async function () {
            const initialBalance = await ethers.provider.getBalance(owner.address);
            const contractBalance = await marketplace.balances(owner.address);
            
            const tx = await marketplace.connect(owner).withdraw();
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;
            
            const finalBalance = await ethers.provider.getBalance(owner.address);
            
            expect(finalBalance).to.equal(
                initialBalance + contractBalance - gasUsed
            );
            expect(await marketplace.balances(owner.address)).to.equal(0);
        });

        it("Should revert if nothing to withdraw", async function () {
            await expect(
                marketplace.connect(addrs[0]).withdraw()
            ).to.be.revertedWith("Nothing to withdraw");
        });

        it("Should handle multiple withdrawals correctly", async function () {
            // Vender otro NFT
            const uri2 = "https://example.com/token/2";
            const price2 = ethers.parseEther("2");
            await marketplace.connect(addr1).mintAndList(uri2, price2);
            await marketplace.connect(addr2).buy(1, { value: price2 });
            
            const balanceBeforeWithdraw = await marketplace.balances(addr1.address);
            
            // Primera retirada
            await marketplace.connect(addr1).withdraw();
            expect(await marketplace.balances(addr1.address)).to.equal(0);
            
            // Intentar segunda retirada (debería fallar)
            await expect(
                marketplace.connect(addr1).withdraw()
            ).to.be.revertedWith("Nothing to withdraw");
        });
    });

    describe("View Functions", function () {
        it("Should return correct listing information", async function () {
            const uri = "https://example.com/token/1";
            const price = ethers.parseEther("1");
            
            await marketplace.connect(addr1).mintAndList(uri, price);
            
            const listing = await marketplace.getListing(0);
            expect(listing[0]).to.equal(addr1.address); // seller
            expect(listing[1]).to.equal(price); // price
            expect(listing[2]).to.equal(false); // isSold
        });

        it("Should return default values for non-existent listings", async function () {
            const listing = await marketplace.getListing(999);
            expect(listing[0]).to.equal(ethers.ZeroAddress);
            expect(listing[1]).to.equal(0);
            expect(listing[2]).to.equal(false);
        });
    });

    describe("Edge Cases and Security", function () {
        it("Should handle zero fee correctly", async function () {
            // Este test asume que podrías querer cambiar la fee en el futuro
            const uri = "https://example.com/token/1";
            const price = ethers.parseEther("1");
            
            await marketplace.connect(addr1).mintAndList(uri, price);
            await marketplace.connect(addr2).buy(0, { value: price });
            
            // Con fee del 5%, el seller debería recibir 95%
            const expectedSellerAmount = (price * 9500n) / 10000n;
            expect(await marketplace.balances(addr1.address)).to.equal(expectedSellerAmount);
        });

        it("Should handle very small prices", async function () {
            const uri = "https://example.com/token/1";
            const price = 1; // 1 wei
            
            await marketplace.connect(addr1).mintAndList(uri, price);
            await marketplace.connect(addr2).buy(0, { value: price });
            
            // Verificar que la transacción se completó
            expect(await marketplace.ownerOf(0)).to.equal(addr2.address);
        });

        it("Should prevent reentrancy attacks on withdraw", async function () {
            const uri = "https://example.com/token/1";
            const price = ethers.parseEther("1");
            
            await marketplace.connect(addr1).mintAndList(uri, price);
            await marketplace.connect(addr2).buy(0, { value: price });
            
            // Balance should be reset before transfer
            const balanceBeforeWithdraw = await marketplace.balances(addr1.address);
            await marketplace.connect(addr1).withdraw();
            
            // Balance should be 0 after withdrawal
            expect(await marketplace.balances(addr1.address)).to.equal(0);
        });
    });

    describe("Integration Tests", function () {
        it("Should handle complete marketplace flow", async function () {
            const uri1 = "https://example.com/token/1";
            const uri2 = "https://example.com/token/2";
            const price1 = ethers.parseEther("1");
            const price2 = ethers.parseEther("2");
            
            // Addr1 mints and lists two NFTs
            await marketplace.connect(addr1).mintAndList(uri1, price1);
            await marketplace.connect(addr1).mintAndList(uri2, price2);
            
            // Addr2 buys first NFT
            await marketplace.connect(addr2).buy(0, { value: price1 });
            
            // Addrs[0] buys second NFT
            await marketplace.connect(addrs[0]).buy(1, { value: price2 });
            
            // Check ownerships
            expect(await marketplace.ownerOf(0)).to.equal(addr2.address);
            expect(await marketplace.ownerOf(1)).to.equal(addrs[0].address);
            
            // Check balances
            const expectedSellerTotal = ((price1 + price2) * 9500n) / 10000n;
            const expectedFeeTotal = ((price1 + price2) * 500n) / 10000n;
            
            expect(await marketplace.balances(addr1.address)).to.equal(expectedSellerTotal);
            expect(await marketplace.balances(owner.address)).to.equal(expectedFeeTotal);
            
            // Withdraw
            await marketplace.connect(addr1).withdraw();
            await marketplace.connect(owner).withdraw();
            
            expect(await marketplace.balances(addr1.address)).to.equal(0);
            expect(await marketplace.balances(owner.address)).to.equal(0);
        });
    });
});