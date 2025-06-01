// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract Marketplace is ERC721, Ownable {
    using Strings for uint256;
    
    struct Listing {
        address owner;
        uint96 price;
        bool isSold;
    }
    
    uint256 private _tokenIds;
    mapping(uint256 => Listing) private _listings;
    mapping(address => uint256) private _balances;
    mapping(uint256 => string) private _tokenURIs;
    
    event ItemListed(uint256 indexed tokenId, address indexed owner, uint96 price);
    event ItemSold(uint256 indexed tokenId, address indexed buyer, uint96 price);
    
    constructor() ERC721("NFTMarketplace", "NFTM") Ownable(msg.sender) {}
    
    function mintAndList(string memory _uri, uint96 _price) external {
        require(_price > 0, "Price must be greater than 0");
        require(bytes(_uri).length > 0, "URI must not be empty");
        
        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        
        _safeMint(msg.sender, newTokenId);
        _tokenURIs[newTokenId] = _uri;
        _listings[newTokenId] = Listing(msg.sender, _price, false);
        
        emit ItemListed(newTokenId, msg.sender, _price);
    }
    
    function buy(uint256 _tokenId) external payable {
        Listing storage listing = _listings[_tokenId];
        
        require(listing.owner != address(0), "Token does not exist");
        require(!listing.isSold, "Already sold");
        require(msg.value >= listing.price, "Insufficient payment");
        
        address seller = listing.owner;
        uint96 price = listing.price;
        
        listing.isSold = true;
        listing.owner = msg.sender;
        
        _transfer(seller, msg.sender, _tokenId);
        
        // Add to seller's balance
        _balances[seller] += price;
        
        // Refund excess payment
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }
        
        emit ItemSold(_tokenId, msg.sender, price);
    }
    
    function getListing(uint256 _tokenId) external view 
        returns (address owner, uint96 price, bool isSold) 
    {
        Listing memory listing = _listings[_tokenId];
        return (listing.owner, listing.price, listing.isSold);
    }
    
    function withdraw() external {
        uint256 balance = _balances[msg.sender];
        require(balance > 0, "No funds to withdraw");
        
        _balances[msg.sender] = 0;
        payable(msg.sender).transfer(balance);
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        
        // Return the stored URI if it exists, otherwise return a default
        if (bytes(_tokenURIs[tokenId]).length > 0) {
            return _tokenURIs[tokenId];
        }
        
        // Default URI for tokens minted through mintInitialBatch
        return string(abi.encodePacked(
            "https://ipfs.io/ipfs/QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/",
            tokenId.toString()
        ));
    }
    
    // Helper function to mint initial batch
    function mintInitialBatch() external onlyOwner {
        for (uint256 i = 0; i < 10; i++) {
            _tokenIds++;
            uint256 newTokenId = _tokenIds;
            
            _safeMint(owner(), newTokenId);
            
            // Don't set URI - let tokenURI() return the default
            // This saves gas by not storing redundant data
            
            // List with prices from 0.01 to 0.1 ETH
            uint96 price = uint96(0.01 ether + (i * 0.01 ether));
            _listings[newTokenId] = Listing(owner(), price, false);
            
            emit ItemListed(newTokenId, owner(), price);
        }
    }
}