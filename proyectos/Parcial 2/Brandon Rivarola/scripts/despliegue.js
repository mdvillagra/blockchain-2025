async function main() 
{
    const Marketplace = await ethers.getContractFactory("Marketplace");
    const marketplace = await Marketplace.deploy();
    console.log("Marketplace desplegado en:",marketplace.target);
}

main().catch((error) => 
{
    console.error(error);
    process.exitCode = 1;
});