require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  networks: {
    ephemery: {
      url: "https://otter.bordel.wtf/erigon",
      accounts: [
        "e331b6d69882b4f92e5e0c13d349be193cc92c2b0c68b278b8cecfac45b2eeb2" // esta es la buena
      ]
    }
  }
};
