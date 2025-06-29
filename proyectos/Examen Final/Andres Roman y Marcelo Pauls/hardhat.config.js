require("@nomicfoundation/hardhat-toolbox");
require("solidity-coverage");
require("dotenv").config();

const fs = require('fs');

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {},
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  paths: {
    sources: "./contracts", // <-- Solo compila los .sol en contracts/
    tests: "./test", // <-- Solo ejecuta tests en test/
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 200000,
  },
};

task("mint", "Acuña una cantidad de tokens cUSD o dDAI a una dirección específica")
  .addParam("token", "El símbolo del token a acuñar (cusd o ddai)")
  .addParam("to", "La dirección que recibirá los tokens")
  .addParam("amount", "La cantidad de tokens a acuñar (sin decimales, ej: 1000)")
  .setAction(async (taskArgs, hre) => {
    const { ethers } = hre;
    const { token, to, amount } = taskArgs;

    // 1. Cargar las direcciones de los contratos desde el archivo JSON
    const addresses = JSON.parse(fs.readFileSync("./web_app/src/deployment-addresses.json", "utf8"));

    let tokenContract;
    let tokenSymbol;

    // 2. Seleccionar el contrato y el símbolo correcto basado en el argumento --token
    if (token.toLowerCase() === 'cusd') {
      const CollateralToken = await ethers.getContractFactory("CollateralToken");
      tokenContract = CollateralToken.attach(addresses.collateralTokenAddress);
      tokenSymbol = 'cUSD';
    } else if (token.toLowerCase() === 'ddai') {
      const LoanToken = await ethers.getContractFactory("LoanToken");
      tokenContract = LoanToken.attach(addresses.loanTokenAddress);
      tokenSymbol = 'dDAI';
    } else {
      console.error("Token no válido. Usa 'cusd' o 'ddai'.");
      return;
    }

    const signer = await ethers.provider.getSigner();
    const signerAddress = await signer.getAddress();
    console.log(`Usando la cuenta del firmante (${signerAddress}) para la acuñación...`);
    
    // 3. Preparar la cantidad a acuñar
    const amountToMint = ethers.parseUnits(amount, 18);

    // 4. Ejecutar la transacción de mint
    console.log(`Acuñando ${amount} ${tokenSymbol} para la dirección ${to}...`);

    const tx = await tokenContract.mint(to, amountToMint);
    console.log("Transacción enviada, hash:", tx.hash);

    await tx.wait();
    console.log("¡Transacción confirmada!");

    const balance = await tokenContract.balanceOf(to);
    console.log(`Nuevo saldo de ${tokenSymbol} de ${to}: ${ethers.formatUnits(balance)}`);
  });
