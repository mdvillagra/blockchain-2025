require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL; // e.g., from Infura/Alchemy
const PRIVATE_KEY = process.env.PRIVATE_KEY; // deployer's wallet private key (no 0x prefix needed)

module.exports = {
  solidity: "0.8.20",
  defaultNetwork: "localhost",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    hardhat: {
      blockGasLimit: 30_000_000,
      gas: 30_000_000,
    },
    coverage: {
      url: "http://127.0.0.1:8555", // Coverage launches its own ganache-cli client
      blockGasLimit: 0x1fffffffffffff,
      allowUnlimitedContractSize: true,
      gas: 0x1fffffffffffff,
      gasPrice: 0x01,
    },
    sepolia: {
      url: SEPOLIA_RPC_URL || "",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    scripts: "./scripts",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
