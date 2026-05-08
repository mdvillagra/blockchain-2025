import { expect } from "chai";
import { ethers } from "hardhat";
import { CollateralToken } from "../typechain-types";

describe("CollateralToken", function () {
    let collateralToken: CollateralToken;
    let owner: any;
    let user1: any;
    let user2: any;

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        const CollateralToken = await ethers.getContractFactory("CollateralToken");
        collateralToken = await CollateralToken.deploy();
    });

    describe("Deployment", function () {
        it("Should assign the total supply of tokens to the deployer", async function () {
            const deployerBalance = await collateralToken.balanceOf(owner.address);
            expect(await collateralToken.totalSupply()).to.equal(deployerBalance);
        });

        it("Should have correct name and symbol", async function () {
            expect(await collateralToken.name()).to.equal("Collateral USD");
            expect(await collateralToken.symbol()).to.equal("cUSD");
        });

        it("Should have 18 decimals", async function () {
            expect(await collateralToken.decimals()).to.equal(18);
        });

        it("Should mint 1,000,000 tokens to owner", async function () {
            const expectedSupply = ethers.parseEther("1000000");
            expect(await collateralToken.totalSupply()).to.equal(expectedSupply);
        });
    });

    describe("Transfers", function () {
        it("Should transfer tokens between accounts", async function () {
            const transferAmount = ethers.parseEther("1000");

            await collateralToken.transfer(user1.address, transferAmount);
            expect(await collateralToken.balanceOf(user1.address)).to.equal(transferAmount);

            await collateralToken.connect(user1).transfer(user2.address, transferAmount);
            expect(await collateralToken.balanceOf(user2.address)).to.equal(transferAmount);
        });

        it("Should fail if sender doesn't have enough tokens", async function () {
            const initialOwnerBalance = await collateralToken.balanceOf(owner.address);

            await expect(
                collateralToken.connect(user1).transfer(owner.address, 1)
            ).to.be.revertedWithCustomError(collateralToken, "ERC20InsufficientBalance");

            expect(await collateralToken.balanceOf(owner.address)).to.equal(initialOwnerBalance);
        });

        it("Should emit Transfer events", async function () {
            const transferAmount = ethers.parseEther("1000");

            await expect(collateralToken.transfer(user1.address, transferAmount))
                .to.emit(collateralToken, "Transfer")
                .withArgs(owner.address, user1.address, transferAmount);
        });
    });

    describe("Allowances", function () {
        it("Should approve and transfer from", async function () {
            const approveAmount = ethers.parseEther("1000");
            const transferAmount = ethers.parseEther("500");

            await collateralToken.approve(user1.address, approveAmount);
            expect(await collateralToken.allowance(owner.address, user1.address)).to.equal(approveAmount);

            await collateralToken.connect(user1).transferFrom(owner.address, user2.address, transferAmount);
            expect(await collateralToken.balanceOf(user2.address)).to.equal(transferAmount);
            expect(await collateralToken.allowance(owner.address, user1.address)).to.equal(approveAmount - transferAmount);
        });

        it("Should fail transferFrom if not approved", async function () {
            const transferAmount = ethers.parseEther("1000");

            await expect(
                collateralToken.connect(user1).transferFrom(owner.address, user2.address, transferAmount)
            ).to.be.revertedWithCustomError(collateralToken, "ERC20InsufficientAllowance");
        });

        it("Should emit Approval events", async function () {
            const approveAmount = ethers.parseEther("1000");

            await expect(collateralToken.approve(user1.address, approveAmount))
                .to.emit(collateralToken, "Approval")
                .withArgs(owner.address, user1.address, approveAmount);
        });
    });

    describe("Edge cases", function () {
        it("Should handle zero transfers", async function () {
            await expect(collateralToken.transfer(user1.address, 0))
                .to.emit(collateralToken, "Transfer")
                .withArgs(owner.address, user1.address, 0);
        });

        it("Should handle transfers to self", async function () {
            const initialBalance = await collateralToken.balanceOf(owner.address);
            const transferAmount = ethers.parseEther("1000");

            await collateralToken.transfer(owner.address, transferAmount);
            expect(await collateralToken.balanceOf(owner.address)).to.equal(initialBalance);
        });
    });
}); 