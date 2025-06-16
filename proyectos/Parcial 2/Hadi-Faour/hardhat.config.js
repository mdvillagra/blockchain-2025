require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.19",
  networks: {
    ephemery: {
      url: process.env.VITE_RPC_URL || "https://rpc.ephemery.dev",
      accounts: [process.env.PRIVATE_KEY]
    },
    // Configuración para testing local
    hardhat: {
      chainId: 1337
    }
  }
};