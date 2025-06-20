require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  networks: {
    alfajores: {
      url: "https://alfajores-forno.celo-testnet.org",
      accounts: [], // tu private key sin comillas dobles si ya es string yo harcodee pero no me voy a regalar tanto XD
    }
  }
};