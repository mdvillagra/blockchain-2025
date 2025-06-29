const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CollateralToken", function () {
    let owner, user, token;

    beforeEach(async function () {
        [owner, user] = await ethers.getSigners();
        const CollateralToken = await ethers.getContractFactory("CollateralToken");
        token = await CollateralToken.deploy();
        await token.waitForDeployment();
    });

    it("permite al owner hacer mint", async function () {
        await token.mint(user.address, ethers.parseUnits("100", 18));
        const balance = await token.balanceOf(user.address);
        expect(balance.toString()).to.equal(ethers.parseUnits("100", 18).toString());
    });

    it("permite transferencias entre cuentas", async function () {
        await token.mint(owner.address, ethers.parseUnits("50", 18));
        await token.transfer(user.address, ethers.parseUnits("20", 18));
        const balance = await token.balanceOf(user.address);
        expect(balance.toString()).to.equal(ethers.parseUnits("20", 18).toString());
    });

    it("rechaza mint si no es el owner", async function () {
        await expect(
            token.connect(user).mint(user.address, ethers.parseUnits("100", 18))
        ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });
});
