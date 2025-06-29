export interface UserData {
  collateralAmount: string
  debtAmount: string
  interestAccrued: string
}

export interface ContractAddresses {
  lendingProtocol: string
  collateralToken: string
  loanToken: string
}

export interface WalletState {
  account: string
  provider: any
  signer: any
  isConnected: boolean
}
