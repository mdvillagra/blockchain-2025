const hre = require("hardhat");

// Valores por defecto fijos
const INITIAL_DDAI_AMOUNT = "1000"; // 1000 dDAIs para el protocolo
const INITIAL_CUSD_AMOUNT = "100";  // 100 cUSDs para el usuario

async function main() {
  try {
    // Verificar que la dirección del usuario esté configurada
    const userAddress = process.env.USER_ADDRESS;
    if (!userAddress) {
      throw new Error("USER_ADDRESS no está configurada en el archivo .env");
    }

    console.log("\nIniciando despliegue para usuario:", userAddress);

    // Deploy CollateralToken
    const CollateralToken = await hre.ethers.getContractFactory("CollateralToken");
    const collateralToken = await CollateralToken.deploy();
    await collateralToken.waitForDeployment();
    const collateralTokenAddress = await collateralToken.getAddress();
    console.log("CollateralToken deployed to:", collateralTokenAddress);

    // Deploy LoanToken
    const LoanToken = await hre.ethers.getContractFactory("LoanToken");
    const loanToken = await LoanToken.deploy();
    await loanToken.waitForDeployment();
    const loanTokenAddress = await loanToken.getAddress();
    console.log("LoanToken deployed to:", loanTokenAddress);

    // Deploy LendingProtocol
    const LendingProtocol = await hre.ethers.getContractFactory("LendingProtocol");
    const lendingProtocol = await LendingProtocol.deploy(collateralTokenAddress, loanTokenAddress);
    await lendingProtocol.waitForDeployment();
    const lendingProtocolAddress = await lendingProtocol.getAddress();
    console.log("LendingProtocol deployed to:", lendingProtocolAddress);

    // Mint initial tokens to the protocol
    const mintDdaiAmount = hre.ethers.parseEther(INITIAL_DDAI_AMOUNT);
    await loanToken.mint(lendingProtocolAddress, mintDdaiAmount);
    console.log(`Minted ${mintDdaiAmount.toString()} dDAIs to protocol`);

    // Distribuir cUSDs al usuario
    const mintCusdAmount = hre.ethers.parseEther(INITIAL_CUSD_AMOUNT);
    await collateralToken.mint(userAddress, mintCusdAmount);
    console.log(`Minted ${mintCusdAmount.toString()} cUSDs to ${userAddress}`);

    // Distribuir dDAIs al usuario para pruebas
    const mintDdaiToUser = hre.ethers.parseEther("100"); // 100 dDAI para el usuario
    await loanToken.mint(userAddress, mintDdaiToUser);
    console.log(`Minted ${mintDdaiToUser.toString()} dDAIs to ${userAddress}`);

    // Mostrar resumen final
    const addresses = {
      collateralToken: collateralTokenAddress,
      loanToken: loanTokenAddress,
      lendingProtocol: lendingProtocolAddress,
      userAddress: userAddress
    };
    console.log("\nDespliegue completado. Direcciones:");
    console.log(JSON.stringify(addresses, null, 2));

  } catch (error) {
    console.error("Error durante el despliegue:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 