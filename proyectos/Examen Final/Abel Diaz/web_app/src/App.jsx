import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Coins, TrendingUp, Activity, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

// Componentes
import WalletConnection from './components/WalletConnection'
import UserDashboard from './components/UserDashboard'
import ActionPanel from './components/ActionPanel'


// Función para cargar ABIs compilados si existen
const loadCompiledABIs = async () => {
  try {
    const { LendingProtocolABI, CollateralTokenABI, getABI } = await import('./abi')
    console.log('📄 ABIs cargados desde archivos compilados')
    return {
      lendingProtocol: getABI(LendingProtocolABI),
      token: getABI(CollateralTokenABI)
    }
  } catch (error) {
    console.warn('⚠️ ABIs compilados no encontrados, usando ABIs básicos')
    return {
      lendingProtocol: LENDING_PROTOCOL_ABI,
      token: TOKEN_ABI
    }
  }
}

// Componente de Toast/Notificaciones
const Toast = ({ message, type, onClose }) => {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Activity
  }
  
  const colors = {
    success: 'bg-green-500/10 border-green-500/30 text-green-400',
    error: 'bg-red-500/10 border-red-500/30 text-red-400',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-400'
  }

  const Icon = icons[type]

  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg border backdrop-blur-md max-w-md ${colors[type]}`}>
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm">{message}</p>
        <button onClick={onClose} className="ml-auto text-current opacity-70 hover:opacity-100">
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function App() {
  const [account, setAccount] = useState(null)
  const [provider, setProvider] = useState(null)
  const [contracts, setContracts] = useState({
    lendingProtocol: null,
    collateralToken: null,
    loanToken: null
  })
  const [userData, setUserData] = useState({
    collateral: '0',
    debt: '0',
    interest: '0'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() })
  }

  const hideToast = () => {
    setToast(null)
  }

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum)
          setProvider(provider)

          // Cargar ABIs compilados o usar fallback
          const abis = await loadCompiledABIs()

          const lendingProtocol = new ethers.Contract(
            import.meta.env.VITE_LENDING_PROTOCOL_ADDRESS,
            abis.lendingProtocol,
            provider.getSigner()
          )

          const collateralToken = new ethers.Contract(
            import.meta.env.VITE_COLLATERAL_TOKEN_ADDRESS,
            abis.token,
            provider.getSigner()
          )

          const loanToken = new ethers.Contract(
            import.meta.env.VITE_LOAN_TOKEN_ADDRESS,
            abis.token,
            provider.getSigner()
          )

          setContracts({
            lendingProtocol,
            collateralToken,
            loanToken
          })

          // Listeners para cambios de cuenta
          window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length > 0) {
              setAccount(accounts[0])
              loadUserData(accounts[0])
            } else {
              setAccount(null)
              setUserData({ collateral: '0', debt: '0', interest: '0' })
            }
          })

          window.ethereum.on('chainChanged', () => {
            window.location.reload()
          })

          // Verificar si ya hay una cuenta conectada
          const accounts = await provider.listAccounts()
          if (accounts.length > 0) {
            setAccount(accounts[0])
            loadUserData(accounts[0])
          }

        } catch (error) {
          console.error('Error inicializando:', error)
          showToast('Error al inicializar la aplicación', 'error')
        }
      } else {
        showToast('MetaMask no detectado. Por favor instala MetaMask.', 'warning')
      }
    }

    init()
  }, [])

  const connectWallet = async () => {
    try {
      setIsLoading(true)
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      setAccount(accounts[0])
      await loadUserData(accounts[0])
      showToast('Wallet conectada exitosamente', 'success')
    } catch (error) {
      console.error('Error conectando wallet:', error)
      showToast('Error al conectar la wallet', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const disconnectWallet = () => {
    setAccount(null)
    setUserData({ collateral: '0', debt: '0', interest: '0' })
    showToast('Wallet desconectada', 'info')
  }

  const loadUserData = async (userAddress) => {
    if (!contracts.lendingProtocol || !userAddress) return

    try {
      setIsDataLoading(true)
      const data = await contracts.lendingProtocol.getUserData(userAddress)
      setUserData({
        collateral: ethers.utils.formatEther(data.collateral),
        debt: ethers.utils.formatEther(data.debt),
        interest: ethers.utils.formatEther(data.interest)
      })
    } catch (error) {
      console.error('Error cargando datos del usuario:', error)
      showToast('Error al cargar los datos del usuario', 'error')
    } finally {
      setIsDataLoading(false)
    }
  }

  const checkAndApproveToken = async (tokenContract, spenderAddress, amount) => {
    try {
      const allowance = await tokenContract.allowance(account, spenderAddress)
      const amountWei = ethers.utils.parseEther(amount)
      
      if (allowance.lt(amountWei)) {
        showToast('Aprobando tokens...', 'info')
        const approveTx = await tokenContract.approve(spenderAddress, ethers.constants.MaxUint256)
        await approveTx.wait()
        showToast('Tokens aprobados exitosamente', 'success')
      }
      return true
    } catch (error) {
      console.error('Error aprobando tokens:', error)
      showToast('Error al aprobar tokens', 'error')
      return false
    }
  }

  const deposit = async (amount) => {
    if (!contracts.lendingProtocol || !amount || !account) return

    try {
      setIsLoading(true)
      
      // Verificar y aprobar tokens si es necesario
      const approved = await checkAndApproveToken(
        contracts.collateralToken, 
        import.meta.env.VITE_LENDING_PROTOCOL_ADDRESS, 
        amount
      )
      
      if (!approved) return

      showToast('Depositando colateral...', 'info')
      const tx = await contracts.lendingProtocol.depositCollateral(ethers.utils.parseEther(amount))
      await tx.wait()
      
      await loadUserData(account)
      showToast(`Colateral de ${amount} cUSD depositado exitosamente`, 'success')
    } catch (error) {
      console.error('Error depositando colateral:', error)
      showToast('Error al depositar colateral', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const borrow = async (amount) => {
    if (!contracts.lendingProtocol || !amount || !account) return

    try {
      setIsLoading(true)
      showToast('Procesando préstamo...', 'info')
      
      const tx = await contracts.lendingProtocol.borrow(ethers.utils.parseEther(amount))
      await tx.wait()
      
      await loadUserData(account)
      showToast(`Préstamo de ${amount} dDAI procesado exitosamente`, 'success')
    } catch (error) {
      console.error('Error pidiendo préstamo:', error)
      if (error.message.includes('Insufficient collateral')) {
        showToast('Colateral insuficiente para el préstamo solicitado', 'error')
      } else {
        showToast('Error al procesar el préstamo', 'error')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const repay = async () => {
    if (!contracts.lendingProtocol || !account) return

    try {
      setIsLoading(true)
      const totalDebt = parseFloat(userData.debt) + parseFloat(userData.interest)
      
      if (totalDebt <= 0) {
        showToast('No tienes deuda pendiente', 'warning')
        return
      }

      // Verificar balance
      const balance = await contracts.loanToken.balanceOf(account)
      const balanceInEther = parseFloat(ethers.utils.formatEther(balance))
      
      if (balanceInEther < totalDebt) {
        showToast(`Balance insuficiente. Necesitas ${totalDebt.toFixed(2)} dDAI`, 'error')
        return
      }

      // Verificar aprobación
      const allowance = await contracts.loanToken.allowance(account, import.meta.env.VITE_LENDING_PROTOCOL_ADDRESS)
      const allowanceInEther = parseFloat(ethers.utils.formatEther(allowance))
      
      if (allowanceInEther < totalDebt) {
        showToast('Aprobando tokens...', 'info')
        // Usar la función approve() del contrato ERC20
        const approveTx = await contracts.loanToken.approve(
          import.meta.env.VITE_LENDING_PROTOCOL_ADDRESS,
          ethers.utils.parseEther(totalDebt.toString())
        )
        await approveTx.wait()
        showToast('Tokens aprobados exitosamente', 'success')
      }

      showToast('Pagando préstamo...', 'info')
      const tx = await contracts.lendingProtocol.repay()
      await tx.wait()
      
      await loadUserData(account)
      showToast(`Préstamo de ${totalDebt.toFixed(2)} dDAI pagado exitosamente`, 'success')
    } catch (error) {
      console.error('Error pagando préstamo:', error)
      showToast('Error al pagar el préstamo', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const withdraw = async () => {
    if (!contracts.lendingProtocol || !account) return

    try {
      setIsLoading(true)
      showToast('Retirando colateral...', 'info')
      
      const tx = await contracts.lendingProtocol.withdrawCollateral()
      await tx.wait()
      
      await loadUserData(account)
      showToast('Colateral retirado exitosamente', 'success')
    } catch (error) {
      console.error('Error retirando colateral:', error)
      if (error.message.includes('Outstanding debt')) {
        showToast('Debes pagar tu deuda antes de retirar el colateral', 'error')
      } else {
        showToast('Error al retirar el colateral', 'error')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const faucetCUSD = async () => {
    if (!contracts.collateralToken || !account) return

    try {
      setIsLoading(true)
      showToast('Obteniendo cUSD del faucet...', 'info')
      
      const tx = await contracts.collateralToken.faucet()
      await tx.wait()
      
      await loadUserData(account)
      showToast('100 cUSD obtenidos exitosamente del faucet', 'success')
    } catch (error) {
      console.error('Error usando faucet cUSD:', error)
      if (error.message.includes('Faucet cooldown not met')) {
        showToast('Debes esperar 1 hora entre usos del faucet', 'warning')
      } else {
        showToast('Error al obtener tokens del faucet', 'error')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const faucetDDAI = async () => {
    if (!contracts.loanToken || !account) return

    try {
      setIsLoading(true)
      showToast('Obteniendo dDAI del faucet...', 'info')
      
      const tx = await contracts.loanToken.faucet()
      await tx.wait()
      
      await loadUserData(account)
      showToast('100 dDAI obtenidos exitosamente del faucet', 'success')
    } catch (error) {
      console.error('Error usando faucet dDAI:', error)
      if (error.message.includes('Faucet cooldown not met')) {
        showToast('Debes esperar 1 hora entre usos del faucet', 'warning')
      } else {
        showToast('Error al obtener tokens del faucet', 'error')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

      {/* Header */}
              <header className="border-b border-slate-800/50 backdrop-blur-md bg-slate-950/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-primary-600 to-primary-500 rounded-lg">
                <Coins className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-100">DeFi Lend</h1>
                <p className="text-xs text-slate-400">Protocolo de Préstamos Descentralizado</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-400">Ephemery Testnet</span>
              </div>
              
              <WalletConnection
                account={account}
                onConnect={connectWallet}
                onDisconnect={disconnectWallet}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!account ? (
          /* Welcome Screen */
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-primary-600 to-primary-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-100 mb-4">
                Bienvenido a DeFi Lend
              </h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
                Deposita cUSD como colateral y obtén préstamos en dDAI con ratios de colateralización del 150%. 
                Sin oráculos externos, con interés fijo del 5% semanal.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full mb-8">
              <div className="defi-card text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-green-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                                  <h3 className="font-semibold text-slate-100 mb-2">Depositar</h3>
                  <p className="text-sm text-slate-400">Deposita cUSD como colateral para habilitar préstamos</p>
              </div>
              
              <div className="defi-card text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-primary-600 to-primary-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Coins className="w-6 h-6 text-white" />
                </div>
                                  <h3 className="font-semibold text-slate-100 mb-2">Pedir Préstamo</h3>
                  <p className="text-sm text-slate-400">Obtén hasta el 66% del valor de tu colateral en dDAI</p>
              </div>
              
              <div className="defi-card text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                                  <h3 className="font-semibold text-slate-100 mb-2">Gestionar</h3>
                  <p className="text-sm text-slate-400">Paga préstamos y retira colateral cuando gustes</p>
              </div>
            </div>

            <WalletConnection
              account={account}
              onConnect={connectWallet}
              onDisconnect={disconnectWallet}
            />
          </div>
        ) : (
          /* Dashboard Principal */
          <div className="space-y-8">
            {/* Título y stats rápidas */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                              <h2 className="text-2xl font-bold text-slate-100">Mi Dashboard</h2>
              <p className="text-slate-400">Gestiona tu posición de préstamos y colateral</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400">Datos en tiempo real</span>
              </div>
            </div>

            {/* Dashboard de métricas */}
            <UserDashboard 
              userData={userData} 
              isLoading={isDataLoading}
            />

            {/* Panel de acciones */}
            <ActionPanel
              userData={userData}
              onDeposit={deposit}
              onBorrow={borrow}
              onRepay={repay}
              onWithdraw={withdraw}
              onFaucetCUSD={faucetCUSD}
              onFaucetDDAI={faucetDDAI}
              isLoading={isLoading}
            />
          </div>
        )}
      </main>

      {/* Footer */}
              <footer className="border-t border-slate-800/50 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-slate-500">
              © 2025 DeFi Lend - Protocolo educativo en Ephemery Testnet
            </div>
                          <div className="flex items-center gap-4 text-sm text-slate-400">
              <span>Ratio de colateralización: 150%</span>
              <span>•</span>
              <span>Interés: 5% semanal</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
