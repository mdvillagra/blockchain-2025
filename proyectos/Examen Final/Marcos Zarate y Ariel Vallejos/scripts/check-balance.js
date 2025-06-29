const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    const collateralAddress = "0xe3AB3b7C39A86271C04015e00778FBd137a96aAF";
    const Collateral = await ethers.getContractAt("CollateralToken", collateralAddress);

    const balance = await Collateral.balanceOf(deployer.address);
    console.log(`💰 Tu balance de cUSD es: ${ethers.formatEther(balance)} cUSD`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
