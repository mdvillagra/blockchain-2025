require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

module.exports = {
  solidity: "0.8.21",
  networks: {
    ephemery: {
      url: process.env.VITE_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
