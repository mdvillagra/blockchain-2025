require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); // Para cargar las variables de entorno del .env

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28", // Podés usar una versión reciente, esta está bien
  networks: {
    hardhat: { // Red local para pruebas rápidas
    },
    ephemery: {
      url: "https://otter.bordel.wtf/erigon",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    }
  }
};