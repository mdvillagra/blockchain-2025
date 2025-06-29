require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

const accounts = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [];

if (!process.env.PRIVATE_KEY) {
  console.warn("Warning: PRIVATE_KEY not set in .env file. Ephemery network will not have any accounts.");
}

module.exports = {
  solidity: {
    compilers: [
      { version: "0.8.20" },
      { version: "0.8.28" },
      { version: "0.8.18" }
    ]
  },
  networks: {
    ephemery: {
      url: "https://otter.bordel.wtf/erigon",
      accounts: [process.env.PRIVATE_KEY]
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: [process.env.PRIVATE_KEY]
    },
  },
};