// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { token } from "../../typechain-types/@openzeppelin/contracts";

const TokenTreasure2025Module = buildModule("TokenTreasure2025Module", (m) => {
  const tokenModule = m.contract("TokenTreasure2025");
  m.call(tokenModule, "mintInitialBatch");
  return { tokenModule };
});

export default TokenTreasure2025Module;
