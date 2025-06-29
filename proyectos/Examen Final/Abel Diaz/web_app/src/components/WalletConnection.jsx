import { useState, useEffect, useRef } from 'react'
import { Wallet, ChevronDown, LogOut, Copy, ExternalLink } from 'lucide-react'
import { clsx } from 'clsx'

const WalletConnection = ({ account, onConnect, onDisconnect }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const formatAddress = (address) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      // Aquí podrías agregar un toast de confirmación
    } catch (err) {
      console.error('Error al copiar:', err)
    }
  }

  const openInEtherscan = () => {
    window.open(`https://ephemery.dev/address/${account}`, '_blank')
  }

  // Cerrar dropdown cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  if (!account) {
    return (
      <button
        onClick={onConnect}
        className="defi-button-primary flex items-center gap-2"
      >
        <Wallet className="w-4 h-4" />
        Conectar Wallet
      </button>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={clsx(
          'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
          'status-connected border'
        )}
      >
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span className="font-mono text-sm">{formatAddress(account)}</span>
        <ChevronDown className={clsx(
          'w-4 h-4 transition-transform',
          isDropdownOpen && 'rotate-180'
        )} />
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 defi-card z-20">
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-sm font-medium text-green-400">Conectado</span>
            </div>
            <div className="font-mono text-xs text-slate-300 break-all">
              {account}
            </div>
          </div>
          
          <div className="p-2">
            <button
              onClick={() => copyToClipboard(account)}
              className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800 transition-colors text-sm"
            >
              <Copy className="w-4 h-4" />
              Copiar dirección
            </button>
            
            
            
            <hr className="my-2 border-slate-700" />
            
            <button
              onClick={() => {
                onDisconnect?.()
                setIsDropdownOpen(false)
              }}
              className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              Desconectar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default WalletConnection 