require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    ephemery: {
      url: "https://rpc.sepolia.org",
      aaccounts: ["fb6c17b88f45dc56548655c9a6b8ab278f6c51247e42a92c89fdbacf12b3ba7a"] , 
    }
  }
};