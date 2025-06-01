import dotenv from "dotenv";
dotenv.config();
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    ephemery: {
      url: "https://otter.bordel.wtf/erigon",
      accounts: [process.env.PRIVATE_KEY ?? ""],
    },
  },
};

export default config;
