// scripts/accounts.js
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("🧾 Cuenta activa:", deployer.address);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
