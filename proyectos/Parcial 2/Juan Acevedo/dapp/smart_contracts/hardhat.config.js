require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.28",
  networks: {
    ephemery: {
      url: "https://otter.bordel.wtf/erigon",
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};
