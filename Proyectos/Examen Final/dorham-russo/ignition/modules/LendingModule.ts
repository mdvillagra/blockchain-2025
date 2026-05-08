import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "ethers";

const LendingModule = buildModule("LendingModule", (m) => {
    const collateralToken = m.contract("CollateralToken");
    const loanToken = m.contract("LoanToken");
    const lendingProtocol = m.contract("LendingProtocol", [
        collateralToken,
        loanToken,
    ]);
    m.call(loanToken, "transfer", [
        lendingProtocol,
        ethers.parseEther("10000"), // 10k dDAI para el pool
    ]);

    return { lendingProtocol, collateralToken, loanToken };
});

export default LendingModule;
