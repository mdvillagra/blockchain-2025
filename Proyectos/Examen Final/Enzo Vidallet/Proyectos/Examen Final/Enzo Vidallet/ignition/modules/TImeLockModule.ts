// Hardhat Ignition module to manage deployment of the TimeLock contract

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Default parameters for TimeLock deployment
 */
const DEFAULT_RELEASE_TIME: number = 1893456000; // Jan 1, 2030 (UNIX timestamp)
const DEFAULT_DEPOSIT_WEI: bigint = 1_000_000_000n; // 1 Gwei in wei

/**
 * TimeLockModule
 * Deploys the TimeLock contract with a release time and initial Ether deposit.
 */
const TimeLockModule = buildModule("TimeLockModule", (m) => {
  // UNIX timestamp when the contract unlocks
  const releaseTime: number = m.getParameter(
    "releaseTime",
    DEFAULT_RELEASE_TIME
  );

  // Initial Ether (in wei) to send on deployment
  const depositWei: bigint = m.getParameter(
    "depositWei",
    DEFAULT_DEPOSIT_WEI
  );

  // Deploy the TimeLock contract
  const timeLockDeployment = m.contract(
    "TimeLock",
    [releaseTime],
    { value: depositWei }
  );

  return { timeLockDeployment };
});

export default TimeLockModule;
