require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = 
{
    networks: 
    {
        ephemery: 
        {
            url: process.env.VITE_RPC_URL,
            accounts: [process.env.PRIVATE_KEY],
        }
    },
    solidity: "0.8.28",
};