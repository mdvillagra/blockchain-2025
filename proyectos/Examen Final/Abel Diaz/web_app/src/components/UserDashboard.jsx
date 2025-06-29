import { DollarSign, TrendingUp, Shield, AlertCircle, PiggyBank } from 'lucide-react'

const MetricCard = ({ title, value, subtitle, icon: Icon, trend, color = 'primary' }) => {
  const colorClasses = {
    primary: 'from-primary-600 to-primary-500',
    green: 'from-green-600 to-green-500',
    red: 'from-red-600 to-red-500',
    yellow: 'from-yellow-600 to-yellow-500'
  }

  return (
    <div className="metric-card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-gradient-to-r ${colorClasses[color]} text-white`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-400">{title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-100">{value}</span>
              {trend && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  trend > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {trend > 0 ? '+' : ''}{trend}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      {subtitle && (
        <p className="text-sm text-slate-400">{subtitle}</p>
      )}
    </div>
  )
}

const HealthFactor = ({ collateral, debt, interest }) => {
  const totalDebt = parseFloat(debt) + parseFloat(interest)
  const collateralValue = parseFloat(collateral)
  
  // Calcular el health factor (ratio de colateralización)
  const healthFactor = totalDebt > 0 ? (collateralValue / totalDebt) : 0
  const healthPercentage = Math.min((healthFactor / 1.5) * 100, 100) // 1.5 es el ratio mínimo (150%)
  
  const getHealthColor = () => {
    if (healthFactor >= 2) return 'text-green-400'
    if (healthFactor >= 1.5) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getHealthStatus = () => {
    if (totalDebt === 0) return 'Sin deuda'
    if (healthFactor >= 2) return 'Muy saludable'
    if (healthFactor >= 1.5) return 'Saludable'
    return 'En riesgo'
  }

  return (
    <div className="metric-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 text-white">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-400">Factor de Salud</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-2xl font-bold ${getHealthColor()}`}>
              {totalDebt > 0 ? healthFactor.toFixed(2) : '∞'}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${getHealthColor().replace('text-', 'bg-').replace('400', '500/20')} ${getHealthColor()}`}>
              {getHealthStatus()}
            </span>
          </div>
        </div>
      </div>
      
      {totalDebt > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Ratio de colateralización</span>
            <span className={getHealthColor()}>{(healthFactor * 100).toFixed(0)}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                healthFactor >= 2 ? 'bg-green-500' : 
                healthFactor >= 1.5 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(healthPercentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500">Mínimo requerido: 150%</p>
        </div>
      )}
    </div>
  )
}

const UserDashboard = ({ userData, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="metric-card">
            <div className="animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-slate-800 rounded-lg"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-800 rounded w-24"></div>
                  <div className="h-6 bg-slate-800 rounded w-16"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const { collateral, debt, interest } = userData
  const totalDebt = parseFloat(debt) + parseFloat(interest)
  const availableToBorrow = Math.max(0, (parseFloat(collateral) * 0.66) - totalDebt)
  const availableToWithdraw = totalDebt > 0 ? 0 : parseFloat(collateral)

  return (
    <div className="space-y-6">
      {/* Alerta si está cerca del liquidation ratio */}
      {totalDebt > 0 && (parseFloat(collateral) / totalDebt) < 1.6 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-yellow-400 mb-1">Advertencia de Colateralización</h4>
            <p className="text-sm text-yellow-300">
              Tu ratio de colateralización está cerca del mínimo requerido. Considera añadir más colateral o pagar parte de tu deuda.
            </p>
          </div>
        </div>
      )}

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Colateral Depositado"
          value={`${parseFloat(collateral).toFixed(2)}`}
          subtitle="cUSD"
          icon={PiggyBank}
          color="green"
        />
        
        <MetricCard
          title="Deuda Actual"
          value={`${parseFloat(debt).toFixed(2)}`}
          subtitle="dDAI"
          icon={DollarSign}
          color="red"
        />
        
        <MetricCard
          title="Interés Acumulado"
          value={`${parseFloat(interest).toFixed(2)}`}
          subtitle="dDAI (5% semanal)"
          icon={TrendingUp}
          color="yellow"
        />
        
        <MetricCard
          title="Disponible para Préstamo"
          value={`${availableToBorrow.toFixed(2)}`}
          subtitle="dDAI (máx. 66% del colateral)"
          icon={DollarSign}
          color="primary"
        />
      </div>

      {/* Factor de salud */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <HealthFactor 
          collateral={collateral}
          debt={debt}
          interest={interest}
        />
        
        <MetricCard
          title="Total a Pagar"
          value={`${totalDebt.toFixed(2)}`}
          subtitle="dDAI (deuda + interés)"
          icon={DollarSign}
          color="red"
        />
        
        <MetricCard
          title="Disponible para Retirar"
          value={`${availableToWithdraw.toFixed(2)}`}
          subtitle="cUSD (sin deuda activa)"
          icon={PiggyBank}
          color="green"
        />
      </div>
    </div>
  )
}

export default UserDashboard 