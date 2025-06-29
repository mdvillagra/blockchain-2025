require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      chainId: 1337
    },
    ephemery: {
      url: "https://rpc.bordel.wtf/test",
      accounts: [process.env.PRIVATE_KEY],
    },
    hoodi: {
      url: "https://ethereum-hoodi-rpc.publicnode.com",
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};
