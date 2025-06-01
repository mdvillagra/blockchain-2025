// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Marketplace is ERC721URIStorage, Ownable {
    uint256 private _tokenIds;

    struct Listing {
        address owner;
        uint256 price;
        bool isSold;
    }

    mapping(uint256 => Listing) private _listings;
    mapping(address => uint256) private _balances;

    event ItemListed(uint256 indexed tokenId, address indexed owner, uint256 price);
    event ItemSold(uint256 indexed tokenId, address indexed buyer, uint256 price);

    constructor() ERC721("NFTMarketplace", "NFTM") Ownable(msg.sender) {}

    //mint con URI y registro en el marketplace
    function mintAndList(string memory _uri, uint256 _price) external {
        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        _mint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, _uri);
        _listings[newTokenId] = Listing(msg.sender, _price, false);
        emit ItemListed(newTokenId, msg.sender, _price);
    }

    //compra que acumula saldo para el vendedor (sin transfer directa)
    function buy(uint256 _tokenId) external payable {
        Listing storage listing = _listings[_tokenId];
        listing.isSold = true;
        _balances[listing.owner] += msg.value;
        _transfer(listing.owner, msg.sender, _tokenId);
        emit ItemSold(_tokenId, msg.sender, listing.price);
    }

    //vista para el cliente
    function getListing(uint256 _tokenId) external view returns (address, uint256, bool) {
        Listing memory listing = _listings[_tokenId];
        return (listing.owner, listing.price, listing.isSold);
    }
    
    //para que el frontend pueda consultar el estado actual. 
    function getCurrentTokenId() external view returns (uint256) {
        return _tokenIds;
    }

    //retiro por vendedor, no por owner global
    function withdraw() external {
        uint256 amount = _balances[msg.sender];
        _balances[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }

    //para que el frontend pueda consultar el balance actual.
    function getBalance(address seller) external view returns (uint256) {
        return _balances[seller];
    }

}
