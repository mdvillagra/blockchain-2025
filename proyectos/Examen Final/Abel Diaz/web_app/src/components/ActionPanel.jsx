import { useState } from 'react'
import { DollarSign, ArrowDownLeft, ArrowUpRight, PiggyBank, Loader2, Info } from 'lucide-react'
import { clsx } from 'clsx'

const ActionCard = ({ 
  title, 
  description, 
  icon: Icon, 
  onAction, 
  disabled, 
  isLoading, 
  children,
  variant = 'primary'
}) => {
  const variants = {
    primary: 'border-blue-500/30 hover:border-blue-500/50',
    success: 'border-green-500/30 hover:border-green-500/50',
    danger: 'border-red-500/30 hover:border-red-500/50',
    warning: 'border-yellow-500/30 hover:border-yellow-500/50'
  }

  return (
    <div className={clsx(
      'defi-card border-2 transition-all duration-200',
      variants[variant],
      disabled && 'opacity-50 cursor-not-allowed'
    )}>
      <div className="flex items-center gap-3 mb-4">
        <div className={clsx(
          'p-3 rounded-lg',
          variant === 'primary' && 'bg-gradient-to-r from-blue-600 to-blue-500',
          variant === 'success' && 'bg-gradient-to-r from-green-600 to-green-500',
          variant === 'danger' && 'bg-gradient-to-r from-red-600 to-red-500',
          variant === 'warning' && 'bg-gradient-to-r from-yellow-600 to-yellow-500'
        )}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
          <p className="text-sm text-slate-400">{description}</p>
        </div>
      </div>
      
      {children}
    </div>
  )
}

const InfoBox = ({ children, type = 'info' }) => {
  const types = {
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
    error: 'bg-red-500/10 border-red-500/30 text-red-300'
  }

  return (
    <div className={clsx('rounded-lg p-3 border text-sm flex items-start gap-2', types[type])}>
      <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div>{children}</div>
    </div>
  )
}

const ActionPanel = ({ 
  userData, 
  onDeposit, 
  onBorrow, 
  onRepay, 
  onWithdraw,
  onFaucetCUSD,
  onFaucetDDAI,
  isLoading 
}) => {
  const [amounts, setAmounts] = useState({
    deposit: '',
    borrow: ''
  })
  const [activeTab, setActiveTab] = useState('faucet')

  const { collateral, debt, interest } = userData
  const totalDebt = parseFloat(debt) + parseFloat(interest)
  const availableToBorrow = Math.max(0, (parseFloat(collateral) * 0.66) - totalDebt)
  const canWithdraw = totalDebt === 0 && parseFloat(collateral) > 0

  const handleAmountChange = (type, value) => {
    // Solo permitir números y puntos decimales
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmounts(prev => ({ ...prev, [type]: value }))
    }
  }

  const handleAction = async (action, amount) => {
    try {
      switch (action) {
        case 'deposit':
          await onDeposit(amount)
          break
        case 'borrow':
          await onBorrow(amount)
          break
        case 'repay':
          await onRepay()
          break
        case 'withdraw':
          await onWithdraw()
          break
        case 'faucetCUSD':
          await onFaucetCUSD()
          break
        case 'faucetDDAI':
          await onFaucetDDAI()
          break
      }
      // Limpiar inputs después de una acción exitosa
      setAmounts({ deposit: '', borrow: '' })
    } catch (error) {
      console.error(`Error en ${action}:`, error)
    }
  }

  const tabs = [
    { id: 'faucet', label: 'Obtener Tokens', icon: DollarSign },
    { id: 'deposit', label: 'Depositar', icon: ArrowDownLeft },
    { id: 'borrow', label: 'Pedir Préstamo', icon: DollarSign },
    { id: 'repay', label: 'Pagar', icon: ArrowUpRight },
    { id: 'withdraw', label: 'Retirar', icon: PiggyBank }
  ]

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-900/50 p-1 rounded-lg">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={clsx(
              'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all duration-200',
              activeTab === id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="font-medium">{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex justify-center">
        <div className="w-full max-w-lg">
        {activeTab === 'faucet' && (
          <ActionCard
            title="Obtener Tokens de Prueba"
            description="Obtén tokens gratuitos para probar la aplicación"
            icon={DollarSign}
            variant="primary"
          >
            <div className="space-y-4">
              <InfoBox>
                Obtén 100 tokens gratuitos cada hora para probar la aplicación. 
                Necesitas cUSD para depositar como colateral y dDAI para pagar préstamos.
              </InfoBox>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => handleAction('faucetCUSD')}
                  disabled={isLoading}
                  className="defi-button-success disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Procesando...
                    </>
                  ) : (
                    'Obtener 100 cUSD'
                  )}
                </button>

                <button
                  onClick={() => handleAction('faucetDDAI')}
                  disabled={isLoading}
                  className="defi-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Procesando...
                    </>
                  ) : (
                    'Obtener 100 dDAI'
                  )}
                </button>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-3">
                <h4 className="text-sm font-medium text-slate-300 mb-2">¿Cómo usar los tokens?</h4>
                <ul className="text-xs text-slate-400 space-y-1">
                  <li>• <strong>cUSD:</strong> Úsalo como colateral para pedir préstamos</li>
                  <li>• <strong>dDAI:</strong> Úsalo para pagar préstamos (principal + interés)</li>
                  <li>• Puedes obtener tokens cada hora</li>
                </ul>
              </div>
            </div>
          </ActionCard>
        )}

        {activeTab === 'deposit' && (
          <ActionCard
            title="Depositar Colateral"
            description="Deposita cUSD como colateral para poder pedir préstamos"
            icon={ArrowDownLeft}
            variant="success"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Cantidad a depositar
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={amounts.deposit}
                    onChange={(e) => handleAmountChange('deposit', e.target.value)}
                    placeholder="0.00"
                    className="defi-input pr-16"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    cUSD
                  </div>
                </div>
              </div>
              
              <InfoBox>
                El colateral te permite pedir prestado hasta el 66% de su valor. 
                A mayor colateral, mayor capacidad de préstamo.
              </InfoBox>

              <button
                onClick={() => handleAction('deposit', amounts.deposit)}
                disabled={!amounts.deposit || parseFloat(amounts.deposit) <= 0 || isLoading}
                className="defi-button-success w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Procesando...
                  </>
                ) : (
                  `Depositar ${amounts.deposit || '0'} cUSD`
                )}
              </button>
            </div>
          </ActionCard>
        )}

        {activeTab === 'borrow' && (
          <ActionCard
            title="Pedir Préstamo"
            description="Solicita un préstamo en dDAI usando tu colateral"
            icon={DollarSign}
            variant="primary"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Cantidad a pedir prestado
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={amounts.borrow}
                    onChange={(e) => handleAmountChange('borrow', e.target.value)}
                    placeholder="0.00"
                    className="defi-input pr-16"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    dDAI
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Disponible para préstamo:</span>
                  <span className="text-slate-200">{availableToBorrow.toFixed(2)} dDAI</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Interés (5% semanal):</span>
                  <span className="text-yellow-400">
                    {amounts.borrow ? (parseFloat(amounts.borrow) * 0.05).toFixed(2) : '0.00'} dDAI
                  </span>
                </div>
              </div>
              
              {availableToBorrow <= 0 ? (
                <InfoBox type="warning">
                  Necesitas depositar colateral para poder pedir un préstamo.
                </InfoBox>
              ) : parseFloat(amounts.borrow) > availableToBorrow ? (
                <InfoBox type="error">
                  La cantidad solicitada excede tu límite de préstamo disponible.
                </InfoBox>
              ) : (
                <InfoBox>
                  Ratio de colateralización requerido: 150%. 
                  El interés se calcula semanalmente y se añade a tu deuda.
                </InfoBox>
              )}

              <button
                onClick={() => handleAction('borrow', amounts.borrow)}
                disabled={
                  !amounts.borrow || 
                  parseFloat(amounts.borrow) <= 0 || 
                  parseFloat(amounts.borrow) > availableToBorrow ||
                  isLoading
                }
                className="defi-button-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Procesando...
                  </>
                ) : (
                  `Pedir prestado ${amounts.borrow || '0'} dDAI`
                )}
              </button>
            </div>
          </ActionCard>
        )}

        {activeTab === 'repay' && (
          <ActionCard
            title="Pagar Préstamo"
            description="Paga tu deuda completa (capital + interés)"
            icon={ArrowUpRight}
            variant="warning"
          >
            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Deuda principal:</span>
                  <span className="text-slate-200">{parseFloat(debt).toFixed(2)} dDAI</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Interés acumulado:</span>
                  <span className="text-yellow-400">{parseFloat(interest).toFixed(2)} dDAI</span>
                </div>
                <hr className="border-slate-700" />
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-200">Total a pagar:</span>
                  <span className="text-red-400">{totalDebt.toFixed(2)} dDAI</span>
                </div>
              </div>
              
              {totalDebt <= 0 ? (
                <InfoBox type="info">
                  No tienes deuda pendiente en este momento.
                </InfoBox>
              ) : (
                <InfoBox type="warning">
                  Al pagar completarás tu deuda y podrás retirar tu colateral.
                  Asegúrate de tener suficientes dDAI en tu wallet.
                </InfoBox>
              )}

              <button
                onClick={() => handleAction('repay')}
                disabled={totalDebt <= 0 || isLoading}
                className="defi-button-danger w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Procesando...
                  </>
                ) : (
                  `Pagar ${totalDebt.toFixed(2)} dDAI`
                )}
              </button>
            </div>
          </ActionCard>
        )}

        {activeTab === 'withdraw' && (
          <ActionCard
            title="Retirar Colateral"
            description="Retira tu colateral depositado"
            icon={PiggyBank}
            variant="success"
          >
            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Colateral total:</span>
                  <span className="text-slate-200">{parseFloat(collateral).toFixed(2)} cUSD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Disponible para retirar:</span>
                  <span className="text-green-400">
                    {canWithdraw ? parseFloat(collateral).toFixed(2) : '0.00'} cUSD
                  </span>
                </div>
              </div>
              
              {!canWithdraw && totalDebt > 0 ? (
                <InfoBox type="warning">
                  Debes pagar tu deuda completa antes de poder retirar el colateral.
                </InfoBox>
              ) : !canWithdraw ? (
                <InfoBox type="info">
                  No tienes colateral depositado para retirar.
                </InfoBox>
              ) : (
                <InfoBox>
                  Puedes retirar todo tu colateral ya que no tienes deuda pendiente.
                </InfoBox>
              )}

              <button
                onClick={() => handleAction('withdraw')}
                disabled={!canWithdraw || isLoading}
                className="defi-button-success w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Procesando...
                  </>
                ) : (
                  `Retirar ${canWithdraw ? parseFloat(collateral).toFixed(2) : '0.00'} cUSD`
                )}
              </button>
            </div>
          </ActionCard>
        )}
        </div>
      </div>
    </div>
  )
}

export default ActionPanel 