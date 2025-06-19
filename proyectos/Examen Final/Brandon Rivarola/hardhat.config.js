require('solidity-coverage');
require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = 
{
    networks: 
    {
        sepolia: 
        {
            url: process.env.VITE_RPC_URL,
            accounts: [process.env.PRIVATE_KEY],
        }
    },
    solidity: "0.8.28",
};