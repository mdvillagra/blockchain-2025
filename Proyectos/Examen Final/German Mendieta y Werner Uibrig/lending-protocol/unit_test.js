const { expect } = require("chai");

describe_1("LendingProtocol", function () {
  let protocol, collateral, loanToken;
  
  beforeEach(async () => {
    const Collateral = await ethers.getContractFactory("CollateralToken");
    collateral = await Collateral.deploy();
    
    const LoanToken = await ethers.getContractFactory("LoanToken");
    loanToken = await LoanToken.deploy();
    
    const Protocol = await ethers.getContractFactory("LendingProtocol");
    protocol = await Protocol.deploy(collateral.address, loanToken.address);
  });

  it("Should deposit collateral", async () => {
    await collateral.approve(protocol.address, 1000);
    await protocol.depositCollateral(1000);
    const user = await protocol.users(await ethers.provider.getSigner().getAddress());
    expect(user.collateral).to.equal(1000);
  });
});

describe_2("Repay Functionality", () => {
  it("Should calculate fixed interest correctly", async () => {
    // Depositar colateral
    await collateral.approve(protocol.address, 1500);
    await protocol.depositCollateral(1500);
    
    // Solicitar préstamo
    await protocol.borrow(1000);
    const position = await protocol.positions(owner.address);
    
    // Verificar interés
    expect(position.interestAccrued).to.equal(50); // 5% de 1000
  });
});

