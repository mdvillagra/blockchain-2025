import { expect } from "chai";
import { ethers } from "hardhat";
import { LendingProtocol, CollateralToken, LoanToken } from "../typechain-types";
import { deployContracts } from "./00_deploy";

describe("LendingProtocol", function () {
    let lendingProtocol: LendingProtocol;
    let collateralToken: CollateralToken;
    let loanToken: LoanToken;
    let deployer: any;
    let user1: any;
    let user2: any;

    beforeEach(async function () {
        const contracts = await deployContracts();
        lendingProtocol = contracts.lendingProtocol;
        collateralToken = contracts.collateralToken;
        loanToken = contracts.loanToken;
        deployer = contracts.deployer;
        user1 = contracts.user1;
        user2 = contracts.user2;
    });

    describe("Deployment", function () {
        it("Should set correct token addresses", async function () {
            expect(await lendingProtocol.collateralToken()).to.equal(await collateralToken.getAddress());
            expect(await lendingProtocol.loanToken()).to.equal(await loanToken.getAddress());
        });

        it("Should have correct constants", async function () {
            expect(await lendingProtocol.INTEREST_RATE()).to.equal(5);
            expect(await lendingProtocol.COLLATERAL_RATIO()).to.equal(150);
        });

        it("Should have initial liquidity", async function () {
            const liquidityAmount = ethers.parseEther("100000");
            expect(await loanToken.balanceOf(await lendingProtocol.getAddress())).to.equal(liquidityAmount);
        });
    });

    describe("Deposit Collateral", function () {
        it("Should deposit collateral successfully", async function () {
            const depositAmount = ethers.parseEther("1000");

            await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), depositAmount);
            await lendingProtocol.connect(user1).depositCollateral(depositAmount);

            const position = await lendingProtocol.getUserPosition(user1.address);
            expect(position.collateral).to.equal(depositAmount);
            expect(position.debt).to.equal(0);
        });

        it("Should emit Deposited event", async function () {
            const depositAmount = ethers.parseEther("1000");

            await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), depositAmount);

            await expect(lendingProtocol.connect(user1).depositCollateral(depositAmount))
                .to.emit(lendingProtocol, "Deposited")
                .withArgs(user1.address, depositAmount);
        });

        it("Should fail if user doesn't have enough collateral tokens", async function () {
            const depositAmount = ethers.parseEther("20000"); // More than user has

            await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), depositAmount);

            await expect(
                lendingProtocol.connect(user1).depositCollateral(depositAmount)
            ).to.be.revertedWithCustomError(collateralToken, "ERC20InsufficientBalance");
        });

        it("Should fail if not approved", async function () {
            const depositAmount = ethers.parseEther("1000");

            await expect(
                lendingProtocol.connect(user1).depositCollateral(depositAmount)
            ).to.be.revertedWithCustomError(collateralToken, "ERC20InsufficientAllowance");
        });
    });

    describe("Borrow", function () {
        beforeEach(async function () {
            // Setup: user1 deposits collateral
            const depositAmount = ethers.parseEther("2000");
            await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), depositAmount);
            await lendingProtocol.connect(user1).depositCollateral(depositAmount);
        });

        it("Should borrow successfully with sufficient collateral", async function () {
            const borrowAmount = ethers.parseEther("1000");
            const initialBalance = await loanToken.balanceOf(user1.address);

            await lendingProtocol.connect(user1).borrow(borrowAmount);

            const position = await lendingProtocol.getUserPosition(user1.address);
            expect(position.debt).to.equal(borrowAmount);
            expect(await loanToken.balanceOf(user1.address)).to.equal(initialBalance + borrowAmount);
        });

        it("Should emit Borrowed event", async function () {
            const borrowAmount = ethers.parseEther("1000");

            await expect(lendingProtocol.connect(user1).borrow(borrowAmount))
                .to.emit(lendingProtocol, "Borrowed")
                .withArgs(user1.address, borrowAmount);
        });

        it("Should fail if insufficient collateral", async function () {
            const borrowAmount = ethers.parseEther("2000"); // Requires 3000 collateral (150% ratio)

            await expect(
                lendingProtocol.connect(user1).borrow(borrowAmount)
            ).to.be.revertedWith("Insufficient collateral");
        });

        it("Should fail if no collateral deposited", async function () {
            const borrowAmount = ethers.parseEther("1000");

            await expect(
                lendingProtocol.connect(user2).borrow(borrowAmount)
            ).to.be.revertedWith("Insufficient collateral");
        });
    });

    describe("Repay", function () {
        beforeEach(async function () {
            // Setup: user1 deposits collateral and borrows
            const depositAmount = ethers.parseEther("2000");
            await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), depositAmount);
            await lendingProtocol.connect(user1).depositCollateral(depositAmount);

            const borrowAmount = ethers.parseEther("1000");
            await lendingProtocol.connect(user1).borrow(borrowAmount);
        });

        it("Should repay debt successfully", async function () {
            const position = await lendingProtocol.getUserPosition(user1.address);
            const totalAmount = position.debt + position.interest;

            await loanToken.connect(user1).approve(await lendingProtocol.getAddress(), totalAmount);
            await lendingProtocol.connect(user1).repay();

            const newPosition = await lendingProtocol.getUserPosition(user1.address);
            expect(newPosition.debt).to.equal(0);
        });

        it("Should emit Repaid event", async function () {
            const position = await lendingProtocol.getUserPosition(user1.address);
            const totalAmount = position.debt + position.interest;

            await loanToken.connect(user1).approve(await lendingProtocol.getAddress(), totalAmount);

            await expect(lendingProtocol.connect(user1).repay())
                .to.emit(lendingProtocol, "Repaid")
                .withArgs(user1.address, totalAmount);
        });

        it("Should fail if no debt to repay", async function () {
            await expect(
                lendingProtocol.connect(user2).repay()
            ).to.be.revertedWith("No debt to repay");
        });

        it("Should fail if not approved", async function () {
            await expect(
                lendingProtocol.connect(user1).repay()
            ).to.be.revertedWithCustomError(loanToken, "ERC20InsufficientAllowance");
        });
    });

    describe("Withdraw Collateral", function () {
        beforeEach(async function () {
            // Setup: user1 deposits collateral
            const depositAmount = ethers.parseEther("1000");
            await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), depositAmount);
            await lendingProtocol.connect(user1).depositCollateral(depositAmount);
        });

        it("Should withdraw collateral successfully when no debt", async function () {
            const initialBalance = await collateralToken.balanceOf(user1.address);
            const position = await lendingProtocol.getUserPosition(user1.address);

            await lendingProtocol.connect(user1).withdrawCollateral();

            expect(await collateralToken.balanceOf(user1.address)).to.equal(initialBalance + position.collateral);

            const newPosition = await lendingProtocol.getUserPosition(user1.address);
            expect(newPosition.collateral).to.equal(0);
        });

        it("Should emit Withdrawn event", async function () {
            const position = await lendingProtocol.getUserPosition(user1.address);

            await expect(lendingProtocol.connect(user1).withdrawCollateral())
                .to.emit(lendingProtocol, "Withdrawn")
                .withArgs(user1.address, position.collateral);
        });

        it("Should fail if outstanding debt", async function () {
            // Borrow some tokens first
            const borrowAmount = ethers.parseEther("500");
            await lendingProtocol.connect(user1).borrow(borrowAmount);

            await expect(
                lendingProtocol.connect(user1).withdrawCollateral()
            ).to.be.revertedWith("Outstanding debt");
        });

        it("Should fail if no collateral", async function () {
            await expect(
                lendingProtocol.connect(user2).withdrawCollateral()
            ).to.be.revertedWith("No collateral");
        });
    });

    describe("Interest Calculation", function () {
        beforeEach(async function () {
            // Setup: user1 deposits collateral and borrows
            const depositAmount = ethers.parseEther("2000");
            await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), depositAmount);
            await lendingProtocol.connect(user1).depositCollateral(depositAmount);

            const borrowAmount = ethers.parseEther("1000");
            await lendingProtocol.connect(user1).borrow(borrowAmount);
        });

        it("Should calculate interest correctly after one week", async function () {
            // Fast forward one week
            await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine", []);

            const position = await lendingProtocol.getUserPosition(user1.address);
            const expectedInterest = ethers.parseEther("50"); // 5% of 1000

            expect(position.interest).to.equal(expectedInterest);
        });

        it("Should calculate interest correctly after multiple weeks", async function () {
            // Fast forward 3 weeks
            await ethers.provider.send("evm_increaseTime", [3 * 7 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine", []);

            const position = await lendingProtocol.getUserPosition(user1.address);
            const expectedInterest = ethers.parseEther("150"); // 5% * 3 weeks of 1000

            expect(position.interest).to.equal(expectedInterest);
        });

        it("Should return zero interest for users with no debt", async function () {
            const position = await lendingProtocol.getUserPosition(user2.address);
            expect(position.interest).to.equal(0);
        });
    });

    describe("Get User Position", function () {
        it("Should return correct position for user with no activity", async function () {
            const position = await lendingProtocol.getUserPosition(user1.address);
            expect(position.collateral).to.equal(0);
            expect(position.debt).to.equal(0);
            expect(position.interest).to.equal(0);
        });

        it("Should return correct position for user with collateral and debt", async function () {
            // Setup: user1 deposits and borrows
            const depositAmount = ethers.parseEther("2000");
            await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), depositAmount);
            await lendingProtocol.connect(user1).depositCollateral(depositAmount);

            const borrowAmount = ethers.parseEther("1000");
            await lendingProtocol.connect(user1).borrow(borrowAmount);

            const position = await lendingProtocol.getUserPosition(user1.address);
            expect(position.collateral).to.equal(depositAmount);
            expect(position.debt).to.equal(borrowAmount);
            expect(position.interest).to.equal(0); // No time has passed
        });
    });

    describe("Integration Tests", function () {
        it("Should handle complete lending cycle", async function () {
            // 1. Deposit collateral
            const depositAmount = ethers.parseEther("2000");
            await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), depositAmount);
            await lendingProtocol.connect(user1).depositCollateral(depositAmount);

            // 2. Borrow
            const borrowAmount = ethers.parseEther("1000");
            await lendingProtocol.connect(user1).borrow(borrowAmount);

            // 3. Wait for interest to accumulate
            await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine", []);

            // 4. Repay with interest
            const position = await lendingProtocol.getUserPosition(user1.address);
            const totalAmount = position.debt + position.interest;

            // Check if user has enough loan tokens to repay
            const userLoanBalance = await loanToken.balanceOf(user1.address);
            if (userLoanBalance < totalAmount) {
                // Transfer additional loan tokens to user1 if needed
                const neededAmount = totalAmount - userLoanBalance;
                await loanToken.transfer(user1.address, neededAmount);
            }

            await loanToken.connect(user1).approve(await lendingProtocol.getAddress(), totalAmount);
            await lendingProtocol.connect(user1).repay();

            // 5. Withdraw collateral
            await lendingProtocol.connect(user1).withdrawCollateral();

            // Verify final state
            const finalPosition = await lendingProtocol.getUserPosition(user1.address);
            expect(finalPosition.collateral).to.equal(0);
            expect(finalPosition.debt).to.equal(0);
            expect(finalPosition.interest).to.equal(0);
        });

        it("Should handle multiple users", async function () {
            // User1 deposits and borrows
            const depositAmount1 = ethers.parseEther("2000");
            await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), depositAmount1);
            await lendingProtocol.connect(user1).depositCollateral(depositAmount1);
            await lendingProtocol.connect(user1).borrow(ethers.parseEther("1000"));

            // User2 deposits and borrows
            const depositAmount2 = ethers.parseEther("1500");
            await collateralToken.connect(user2).approve(await lendingProtocol.getAddress(), depositAmount2);
            await lendingProtocol.connect(user2).depositCollateral(depositAmount2);
            await lendingProtocol.connect(user2).borrow(ethers.parseEther("500"));

            // Verify positions are independent
            const position1 = await lendingProtocol.getUserPosition(user1.address);
            const position2 = await lendingProtocol.getUserPosition(user2.address);

            expect(position1.collateral).to.equal(depositAmount1);
            expect(position1.debt).to.equal(ethers.parseEther("1000"));
            expect(position2.collateral).to.equal(depositAmount2);
            expect(position2.debt).to.equal(ethers.parseEther("500"));
        });
    });
}); 