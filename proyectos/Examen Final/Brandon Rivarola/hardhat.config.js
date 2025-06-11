require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
};

networks: 
{
  ephemery: 
  {
    url: "https://rpc.ephemery.dev",
    accounts: [process.env.PRIVATE_KEY]
  }
}
