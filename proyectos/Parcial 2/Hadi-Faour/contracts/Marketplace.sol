// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract Marketplace is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct Listing {
        address owner;
        uint96 price;
        bool isSold;
        string tokenURI;
    }

    mapping(uint256 => Listing) private _listings;
    event ItemListed(uint256 indexed tokenId, address owner, uint96 price, string tokenURI);
    event ItemSold(uint256 indexed tokenId, address buyer, uint96 price);

    constructor() ERC721("NFTMarketplace", "NFTM") {}

    // Core Functions
    function mintAndList(string memory tokenURI, uint96 price) public {
        require(price > 0, "Price must be > 0");
        
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        _safeMint(msg.sender, newTokenId);
        _listings[newTokenId] = Listing(msg.sender, price, false, tokenURI);
        _setApprovalForAll(msg.sender, address(this), true);
        
        emit ItemListed(newTokenId, msg.sender, price, tokenURI);
    }

    function buy(uint256 tokenId) external payable {
        Listing storage listing = _listings[tokenId];
        require(listing.owner != address(0), "NFT does not exist");
        require(!listing.isSold, "NFT already sold");
        require(msg.value == listing.price, "Incorrect payment");
        require(msg.sender != listing.owner, "Cannot buy your own NFT");

        listing.isSold = true;
        _transfer(listing.owner, msg.sender, tokenId);
        
        (bool sent, ) = listing.owner.call{value: msg.value}("");
        require(sent, "Failed to send ETH");
        
        emit ItemSold(tokenId, msg.sender, listing.price);
    }

    // View Functions
    function getListing(uint256 tokenId) external view returns (
        address owner,
        uint96 price,
        bool isSold,
        string memory tokenURI
    ) {
        Listing memory listing = _listings[tokenId];
        require(listing.owner != address(0), "NFT does not exist");
        return (listing.owner, listing.price, listing.isSold, listing.tokenURI);
    }

    function totalSupply() external view returns (uint256) {
        return _tokenIds.current();
    }

    // Admin Functions
    function mintInitialBatch(string[] memory tokenURIs, uint96[] memory prices) external onlyOwner {
        require(tokenURIs.length == prices.length, "Array length mismatch");
        require(tokenURIs.length <= 10, "Max 10 NFTs per batch");

        for (uint i = 0; i < tokenURIs.length; i++) {
            mintAndList(tokenURIs[i], prices[i]);
        }
    }

    function withdraw() external onlyOwner {
        (bool sent, ) = owner().call{value: address(this).balance}("");
        require(sent, "Withdrawal failed");
    }
}