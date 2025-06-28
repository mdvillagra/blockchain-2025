const { ethers, network } = require("hardhat");
const { expect } = require('chai');

describe("LendingProtocol", function () {
    let lendingProtocol, collateralToken, loanToken, owner, addr1;

    beforeEach(async function () {
        [owner, addr1] = await ethers.getSigners();

        const CollateralToken = await ethers.getContractFactory("CollateralToken");
        collateralToken = await CollateralToken.deploy();
        await collateralToken.deployed(); // Ya corregido para Ethers v5

        const LoanToken = await ethers.getContractFactory("LoanToken");
        loanToken = await LoanToken.deploy();
        await loanToken.deployed(); // Ya corregido para Ethers v5

        const LendingProtocol = await ethers.getContractFactory("LendingProtocol");
        lendingProtocol = await LendingProtocol.deploy(collateralToken.address, loanToken.address);
        await lendingProtocol.deployed(); // Ya corregido para Ethers v5

        // Mint tokens for testing
        // CORREGIDO: Usar ethers.utils.parseEther
        await collateralToken.mint(addr1.address, ethers.utils.parseEther("1000"));
        // CORREGIDO: Usar ethers.utils.parseEther
        await loanToken.mint(lendingProtocol.address, ethers.utils.parseEther("5000")); // Protocol holds loan tokens
    });

    describe("Deployment", function () {
        it("Should set the right token addresses", async function () {
            expect(await lendingProtocol.collateralToken()).to.equal(collateralToken.address);
            expect(await lendingProtocol.loanToken()).to.equal(loanToken.address);
        });
    });

    describe("Transactions", function () {
        beforeEach(async function () {
            // addr1 approves the protocol to spend its collateral tokens
            // CORREGIDO: Usar ethers.utils.parseEther
            await collateralToken.connect(addr1).approve(lendingProtocol.address, ethers.utils.parseEther("1000"));
        });

        it("Should deposit collateral", async function () {
            // CORREGIDO: Usar ethers.utils.parseEther
            await expect(lendingProtocol.connect(addr1).depositCollateral(ethers.utils.parseEther("150")))
                .to.emit(lendingProtocol, "CollateralDeposited")
                .withArgs(addr1.address, ethers.utils.parseEther("150"));
            const [collateral, ,] = await lendingProtocol.getUserData(addr1.address);
            // CORREGIDO: Usar ethers.utils.parseEther
            expect(collateral).to.equal(ethers.utils.parseEther("150"));
        });

        it("Should fail to deposit zero collateral", async function () {
            await expect(lendingProtocol.connect(addr1).depositCollateral(0)).to.be.revertedWith("Deposit amount must be greater than 0");
        });

        it("Should borrow tokens", async function () {
            // CORREGIDO: Usar ethers.utils.parseEther
            await lendingProtocol.connect(addr1).depositCollateral(ethers.utils.parseEther("150"));
            // CORREGIDO: Usar ethers.utils.parseEther
            await expect(lendingProtocol.connect(addr1).borrow(ethers.utils.parseEther("100"))) // 150 * (100/150) = 100
                .to.emit(lendingProtocol, "LoanBorrowed")
                .withArgs(addr1.address, ethers.utils.parseEther("100"));
            const [, debt, ] = await lendingProtocol.getUserData(addr1.address);
            // CORREGIDO: Usar ethers.utils.parseEther
            expect(debt).to.equal(ethers.utils.parseEther("100"));
            // CORREGIDO: Usar ethers.utils.parseEther
            expect(await loanToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("100"));
        });

        it("Should fail to borrow without collateral", async function () {
            // CORREGIDO: Usar ethers.utils.parseEther
            await expect(lendingProtocol.connect(addr1).borrow(ethers.utils.parseEther("1"))).to.be.revertedWith("No collateral deposited");
        });

        it("Should fail to borrow more than allowed", async function () {
            // CORREGIDO: Usar ethers.utils.parseEther
            await lendingProtocol.connect(addr1).depositCollateral(ethers.utils.parseEther("150"));
            // CORREGIDO: Usar ethers.utils.parseEther
            await expect(lendingProtocol.connect(addr1).borrow(ethers.utils.parseEther("101"))).to.be.revertedWith("Borrow amount exceeds collateral limit");
        });

        it("Should repay the loan with interest", async function() {
            // CORREGIDO: Usar ethers.utils.parseEther
            await lendingProtocol.connect(addr1).depositCollateral(ethers.utils.parseEther("150"));
            // CORREGIDO: Usar ethers.utils.parseEther
            await lendingProtocol.connect(addr1).borrow(ethers.utils.parseEther("100"));

            // Fast forward time by 1 week to accumulate interest
            await network.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
            await network.provider.send("evm_mine");

            const [, , interest] = await lendingProtocol.getUserData(addr1.address);
            // CORREGIDO: Usar ethers.utils.parseEther
            expect(interest).to.equal(ethers.utils.parseEther("5")); // 5% of 100 is 5

            // CORREGIDO: Usar ethers.utils.parseEther
            const totalDebt = ethers.utils.parseEther("105");
            // CORREGIDO: Usar ethers.utils.parseEther
            await loanToken.connect(owner).mint(addr1.address, ethers.utils.parseEther("5")); // Give addr1 the interest amount
            // CORREGIDO: Usar ethers.utils.parseEther
            await loanToken.connect(addr1).approve(lendingProtocol.address, totalDebt);

            await expect(lendingProtocol.connect(addr1).repay())
                .to.emit(lendingProtocol, "LoanRepaid")
                .withArgs(addr1.address, totalDebt);

            const [,, finalInterest] = await lendingProtocol.getUserData(addr1.address);
            expect(finalInterest).to.equal(0);
        });

        it("Should withdraw collateral", async function() {
            // CORREGIDO: Usar ethers.utils.parseEther
            await lendingProtocol.connect(addr1).depositCollateral(ethers.utils.parseEther("150"));
            // CORREGIDO: Usar ethers.utils.parseEther
            await expect(lendingProtocol.connect(addr1).withdrawCollateral())
                .to.emit(lendingProtocol, "CollateralWithdrawn")
                .withArgs(addr1.address, ethers.utils.parseEther("150"));
            const [collateral, , ] = await lendingProtocol.getUserData(addr1.address);
            expect(collateral).to.equal(0);
            // CORREGIDO: Usar ethers.utils.parseEther
            expect(await collateralToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("1000"));
        });

        it("Should fail to withdraw with an active loan", async function() {
            // CORREGIDO: Usar ethers.utils.parseEther
            await lendingProtocol.connect(addr1).depositCollateral(ethers.utils.parseEther("150"));
            // CORREGIDO: Usar ethers.utils.parseEther
            await lendingProtocol.connect(addr1).borrow(ethers.utils.parseEther("100"));
            await expect(lendingProtocol.connect(addr1).withdrawCollateral()).to.be.revertedWith("Cannot withdraw with an active loan");
        });
    });
});