import React, { useState, useEffect, useCallback } from 'react'; // <-- AÑADIDO: useCallback
import { ethers } from 'ethers'; // Solo importa ethers
import './App.css'; // Si tienes estilos CSS

// --- IMPORTA TUS ABIs Y DIRECCIONES AQUÍ ---
// Asegúrate de que las rutas sean correctas según donde los hayas copiado
import LendingProtocolABI from './contracts/LendingProtocol.json';
import CollateralTokenABI from './contracts/CollateralToken.json';
import LoanTokenABI from './contracts/LoanToken.json';
import contractAddresses from './contracts/contract-addresses.json'; // Archivo con las direcciones desplegadas

// Define las direcciones de tus contratos (ajusta según tu archivo contract-addresses.json)
const LENDING_PROTOCOL_ADDRESS = contractAddresses.LendingProtocol;
const COLLATERAL_TOKEN_ADDRESS = contractAddresses.CollateralToken;
const LOAN_TOKEN_ADDRESS = contractAddresses.LoanToken;

function App() {
    // --- Estados de la Aplicación ---
    const [currentAccount, setCurrentAccount] = useState(null);
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);

    // Instancias de los contratos
    const [lendingProtocolContract, setLendingProtocolContract] = useState(null);
    const [collateralTokenContract, setCollateralTokenContract] = useState(null);
    const [loanTokenContract, setLoanTokenContract] = useState(null);

    // Datos del usuario en el protocolo
    const [userCollateral, setUserCollateral] = useState("0");
    const [userDebt, setUserDebt] = useState("0");
    const [userInterest, setUserInterest] = useState("0");
    const [userCollateralTokenBalance, setUserCollateralTokenBalance] = useState("0");
    const [userLoanTokenBalance, setUserLoanTokenBalance] = useState("0");

    // Inputs para las transacciones
    const [depositAmount, setDepositAmount] = useState("");
    const [borrowAmount, setBorrowAmount] = useState("");


    // --- Funciones de Conexión a MetaMask (envueltas en useCallback) ---
    // useCallback se usa para que estas funciones no se recreen en cada render,
    // lo que evita la advertencia de 'useEffect' y posibles bucles infinitos.
    const checkIfWalletIsConnected = useCallback(async () => {
        try {
            const { ethereum } = window;
            if (!ethereum) {
                alert("Asegúrate de tener MetaMask instalado!");
                return;
            }
            const accounts = await ethereum.request({ method: "eth_accounts" });
            if (accounts.length !== 0) {
                const account = accounts[0];
                setCurrentAccount(account);
                setupEthers(ethereum);
            }
        } catch (error) {
            console.error("Error al verificar conexión:", error);
        }
    }, []); // <-- DEPENDENCIAS: Vacío porque no depende de variables externas que cambien

    const setupEthers = useCallback(async (ethereum) => {
        const provider = new ethers.BrowserProvider(ethereum);
        setProvider(provider);

        const signer = await provider.getSigner();
        setSigner(signer);

        // --- Inicializar instancias de los contratos ---
        // CORREGIDO: Acceder a la propiedad .abi del JSON importado
        const lending = new ethers.Contract(LENDING_PROTOCOL_ADDRESS, LendingProtocolABI.abi, signer);
        setLendingProtocolContract(lending);

        const collateral = new ethers.Contract(COLLATERAL_TOKEN_ADDRESS, CollateralTokenABI.abi, signer);
        setCollateralTokenContract(collateral);

        const loan = new ethers.Contract(LOAN_TOKEN_ADDRESS, LoanTokenABI.abi, signer);
        setLoanTokenContract(loan);

        // Cargar datos iniciales del usuario después de que los contratos estén listos
        fetchUserData(lending, collateral, loan, signer.address);

        // Escuchar cambios de cuenta/red en MetaMask
        ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length > 0) {
                setCurrentAccount(accounts[0]);
                // Si la cuenta cambia, re-configuramos ethers para obtener el nuevo signer
                setupEthers(ethereum); // Llamada recursiva para re-establecer el provider/signer
            } else {
                setCurrentAccount(null);
                setSigner(null);
                setLendingProtocolContract(null);
                setCollateralTokenContract(null);
                setLoanTokenContract(null);
                // Limpiar todos los estados relacionados con el usuario
                setUserCollateral("0");
                setUserDebt("0");
                setUserInterest("0");
                setUserCollateralTokenBalance("0");
                setUserLoanTokenBalance("0");
            }
        });

        ethereum.on('chainChanged', (chainId) => {
            console.log("Red cambiada a:", chainId);
            window.location.reload(); // Recargar para adaptarse a la nueva red
        });
    }, []); // <-- DEPENDENCIAS: Vacío porque las setters no cambian y ethereum es global

    // --- Efecto para verificar la conexión de MetaMask al cargar ---
    useEffect(() => {
        checkIfWalletIsConnected();
    }, [checkIfWalletIsConnected]); // <-- CORREGIDO: Añadido checkIfWalletIsConnected como dependencia


    const connectWallet = async () => {
        try {
            const { ethereum } = window;
            if (!ethereum) {
                alert("¡Necesitas MetaMask para usar esta dApp!");
                return;
            }
            const accounts = await ethereum.request({ method: "eth_requestAccounts" });
            setCurrentAccount(accounts[0]);
            setupEthers(ethereum);
        } catch (error) {
            console.error("Error al conectar cartera:", error);
        }
    };

    // --- Funciones para interactuar con el Contrato y obtener datos ---

    const fetchUserData = async (lending, collateral, loan, account) => {
        if (!lending || !collateral || !loan || !account) return;
        try {
            // Datos del protocolo de préstamo
            const [collateralAmount, debtAmount, interestAmount] = await lending.getUserData(account);
            setUserCollateral(ethers.formatEther(collateralAmount));
            setUserDebt(ethers.formatEther(debtAmount));
            setUserInterest(ethers.formatEther(interestAmount));

            // Balances de los tokens ERC20
            const userCollateralBal = await collateral.balanceOf(account);
            const userLoanBal = await loan.balanceOf(account);
            setUserCollateralTokenBalance(ethers.formatEther(userCollateralBal));
            setUserLoanTokenBalance(ethers.formatEther(userLoanBal));

        } catch (error) {
            console.error("Error al obtener datos del usuario:", error);
            alert(`Error al cargar datos: ${error.message}`);
        }
    };

    const handleDeposit = async () => {
        if (!signer || !lendingProtocolContract || !collateralTokenContract || !depositAmount) {
            alert("Por favor, conecta tu cartera e ingresa una cantidad.");
            return;
        }
        try {
            const amountInWei = ethers.parseEther(depositAmount);
            const approveTx = await collateralTokenContract.connect(signer).approve(LENDING_PROTOCOL_ADDRESS, amountInWei);
            await approveTx.wait();
            console.log("Aprobación exitosa:", approveTx.hash);

            const depositTx = await lendingProtocolContract.connect(signer).depositCollateral(amountInWei);
            await depositTx.wait();
            console.log("Depósito exitoso:", depositTx.hash);

            alert("Colateral depositado exitosamente!");
            setDepositAmount(""); // Limpiar input
            // Actualizar datos después de la transacción
            fetchUserData(lendingProtocolContract, collateralTokenContract, loanTokenContract, currentAccount);
        } catch (error) {
            console.error("Error al depositar colateral:", error);
            alert(`Error al depositar: ${error.reason || error.message}`);
        }
    };

    const handleBorrow = async () => {
        if (!signer || !lendingProtocolContract || !borrowAmount) {
            alert("Por favor, conecta tu cartera e ingresa una cantidad.");
            return;
        }
        try {
            const amountToBorrowInWei = ethers.parseEther(borrowAmount);
            const borrowTx = await lendingProtocolContract.connect(signer).borrow(amountToBorrowInWei);
            await borrowTx.wait();
            console.log("Préstamo exitoso:", borrowTx.hash);

            alert("Préstamo realizado exitosamente!");
            setBorrowAmount(""); // Limpiar input
            // Actualizar datos después de la transacción
            fetchUserData(lendingProtocolContract, collateralTokenContract, loanTokenContract, currentAccount);
        } catch (error) {
            console.error("Error al pedir prestado:", error);
            alert(`Error al pedir prestado: ${error.reason || error.message}`);
        }
    };

    const handleRepay = async () => {
        if (!signer || !lendingProtocolContract || !loanTokenContract) {
            alert("Por favor, conecta tu cartera.");
            return;
        }
        try {
            // Obtener la deuda total (principal + interés) para aprobar
            const [, debt, interest] = await lendingProtocolContract.getUserData(currentAccount);
            const totalDebtToRepay = debt + interest; // Suma BigInt

            if (totalDebtToRepay === 0n) { 
                alert("No tienes deuda activa para repagar.");
                return;
            }

            // 1. Aprobar al protocolo para gastar los tokens de préstamo
            const approveTx = await loanTokenContract.connect(signer).approve(LENDING_PROTOCOL_ADDRESS, totalDebtToRepay);
            await approveTx.wait();
            console.log("Aprobación de repago exitosa:", approveTx.hash);

            // 2. Repagar el préstamo
            const repayTx = await lendingProtocolContract.connect(signer).repay();
            await repayTx.wait();
            console.log("Repago exitoso:", repayTx.hash);

            alert("Préstamo repagado exitosamente!");
            // Actualizar datos después de la transacción
            fetchUserData(lendingProtocolContract, collateralTokenContract, loanTokenContract, currentAccount);
        } catch (error) {
            console.error("Error al repagar préstamo:", error);
            alert(`Error al repagar: ${error.reason || error.message}`);
        }
    };

    const handleWithdrawCollateral = async () => {
        if (!signer || !lendingProtocolContract) {
            alert("Por favor, conecta tu cartera.");
            return;
        }
        try {
            const withdrawTx = await lendingProtocolContract.connect(signer).withdrawCollateral();
            await withdrawTx.wait();
            console.log("Retiro de colateral exitoso:", withdrawTx.hash);

            alert("Colateral retirado exitosamente!");
            // Actualizar datos después de la transacción
            fetchUserData(lendingProtocolContract, collateralTokenContract, loanTokenContract, currentAccount);
        } catch (error) {
            console.error("Error al retirar colateral:", error);
            alert(`Error al retirar: ${error.reason || error.message}`);
        }
    };


    // --- Renderizado de la Interfaz ---
    return (
        <div className="App">
            <header className="App-header">
                <h1>Protocolo de Préstamos Descentralizado</h1>
                {!currentAccount ? (
                    <button onClick={connectWallet}>Conectar Cartera</button>
                ) : (
                    <div>
                        <p>Cuenta conectada: <strong>{currentAccount}</strong></p>
                        {/* CORREGIDO: Asegurarse de que provider.network exista antes de acceder a chainId */}
                        <p>Red (Chain ID): <strong>{provider && provider.network ? provider.network.chainId.toString() : 'Cargando...'}</strong></p>

                        <hr />

                        <h2>Tus Balances de Tokens</h2>
                        <p>Balance de cUSD: <strong>{userCollateralTokenBalance}</strong></p>
                        <p>Balance de dDAI: <strong>{userLoanTokenBalance}</strong></p>
                        {/* Pasar los contratos actuales a fetchUserData al hacer clic */}
                        <button onClick={() => fetchUserData(lendingProtocolContract, collateralTokenContract, loanTokenContract, currentAccount)}>
                            Actualizar Balances
                        </button>

                        <hr />

                        <h2>Tus Datos en el Protocolo</h2>
                        <p>Colateral Depositado: <strong>{userCollateral} cUSD</strong></p>
                        <p>Deuda Actual: <strong>{userDebt} dDAI</strong></p>
                        <p>Interés Acumulado: <strong>{userInterest} dDAI</strong></p>
                        {/* Pasar los contratos actuales a fetchUserData al hacer clic */}
                        <button onClick={() => fetchUserData(lendingProtocolContract, collateralTokenContract, loanTokenContract, currentAccount)}>
                            Actualizar Datos del Protocolo
                        </button>

                        <hr />

                        <section>
                            <h3>Depositar Colateral (cUSD)</h3>
                            <input
                                type="number"
                                placeholder="Cantidad de cUSD"
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(e.target.value)}
                            />
                            <button onClick={handleDeposit}>Depositar</button>
                        </section>

                        <hr />

                        <section>
                            <h3>Pedir Préstamo (dDAI)</h3>
                            <input
                                type="number"
                                placeholder="Cantidad de dDAI"
                                value={borrowAmount}
                                onChange={(e) => setBorrowAmount(e.target.value)}
                            />
                            <button onClick={handleBorrow}>Pedir Préstamo</button>
                        </section>

                        <hr />

                        <section>
                            <h3>Repagar Préstamo</h3>
                            <p>Deberás aprobar el total de la deuda (principal + interés) en dDAI.</p>
                            <button onClick={handleRepay}>Repagar</button>
                        </section>

                        <hr />

                        <section>
                            <h3>Retirar Colateral</h3>
                            <p>Solo puedes retirar colateral si no tienes un préstamo activo.</p>
                            <button onClick={handleWithdrawCollateral}>Retirar Todo el Colateral</button>
                        </section>

                    </div>
                )}
            </header>
        </div>
    );
}

export default App;