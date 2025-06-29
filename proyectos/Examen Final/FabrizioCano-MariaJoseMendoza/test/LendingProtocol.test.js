const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LendingProtocol", function () {
    let owner, user1, user2;
    let CollateralToken, LoanToken, LendingProtocol;
    let collateralToken, loanToken, protocol;

    const oneEth = ethers.utils.parseEther("1");
    const hundredEth = ethers.utils.parseEther("100");
    const fiftyEth = ethers.utils.parseEther("50");

    beforeEach(async () => {
        [owner, user1, user2] = await ethers.getSigners();

        CollateralToken = await ethers.getContractFactory("CollateralToken");
        collateralToken = await CollateralToken.deploy("cUSD", "cUSD");
        await collateralToken.mint(user1.address, hundredEth);
        await collateralToken.mint(user2.address, hundredEth);

        LoanToken = await ethers.getContractFactory("LoanToken");
        loanToken = await LoanToken.deploy("dDAI", "dDAI");
        await loanToken.mint(owner.address, hundredEth);

        LendingProtocol = await ethers.getContractFactory("LendingProtocol");
        protocol = await LendingProtocol.deploy(collateralToken.address, loanToken.address);
    });

    describe("constructor", () => {
        it("should set token addresses correctly", async () => {
            expect(await protocol.collateralToken()).to.equal(collateralToken.address);
            expect(await protocol.loanToken()).to.equal(loanToken.address);
        });

        it("should revert if collateral token is zero address", async () => {
            await expect(
                LendingProtocol.deploy(ethers.constants.AddressZero, loanToken.address)
            ).to.be.revertedWith("Invalid collateral token address");
        });

        it("should revert if loan token is zero address", async () => {
            await expect(
                LendingProtocol.deploy(collateralToken.address, ethers.constants.AddressZero)
            ).to.be.revertedWith("Invalid loan token address");
        });
    });

    describe("depositCollateral", () => {
        it("should deposit collateral successfully", async () => {
            await collateralToken.connect(user1).approve(protocol.address, oneEth);
            await expect(protocol.connect(user1).depositCollateral(oneEth))
                .to.emit(protocol, "CollateralDeposited")
                .withArgs(user1.address, oneEth);

            const user = await protocol.userData(user1.address);
            expect(user.collateralBalance).to.equal(oneEth);
        });

        it("should fail on zero deposit", async () => {
            await expect(protocol.connect(user1).depositCollateral(0)).to.be.revertedWith("Amount must be greater than 0");
        });
    });

    describe("borrow", () => {
        beforeEach(async () => {
            await collateralToken.connect(user1).approve(protocol.address, oneEth);
            await protocol.connect(user1).depositCollateral(oneEth);
            await loanToken.connect(owner).transfer(protocol.address, fiftyEth);
        });

        it("should allow borrowing within limit", async () => {
            const maxLoan = oneEth.mul(100).div(150);
            await expect(protocol.connect(user1).borrow(maxLoan))
                .to.emit(protocol, "LoanBorrowed")
                .withArgs(user1.address, maxLoan);

            const user = await protocol.userData(user1.address);
            expect(user.loanAmount).to.equal(maxLoan);
        });

        it("should revert if loan exceeds limit", async () => {
            const overLoan = oneEth.mul(100).div(150).add(1);
            await expect(protocol.connect(user1).borrow(overLoan)).to.be.revertedWith("Exceeds maximum loan amount");
        });

        it("should revert if protocol lacks liquidity", async () => {
            const protocolNoLiquidity = await LendingProtocol.deploy(collateralToken.address, loanToken.address);
            await collateralToken.connect(user1).approve(protocolNoLiquidity.address, oneEth);
            await protocolNoLiquidity.connect(user1).depositCollateral(oneEth);

            const maxLoan = oneEth.mul(100).div(150);
            await expect(protocolNoLiquidity.connect(user1).borrow(maxLoan)).to.be.revertedWith("Insufficient liquidity");
        });

        it("should revert if amount is zero", async () => {
            await expect(protocol.connect(user1).borrow(0)).to.be.revertedWith("Amount must be greater than 0");
        });
    });

    describe("repay", () => {
        beforeEach(async () => {
            await collateralToken.connect(user1).approve(protocol.address, oneEth);
            await protocol.connect(user1).depositCollateral(oneEth);
            await loanToken.connect(owner).transfer(protocol.address, fiftyEth);
            const loanAmount = oneEth.mul(100).div(150);
            await protocol.connect(user1).borrow(loanAmount);
        });

        it("should repay loan with interest", async () => {
            const loanAmount = oneEth.mul(100).div(150);
            const interest = loanAmount.mul(5).div(100);
            const totalRepayment = loanAmount.add(interest);

            await loanToken.mint(user1.address, totalRepayment);
            await loanToken.connect(user1).approve(protocol.address, totalRepayment);

            await expect(protocol.connect(user1).repay())
                .to.emit(protocol, "LoanRepaid")
                .withArgs(user1.address, loanAmount, interest);

            const user = await protocol.userData(user1.address);
            expect(user.loanAmount).to.equal(0);
        });

        it("should revert if no loan exists", async () => {
            await expect(protocol.connect(user2).repay()).to.be.revertedWith("No active loan");
        });
    });

    describe("repay edge cases and state", () => {
        it("should reset lastUpdateTime and accruedInterest after repay", async () => {
            const loanAmount = oneEth.mul(100).div(150);
            const interest = loanAmount.mul(5).div(100);
            const totalRepayment = loanAmount.add(interest);

            await collateralToken.connect(user1).approve(protocol.address, oneEth);
            await protocol.connect(user1).depositCollateral(oneEth);
            await loanToken.connect(owner).transfer(protocol.address, fiftyEth);
            await protocol.connect(user1).borrow(loanAmount);

            await loanToken.mint(user1.address, totalRepayment);
            await loanToken.connect(user1).approve(protocol.address, totalRepayment);

            await protocol.connect(user1).repay();

            const user = await protocol.userData(user1.address);
            expect(user.loanAmount).to.equal(0);
            expect(user.accruedInterest).to.equal(0);
            expect(user.lastUpdateTime).to.equal(0);
        });
    });

    describe("withdrawCollateral", () => {
        it("should withdraw successfully if no debt", async () => {
            await collateralToken.connect(user1).approve(protocol.address, oneEth);
            await protocol.connect(user1).depositCollateral(oneEth);

            await expect(protocol.connect(user1).withdrawCollateral())
                .to.emit(protocol, "CollateralWithdrawn")
                .withArgs(user1.address, oneEth);

            const user = await protocol.userData(user1.address);
            expect(user.collateralBalance).to.equal(0);
        });

        it("should revert if debt exists", async () => {
            await collateralToken.connect(user1).approve(protocol.address, oneEth);
            await protocol.connect(user1).depositCollateral(oneEth);

            await loanToken.connect(owner).transfer(protocol.address, fiftyEth);
            const loan = oneEth.mul(100).div(150);
            await protocol.connect(user1).borrow(loan);

            await expect(protocol.connect(user1).withdrawCollateral()).to.be.revertedWith("Must repay loan first");
        });

        it("should revert if no collateral deposited", async () => {
            await expect(protocol.connect(user2).withdrawCollateral()).to.be.revertedWith("No collateral to withdraw");
        });
    });

    describe("getMaxBorrowAmount edge cases", () => {
        it("should return 0 if loanAmount >= maxTotal", async () => {
            await collateralToken.connect(user1).approve(protocol.address, oneEth);
            await protocol.connect(user1).depositCollateral(oneEth);
            await loanToken.connect(owner).transfer(protocol.address, fiftyEth);

            const maxTotal = oneEth.mul(100).div(150);
            await protocol.connect(user1).borrow(maxTotal);

            const maxBorrow = await protocol.getMaxBorrowAmount(user1.address);
            expect(maxBorrow).to.equal(0);
        });
    });

    describe("views", () => {
        let loan;

        beforeEach(async () => {
            await collateralToken.connect(user1).approve(protocol.address, oneEth);
            await protocol.connect(user1).depositCollateral(oneEth);
            await loanToken.connect(owner).transfer(protocol.address, fiftyEth);

            loan = oneEth.mul(100).div(150);
            await protocol.connect(user1).borrow(loan);
        });

        it("getUserData returns correct info", async () => {
            const [collateralBalance, currentDebt, accruedInterest] = await protocol.getUserData(user1.address);
            expect(collateralBalance).to.equal(oneEth);
            expect(currentDebt).to.equal(loan);
            expect(accruedInterest).to.equal(loan.mul(5).div(100));
        });

        it("getUserData returns zero interest if no loan", async () => {
            await collateralToken.connect(user2).approve(protocol.address, oneEth);
            await protocol.connect(user2).depositCollateral(oneEth);

            const [, currentDebt, accruedInterest] = await protocol.getUserData(user2.address);
            expect(currentDebt).to.equal(0);
            expect(accruedInterest).to.equal(0);
        });

        it("getUserData returns 0s if user never interacted", async () => {
            const [collateralBalance, currentDebt, accruedInterest] = await protocol.getUserData(owner.address);
            expect(collateralBalance).to.equal(0);
            expect(currentDebt).to.equal(0);
            expect(accruedInterest).to.equal(0);
        });

        it("getMaxBorrowAmount returns positive if maxTotal > loanAmount", async () => {
            await collateralToken.connect(user2).approve(protocol.address, hundredEth);
            await protocol.connect(user2).depositCollateral(hundredEth);

            await loanToken.mint(owner.address, hundredEth);
            await loanToken.connect(owner).transfer(protocol.address, hundredEth);

            const smallLoan = ethers.utils.parseEther("10");
            await protocol.connect(user2).borrow(smallLoan);

            const maxAvailable = await protocol.getMaxBorrowAmount(user2.address);
            expect(maxAvailable).to.be.gt(0);
        });

        it("getTokenAddresses returns correct addresses", async () => {
            const [collateral, loanAddr] = await protocol.getTokenAddresses();
            expect(collateral).to.equal(collateralToken.address);
            expect(loanAddr).to.equal(loanToken.address);
        });
    });
    describe("branch coverage extras", () => {
        it("should revert on borrow if totalDebt equals maxLoan", async () => {
            await collateralToken.connect(user1).approve(protocol.address, oneEth);
            await protocol.connect(user1).depositCollateral(oneEth);
            await loanToken.connect(owner).transfer(protocol.address, fiftyEth);

            const maxLoan = oneEth.mul(100).div(150);
            await protocol.connect(user1).borrow(maxLoan);

            // Intentar pedir incluso 1 wei más
            await expect(protocol.connect(user1).borrow(1)).to.be.revertedWith("Exceeds maximum loan amount");
        });

        it("should return 0 on getMaxBorrowAmount if maxTotal <= loanAmount", async () => {
            await collateralToken.connect(user1).approve(protocol.address, oneEth);
            await protocol.connect(user1).depositCollateral(oneEth);
            await loanToken.connect(owner).transfer(protocol.address, fiftyEth);

            const maxLoan = oneEth.mul(100).div(150);
            await protocol.connect(user1).borrow(maxLoan);

            const maxAmount = await protocol.getMaxBorrowAmount(user1.address);
            expect(maxAmount).to.equal(0);
        });

        it("should allow borrowing again after repayment", async () => {
            await collateralToken.connect(user1).approve(protocol.address, oneEth);
            await protocol.connect(user1).depositCollateral(oneEth);
            await loanToken.connect(owner).transfer(protocol.address, fiftyEth);

            const loanAmount = oneEth.mul(100).div(150);
            const interest = loanAmount.mul(5).div(100);
            const totalRepayment = loanAmount.add(interest);

            await protocol.connect(user1).borrow(loanAmount);
            await loanToken.mint(user1.address, totalRepayment);
            await loanToken.connect(user1).approve(protocol.address, totalRepayment);
            await protocol.connect(user1).repay();

            await expect(protocol.connect(user1).borrow(loanAmount)).to.emit(protocol, "LoanBorrowed");
        });

        it("should revert withdrawCollateral if loan was repaid but no collateral exists", async () => {
            await expect(protocol.connect(user2).withdrawCollateral()).to.be.revertedWith("No collateral to withdraw");
        });

        it("getMaxBorrowAmount returns 0 for users with no collateral", async () => {
            const maxBorrow = await protocol.getMaxBorrowAmount(user2.address);
            expect(maxBorrow).to.equal(0);
        });
    });

    
    
});
