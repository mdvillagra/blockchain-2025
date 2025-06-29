const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LoanToken", function () {
    let owner, user, other, token;

    beforeEach(async function () {
        [owner, user, other] = await ethers.getSigners();
        const LoanToken = await ethers.getContractFactory("LoanToken");
        token = await LoanToken.deploy();
        await token.waitForDeployment();

        await token.setMinter(owner.address); // solo el owner es minter
    });

    it("permite al owner hacer mint", async function () {
        await token.mint(user.address, ethers.parseUnits("500", 18));
        const balance = await token.balanceOf(user.address);
        expect(balance.toString()).to.equal(ethers.parseUnits("500", 18).toString());
    });

    it("permite transferencias de tokens", async function () {
        await token.mint(owner.address, ethers.parseUnits("200", 18));
        await token.transfer(user.address, ethers.parseUnits("150", 18));
        const balance = await token.balanceOf(user.address);
        expect(balance.toString()).to.equal(ethers.parseUnits("150", 18).toString());
    });

    it("bloquea mint desde una cuenta que no es minter", async function () {
        await expect(
            token.connect(user).mint(user.address, ethers.parseUnits("100", 18))
        ).to.be.revertedWith("No autorizado");
    });


    it("bloquea mint si el minter es distinto", async function () {
        // El 'other' no es minter, y tampoco fue seteado
        await expect(
            token.connect(other).mint(other.address, ethers.parseUnits("50", 18))
        ).to.be.revertedWith("No autorizado");
    });

    it("bloquea mint si el minter nunca fue seteado", async function () {
        const LoanToken = await ethers.getContractFactory("LoanToken");
        const tokenNoMinter = await LoanToken.deploy();
        await tokenNoMinter.waitForDeployment();

        await expect(
            tokenNoMinter.connect(user).mint(user.address, ethers.parseUnits("100", 18))
        ).to.be.revertedWith("No autorizado");
    });

});
