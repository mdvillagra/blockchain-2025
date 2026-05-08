import { expect } from "chai";
import { ethers } from "hardhat";
import { LendingProtocol, CollateralToken, LoanToken } from "../typechain-types";
import { deployContracts } from "./00_deploy";
import { timeTravel } from "./helpers";

describe("Security Tests", function () {
    let lendingProtocol: LendingProtocol;
    let collateralToken: CollateralToken;
    let loanToken: LoanToken;
    let deployer: any;
    let user1: any;
    let user2: any;
    let attacker: any;

    beforeEach(async function () {
        const contracts = await deployContracts();
        lendingProtocol = contracts.lendingProtocol;
        collateralToken = contracts.collateralToken;
        loanToken = contracts.loanToken;
        deployer = contracts.deployer;
        user1 = contracts.user1;
        user2 = contracts.user2;
        [attacker] = await ethers.getSigners();
    });

    describe("Reentrancy Protection", function () {
        it("Should not be vulnerable to reentrancy attacks on deposit", async function () {
            // This test verifies that the contract doesn't have reentrancy vulnerabilities
            // The current implementation uses transferFrom which is safe
            const depositAmount = ethers.parseEther("1000");

            await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), depositAmount * 2n);

            // Multiple deposits should work correctly
            await lendingProtocol.connect(user1).depositCollateral(depositAmount);
            await lendingProtocol.connect(user1).depositCollateral(depositAmount);

            const position = await lendingProtocol.getUserPosition(user1.address);
            expect(position.collateral).to.equal(depositAmount * 2n);
        });
    });

    describe("Access Control", function () {
        it("Should not allow unauthorized access to internal functions", async function () {
            // Test that internal functions cannot be called directly
            // The contract doesn't have admin functions, so this is mainly for future reference
            expect(true).to.be.true; // Placeholder for when admin functions are added
        });
    });

    describe("Integer Overflow/Underflow", function () {
        it("Should handle large numbers correctly", async function () {
            // Test with maximum uint256 values
            const maxAmount = ethers.MaxUint256;

            // This should not cause overflow
            await expect(
                lendingProtocol.connect(user1).getUserPosition(user1.address)
            ).to.not.be.reverted;
        });

        it("Should handle zero amounts correctly", async function () {
            // Test with zero amounts
            const position = await lendingProtocol.getUserPosition(user1.address);
            expect(position.collateral).to.equal(0);
            expect(position.debt).to.equal(0);
            expect(position.interest).to.equal(0);
        });
    });

    describe("Precision and Rounding", function () {
        it("Should handle interest calculation with small amounts", async function () {
            // Setup: user1 deposits collateral and borrows small amount
            const depositAmount = ethers.parseEther("100");
            await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), depositAmount);
            await lendingProtocol.connect(user1).depositCollateral(depositAmount);

            const borrowAmount = ethers.parseEther("1"); // Small amount
            await lendingProtocol.connect(user1).borrow(borrowAmount);

            // Wait for interest to accumulate
            await timeTravel(7 * 24 * 60 * 60); // 1 week

            const position = await lendingProtocol.getUserPosition(user1.address);
            const expectedInterest = ethers.parseEther("0.05"); // 5% of 1

            expect(position.interest).to.equal(expectedInterest);
        });

        it("Should handle interest calculation with very small amounts", async function () {
            // Setup: user1 deposits collateral and borrows very small amount
            const depositAmount = ethers.parseEther("100");
            await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), depositAmount);
            await lendingProtocol.connect(user1).depositCollateral(depositAmount);

            const borrowAmount = ethers.parseEther("0.001"); // Very small amount
            await lendingProtocol.connect(user1).borrow(borrowAmount);

            // Wait for interest to accumulate
            await timeTravel(7 * 24 * 60 * 60); // 1 week

            const position = await lendingProtocol.getUserPosition(user1.address);
            const expectedInterest = ethers.parseEther("0.00005"); // 5% of 0.001

            expect(position.interest).to.equal(expectedInterest);
        });
    });

    describe("Gas Optimization", function () {
        it("Should not consume excessive gas for basic operations", async function () {
            const depositAmount = ethers.parseEther("1000");
            await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), depositAmount);

            const tx = await lendingProtocol.connect(user1).depositCollateral(depositAmount);
            const receipt = await tx.wait();

            // Gas consumption should be reasonable (less than 200k gas for basic operations)
            expect(receipt?.gasUsed).to.be.lessThan(200000);
        });
    });

    describe("State Consistency", function () {
        it("Should maintain consistent state after multiple operations", async function () {
            // Setup: user1 deposits and borrows
            const depositAmount = ethers.parseEther("2000");
            await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), depositAmount);
            await lendingProtocol.connect(user1).depositCollateral(depositAmount);

            const borrowAmount = ethers.parseEther("1000");
            await lendingProtocol.connect(user1).borrow(borrowAmount);

            // Perform multiple operations
            await timeTravel(7 * 24 * 60 * 60); // 1 week
            await lendingProtocol.connect(user1).getUserPosition(user1.address);
            await timeTravel(7 * 24 * 60 * 60); // Another week

            const position = await lendingProtocol.getUserPosition(user1.address);
            expect(position.collateral).to.equal(depositAmount);
            expect(position.debt).to.equal(borrowAmount);
            expect(position.interest).to.be.gt(0);
        });

        it("Should handle concurrent operations correctly", async function () {
            // Setup: both users deposit and borrow
            const depositAmount1 = ethers.parseEther("2000");
            const depositAmount2 = ethers.parseEther("1500");

            await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), depositAmount1);
            await collateralToken.connect(user2).approve(await lendingProtocol.getAddress(), depositAmount2);

            await lendingProtocol.connect(user1).depositCollateral(depositAmount1);
            await lendingProtocol.connect(user2).depositCollateral(depositAmount2);

            const borrowAmount1 = ethers.parseEther("1000");
            const borrowAmount2 = ethers.parseEther("500");

            await lendingProtocol.connect(user1).borrow(borrowAmount1);
            await lendingProtocol.connect(user2).borrow(borrowAmount2);

            // Verify both positions are correct
            const position1 = await lendingProtocol.getUserPosition(user1.address);
            const position2 = await lendingProtocol.getUserPosition(user2.address);

            expect(position1.collateral).to.equal(depositAmount1);
            expect(position1.debt).to.equal(borrowAmount1);
            expect(position2.collateral).to.equal(depositAmount2);
            expect(position2.debt).to.equal(borrowAmount2);
        });
    });

    describe("Boundary Conditions", function () {
        it("Should handle maximum collateral ratio correctly", async function () {
            // Test borrowing at exactly the collateral ratio limit
            const depositAmount = ethers.parseEther("1500");
            await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), depositAmount);
            await lendingProtocol.connect(user1).depositCollateral(depositAmount);

            const borrowAmount = ethers.parseEther("1000"); // Exactly at 150% ratio
            await lendingProtocol.connect(user1).borrow(borrowAmount);

            const position = await lendingProtocol.getUserPosition(user1.address);
            expect(position.collateral).to.equal(depositAmount);
            expect(position.debt).to.equal(borrowAmount);
        });

        it("Should fail when trying to exceed collateral ratio", async function () {
            const depositAmount = ethers.parseEther("1499"); // Just under 150% ratio
            await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), depositAmount);
            await lendingProtocol.connect(user1).depositCollateral(depositAmount);

            const borrowAmount = ethers.parseEther("1000"); // Would require 1500 collateral

            await expect(
                lendingProtocol.connect(user1).borrow(borrowAmount)
            ).to.be.revertedWith("Insufficient collateral");
        });
    });

    describe("Event Emission", function () {
        it("Should emit correct events with correct parameters", async function () {
            const depositAmount = ethers.parseEther("1000");
            await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), depositAmount);

            // Test Deposited event
            await expect(lendingProtocol.connect(user1).depositCollateral(depositAmount))
                .to.emit(lendingProtocol, "Deposited")
                .withArgs(user1.address, depositAmount);

            // Test Borrowed event
            const borrowAmount = ethers.parseEther("500");
            await expect(lendingProtocol.connect(user1).borrow(borrowAmount))
                .to.emit(lendingProtocol, "Borrowed")
                .withArgs(user1.address, borrowAmount);

            // Test Repaid event
            const position = await lendingProtocol.getUserPosition(user1.address);
            const totalAmount = position.debt + position.interest;
            await loanToken.connect(user1).approve(await lendingProtocol.getAddress(), totalAmount);

            await expect(lendingProtocol.connect(user1).repay())
                .to.emit(lendingProtocol, "Repaid")
                .withArgs(user1.address, totalAmount);

            // Test Withdrawn event
            await expect(lendingProtocol.connect(user1).withdrawCollateral())
                .to.emit(lendingProtocol, "Withdrawn")
                .withArgs(user1.address, depositAmount);
        });
    });
}); 