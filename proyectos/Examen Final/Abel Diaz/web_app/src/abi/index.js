// ABIs de los contratos
export { default as LendingProtocolABI } from './LendingProtocol.json'
export { default as CollateralTokenABI } from './CollateralToken.json'
export { default as LoanTokenABI } from './LoanToken.json'

// Función helper para extraer solo el ABI
export const getABI = (contract) => contract.abi
