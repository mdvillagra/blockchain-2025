import { ethers } from "hardhat";
import { expect } from "chai";
import { Marketplace } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Marketplace", function () {
  let marketplace: Marketplace;
  let owner: SignerWithAddress;
  let buyer: SignerWithAddress;

  const TOKEN_URI = "ipfs://test-uri/1.json";
  const PRICE = ethers.parseEther("0.01");

  beforeEach(async function () {
    // Obtener signers de prueba
    [owner, buyer] = await ethers.getSigners();

    // Desplegar el contrato
    const MarketplaceFactory = await ethers.getContractFactory(
      "Marketplace",
      owner
    );
    marketplace = await MarketplaceFactory.deploy(owner.address);
  });

  describe("Minteo y listado", function () {
    it("Debería mintear y listar un NFT", async function () {
      await expect(marketplace.mintAndList(TOKEN_URI, PRICE))
        .to.emit(marketplace, "ItemListed")
        .withArgs(1, owner.address, PRICE);

      const [listedOwner, listedPrice, isSold] = await marketplace.getListing(
        1
      );
      expect(listedOwner).to.equal(owner.address);
      expect(listedPrice).to.equal(PRICE);
      expect(isSold).to.be.false;
    });

    it("Solo el propietario puede mintear NFTs", async function () {
      await expect(
        marketplace.connect(buyer).mintAndList(TOKEN_URI, PRICE)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("No debería permitir listar con precio cero", async function () {
      await expect(marketplace.mintAndList(TOKEN_URI, 0)).to.be.revertedWith(
        "El precio debe ser mayor que 0"
      );
    });
  });

  describe("Compra de NFT", function () {
    beforeEach(async function () {
      // Mintear un NFT para las pruebas
      await marketplace.mintAndList(TOKEN_URI, PRICE);
    });

    it("Debería permitir la compra de un NFT", async function () {
      await expect(marketplace.connect(buyer).buy(1, { value: PRICE }))
        .to.emit(marketplace, "ItemSold")
        .withArgs(1, buyer.address, PRICE);

      // Verificar que el NFT fue transferido
      expect(await marketplace.ownerOf(1)).to.equal(buyer.address);

      // Verificar que el NFT está marcado como vendido
      const [_, __, isSold] = await marketplace.getListing(1);
      expect(isSold).to.be.true;
    });

    it("No debería permitir comprar con fondos insuficientes", async function () {
      const lowPrice = PRICE.div(2);
      await expect(
        marketplace.connect(buyer).buy(1, { value: lowPrice })
      ).to.be.revertedWith("Precio insuficiente");
    });

    it("No debería permitir comprar un NFT ya vendido", async function () {
      // Primero compramos el NFT
      await marketplace.connect(buyer).buy(1, { value: PRICE });

      // Intentamos comprarlo de nuevo
      await expect(
        marketplace.connect(buyer).buy(1, { value: PRICE })
      ).to.be.revertedWith("NFT ya vendido");
    });
  });

  describe("Retirada de fondos", function () {
    beforeEach(async function () {
      // Mintear y vender un NFT para tener fondos
      await marketplace.mintAndList(TOKEN_URI, PRICE);
      await marketplace.connect(buyer).buy(1, { value: PRICE });
    });

    it("Debería permitir al propietario retirar fondos", async function () {
      const initialBalance = await ethers.provider.getBalance(owner.address);

      // Retirar fondos
      await marketplace.withdraw();

      // Verificar que los fondos fueron retirados
      const finalBalance = await ethers.provider.getBalance(owner.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("No debería permitir que usuarios no autorizados retiren fondos", async function () {
      await expect(marketplace.connect(buyer).withdraw()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });
  });
});
