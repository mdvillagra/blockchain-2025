// Addresses and ABIs for the DeFi Lending Protocol on Sepolia

/**
 * Contract addresses deployed on Sepolia
 */
export const CONTRACT_ADDRESSES = {
  collateralToken: "0xBb0d0E7534Cb381e1aE0a02bA5c0105f0c79B4E9",
  loanToken:       "0x8343444CED87979dde24d9F6d0f68B3854664Db9",
  lendingProtocol: "0x2E4eb9887127Ae7138Ee7A3E39C1D4Dc2E101fB7",
};

/**
 * Sepolia Chain ID (hex)
 */
export const SEPOLIA_CHAIN_ID = "0xaa36a7";

/**
 * ABI for the Lending Protocol contract
 */
export const LENDING_PROTOCOL_ABI = [
  "function depositCollateral(uint256 amount) external",
  "function borrow(uint256 amount) external",
  "function repay() external",
  "function withdrawCollateral() external",
  "function getUserData(address user) external view returns (uint256, uint256, uint256)",
  "function collateralToken() external view returns (address)",
  "function loanToken() external view returns (address)",
];

/**
 * ABI for ERC20 token contracts with mint capability
 */
export const TOKEN_ABI = [
  "function balanceOf(address owner) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function mint(address to, uint256 amount) external",
];
