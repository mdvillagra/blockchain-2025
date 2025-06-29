import { useEffect, useState } from "react";
import { ethers } from "ethers";
import CollateralABI from "./abis/CollateralToken.json";
import LoanABI from "./abis/LoanToken.json";
import LendingABI from "./abis/LendingProtocol.json";
import contractAddresses from "./deployment-addresses.json";

const CONTRACTS = {
  collateral: {
    address: contractAddresses.collateralTokenAddress,
    abi: CollateralABI.abi,
  },
  loan: {
    address: contractAddresses.loanTokenAddress, 
    abi: LoanABI.abi,
  },
  lending: {
    address: contractAddresses.lendingProtocolAddress, 
    abi: LendingABI.abi,
  },
};

export default function App() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [collateralToken, setCollateralToken] = useState(null);
  const [loanToken, setLoanToken] = useState(null);
  const [lendingProtocol, setLendingProtocol] = useState(null);

  const [isInitialized, setIsInitialized] = useState(false);

  const [balances, setBalances] = useState({
    cUSD: "0",
    dDAI: "0",
    colBal: "0",
    principal: "0",
    interest: "0",
  });

  const [amount, setAmount] = useState("");
  const [action, setAction] = useState("deposit");

  useEffect(() => {
    async function init() {
      try {
        if (!window.ethereum) return alert("Por favor instala MetaMask");
        
        // Usar ethers.providers.Web3Provider para compatibilidad con ethers v5 si es necesario
        // Pero con ethers v6, BrowserProvider es correcto.
        const prov = new ethers.BrowserProvider(window.ethereum);
        const signer = await prov.getSigner();
        const acc = await signer.getAddress();
        
        // VERIFICACIÓN DE RED
        const network = await prov.getNetwork();
        const sepoliaChainId = 11155111n; // El Chain ID de Sepolia como BigInt

        if (network.chainId !== sepoliaChainId) {
          // Si no estamos en Sepolia, mostramos una alerta y detenemos la ejecución.
          alert("Red incorrecta. Por favor, cambia a la red de Sepolia en MetaMask para usar esta DApp.");
          setIsInitialized(false); // Nos aseguramos de que la app no se muestre como inicializada
          return; // Detenemos la función init aquí.
        }

        const c = new ethers.Contract(
          CONTRACTS.collateral.address,
          CONTRACTS.collateral.abi,
          signer
        );
        const l = new ethers.Contract(
          CONTRACTS.loan.address,
          CONTRACTS.loan.abi,
          signer
        );
        const lp = new ethers.Contract(
          CONTRACTS.lending.address,
          CONTRACTS.lending.abi,
          signer
        );

        setProvider(prov);
        setAccount(acc);
        setCollateralToken(c);
        setLoanToken(l);
        setLendingProtocol(lp);

        // ¡Marcamos todo como inicializado!
        setIsInitialized(true); 

      } catch (error) {
        console.error("Fallo en la inicialización:", error);
        alert("No se pudo inicializar la DApp. Revisa la consola.");
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (collateralToken && loanToken && lendingProtocol && account) {
      refreshBalances();
    }
  }, [collateralToken, loanToken, lendingProtocol, account]);

  async function refreshBalances() {
    // Usamos desestructuración de objeto y renombramos las variables
    // para que coincidan con el estado que ya tienes.
    const { 
      _collateralBalance: colBal, 
      _principalDebt: principal, 
      _accruedInterest: interest 
    } = await lendingProtocol.getUserData(account);

    const cUSD = await collateralToken.balanceOf(account);
    const dDAI = await loanToken.balanceOf(account);

    setBalances({
      colBal: ethers.formatUnits(colBal),
      principal: ethers.formatUnits(principal),
      interest: ethers.formatUnits(interest),
      cUSD: ethers.formatUnits(cUSD),
      dDAI: ethers.formatUnits(dDAI),
    });
  }

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleAction() {
    // Guarda de inicialización
    if (!isInitialized || !lendingProtocol || !collateralToken || !loanToken) {
      alert("La aplicación no está lista. Por favor, espera o recarga la página.");
      return;
    }

    // Validación de la cantidad de entrada (para todas las acciones que la requieren)
    if (action !== "withdraw" && action !== "repay" && (!amount || isNaN(amount) || parseFloat(amount) <= 0)) {
      alert("Por favor, introduce una cantidad válida.");
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const weiAmount = ethers.parseUnits(amount || "0");
      let tx;

      if (action === "deposit") {
        const balance = await collateralToken.balanceOf(account);
        if (balance < weiAmount) {
          alert("No tienes suficientes fondos cUSD para depositar esa cantidad.");
          setLoading(false);
          return; 
        }
        
        console.log(`Aprobando ${amount} cUSD para el contrato...`);
        const approveTx = await collateralToken.approve(lendingProtocol.target, weiAmount);
        await approveTx.wait();
        
        console.log("Aprobación confirmada. Depositando colateral...");
        tx = await lendingProtocol.depositCollateral(weiAmount);

      } else if (action === "borrow") {
        tx = await lendingProtocol.borrow(weiAmount);

      } else if (action === "repay") {
        // --- VALIDACIÓN PREVENTIVA DE DEUDA (NUEVO) ---
        const userData = await lendingProtocol.getUserData(account);
        const totalDebt = userData._principalDebt + userData._accruedInterest;

        // 1. Verificamos si realmente hay una deuda que pagar.
        if (totalDebt <= 0) {
          alert("No tienes ninguna deuda pendiente por pagar.");
          setLoading(false);
          return;
        }
        // --- FIN DE LA VALIDACIÓN ---
        
        console.log(`Aprobando ${ethers.formatUnits(totalDebt)} dDAI para el repago...`);
        const approveTx = await loanToken.approve(lendingProtocol.target, totalDebt);
        await approveTx.wait();
        console.log("Aprobación confirmada. Pagando deuda...");
        
        tx = await lendingProtocol.repay();

      } else if (action === "withdraw") {
        // Para 'withdraw', también podrías verificar que no haya deuda pendiente.
        const userData = await lendingProtocol.getUserData(account);
        const totalDebt = userData._principalDebt + userData._accruedInterest;
        if (totalDebt > 0) {
            alert("Debes pagar tu deuda antes de poder retirar el colateral.");
            setLoading(false);
            return;
        }
        tx = await lendingProtocol.withdrawCollateral();
      }

      if (tx) {
        await tx.wait();
      }
      
      console.log("¡Transacción exitosa! Refrescando balances...");
      await refreshBalances();

    } catch (err) {
      console.error(err);
      const errorMessage = err.reason || err.data?.message || err.message || "Error desconocido";
      setError(errorMessage);
      alert("⚠️ Error inesperado: " + errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Lending DApp</h1>
      {account ? (
        <>
          <div className="bg-gray-100 p-4 rounded-xl shadow mb-4">
            <p><strong>Cuenta:</strong> {account}</p>
            <p><strong>cUSD:</strong> {balances.cUSD}</p>
            <p><strong>dDAI:</strong> {balances.dDAI}</p>
            <p><strong>Colateral depositado:</strong> {balances.colBal}</p>
            <p><strong>Deuda:</strong> {balances.principal}</p>
            <p><strong>Interés:</strong> {balances.interest}</p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow">
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="border p-2 mb-2 w-full"
            >
              <option value="deposit">Depositar colateral</option>
              <option value="borrow">Pedir préstamo</option>
              <option value="repay">Pagar deuda</option>
              <option value="withdraw">Retirar colateral</option>
            </select>
            {(action === "deposit" || action === "borrow") && (
              <input
                type="text"
                placeholder="Cantidad"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="border p-2 mb-2 w-full"
              />
            )}
            {error && (
              <div className="bg-red-100 text-red-700 p-2 rounded mb-2">
                {error}
              </div>
            )}
            <button
              onClick={handleAction}
              disabled={loading || !isInitialized} 
              className={`bg-blue-600 text-white px-4 py-2 rounded-xl w-full ${
                (loading || !isInitialized) ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Ejecutando..." : "Ejecutar"}
            </button>
          </div>
        </>
      ) : (
        <p>Conectando con MetaMask...</p>
      )}
    </div>
  );
}
