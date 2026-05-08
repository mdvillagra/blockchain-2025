import { expect } from "chai";
import { ethers } from "hardhat";
import { LoanToken } from "../typechain-types";

describe("LoanToken", function () {
    let loanToken: LoanToken;
    let owner: any;
    let user1: any;
    let user2: any;

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        const LoanToken = await ethers.getContractFactory("LoanToken");
        loanToken = await LoanToken.deploy();
    });

    describe("Deployment", function () {
        it("Should assign the total supply of tokens to the deployer", async function () {
            const deployerBalance = await loanToken.balanceOf(owner.address);
            expect(await loanToken.totalSupply()).to.equal(deployerBalance);
        });

        it("Should have correct name and symbol", async function () {
            expect(await loanToken.name()).to.equal("Loan DAI");
            expect(await loanToken.symbol()).to.equal("dDAI");
        });

        it("Should have 18 decimals", async function () {
            expect(await loanToken.decimals()).to.equal(18);
        });

        it("Should mint 1,000,000 tokens to deployer", async function () {
            const expectedSupply = ethers.parseEther("1000000");
            expect(await loanToken.totalSupply()).to.equal(expectedSupply);
        });
    });

    describe("Transfers", function () {
        it("Should transfer tokens between accounts", async function () {
            const transferAmount = ethers.parseEther("1000");

            await loanToken.transfer(user1.address, transferAmount);
            expect(await loanToken.balanceOf(user1.address)).to.equal(transferAmount);

            await loanToken.connect(user1).transfer(user2.address, transferAmount);
            expect(await loanToken.balanceOf(user2.address)).to.equal(transferAmount);
        });

        it("Should fail if sender doesn't have enough tokens", async function () {
            const initialOwnerBalance = await loanToken.balanceOf(owner.address);

            await expect(
                loanToken.connect(user1).transfer(owner.address, 1)
            ).to.be.revertedWithCustomError(loanToken, "ERC20InsufficientBalance");

            expect(await loanToken.balanceOf(owner.address)).to.equal(initialOwnerBalance);
        });

        it("Should emit Transfer events", async function () {
            const transferAmount = ethers.parseEther("1000");

            await expect(loanToken.transfer(user1.address, transferAmount))
                .to.emit(loanToken, "Transfer")
                .withArgs(owner.address, user1.address, transferAmount);
        });
    });

    describe("Allowances", function () {
        it("Should approve and transfer from", async function () {
            const approveAmount = ethers.parseEther("1000");
            const transferAmount = ethers.parseEther("500");

            await loanToken.approve(user1.address, approveAmount);
            expect(await loanToken.allowance(owner.address, user1.address)).to.equal(approveAmount);

            await loanToken.connect(user1).transferFrom(owner.address, user2.address, transferAmount);
            expect(await loanToken.balanceOf(user2.address)).to.equal(transferAmount);
            expect(await loanToken.allowance(owner.address, user1.address)).to.equal(approveAmount - transferAmount);
        });

        it("Should fail transferFrom if not approved", async function () {
            const transferAmount = ethers.parseEther("1000");

            await expect(
                loanToken.connect(user1).transferFrom(owner.address, user2.address, transferAmount)
            ).to.be.revertedWithCustomError(loanToken, "ERC20InsufficientAllowance");
        });

        it("Should emit Approval events", async function () {
            const approveAmount = ethers.parseEther("1000");

            await expect(loanToken.approve(user1.address, approveAmount))
                .to.emit(loanToken, "Approval")
                .withArgs(owner.address, user1.address, approveAmount);
        });
    });

    describe("Edge cases", function () {
        it("Should handle zero transfers", async function () {
            await expect(loanToken.transfer(user1.address, 0))
                .to.emit(loanToken, "Transfer")
                .withArgs(owner.address, user1.address, 0);
        });

        it("Should handle transfers to self", async function () {
            const initialBalance = await loanToken.balanceOf(owner.address);
            const transferAmount = ethers.parseEther("1000");

            await loanToken.transfer(owner.address, transferAmount);
            expect(await loanToken.balanceOf(owner.address)).to.equal(initialBalance);
        });
    });
}); 