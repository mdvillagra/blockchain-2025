import { ethers } from 'ethers';

// ABI simplificado del contrato Marketplace
export const MARKETPLACE_ABI = [
  "function totalSupply() view returns (uint256)",
  "function getListing(uint256 tokenId) view returns (address owner, uint96 price, bool isSold, string memory tokenURI)",
  "function buy(uint256 tokenId) payable",
  "function mintAndList(string memory tokenURI, uint96 price) external",
  "function mintInitialBatch(string[] memory tokenURIs, uint96[] memory prices) external",
  "event ItemListed(uint256 indexed tokenId, address owner, uint96 price, string tokenURI)",
  "event ItemSold(uint256 indexed tokenId, address buyer, uint96 price)"
];

export const loadContract = async (address, provider) => {
  return new ethers.Contract(address, MARKETPLACE_ABI, provider);
};