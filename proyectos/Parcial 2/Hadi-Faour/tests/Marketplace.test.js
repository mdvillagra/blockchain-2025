const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Marketplace", function () {
  let Marketplace;
  let marketplace;
  let owner;
  let addr1;
  let addr2;
  
  // Ejecutamos antes de cada test
  beforeEach(async function () {
    // Obtenemos las cuentas de prueba
    [owner, addr1, addr2] = await ethers.getSigners();
    
    // Desplegamos el contrato
    Marketplace = await ethers.getContractFactory("Marketplace");
    marketplace = await Marketplace.deploy();
    await marketplace.deployed();
  });
  
  describe("Deployment", function () {
    it("Debería asignar al deployer como owner", async function () {
      expect(await marketplace.owner()).to.equal(owner.address);
    });
  });
  
  describe("Minting and Listing", function () {
    it("Debería permitir mintear y listar un nuevo NFT", async function () {
      const tokenURI = "ipfs://testuri";
      const price = ethers.utils.parseEther("0.1");
      
      await expect(marketplace.connect(addr1).mintAndList(tokenURI, price))
        .to.emit(marketplace, "ItemListed")
        .withArgs(1, addr1.address, price, tokenURI);
      
      const listing = await marketplace.getListing(1);
      expect(listing.owner).to.equal(addr1.address);
      expect(listing.price).to.equal(price);
      expect(listing.isSold).to.be.false;
    });
  });
  
  describe("Buying", function () {
    beforeEach(async function () {
      // Minteamos un NFT para las pruebas de compra
      const tokenURI = "ipfs://testuri";
      const price = ethers.utils.parseEther("0.1");
      await marketplace.connect(addr1).mintAndList(tokenURI, price);
    });
    
    it("Debería permitir comprar un NFT listado", async function () {
      const initialBalance = await addr1.getBalance();
      const price = ethers.utils.parseEther("0.1");
      
      await expect(
        marketplace.connect(addr2).buy(1, { value: price })
      ).to.emit(marketplace, "ItemSold").withArgs(1, addr2.address, price);
      
      // Verificamos la transferencia de fondos
      const finalBalance = await addr1.getBalance();
      expect(finalBalance).to.be.gt(initialBalance);
      
      // Verificamos la propiedad del NFT
      expect(await marketplace.ownerOf(1)).to.equal(addr2.address);
      
      // Verificamos el estado del listado
      const listing = await marketplace.getListing(1);
      expect(listing.isSold).to.be.true;
    });
  });
});