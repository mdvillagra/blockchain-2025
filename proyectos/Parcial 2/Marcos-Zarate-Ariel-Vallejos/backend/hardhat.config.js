require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); // 👈 Esto importa las


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28", // Versión alineada con tu contrato
  networks: {
    ephemery: {
      url: process.env.RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};
