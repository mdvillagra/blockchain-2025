require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    holesky: {
      url: process.env.HOLESKY_RPC_URL || "https://ethereum-holesky.publicnode.com",
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 20000000000, //  con 20 Gwei, o hasta 30 Gwei (30000000000)
      gasLimit: 8000000
    }
  }
};