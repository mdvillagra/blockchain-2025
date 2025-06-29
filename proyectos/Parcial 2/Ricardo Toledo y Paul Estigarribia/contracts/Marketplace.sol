// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Marketplace is ERC721URIStorage, Ownable {
    uint256 private _tokenIds;
    uint256 public constant MAX_SUPPLY = 10000;

    struct Listing {
        address seller;
        uint96 price;
        bool isSold;
    }

    mapping(uint256 => Listing) public listings;
    mapping(address => uint256) public pendingWithdrawals;

    event ItemListed(uint256 tokenId, address seller, uint96 price);
    event ItemSold(uint256 tokenId, address buyer, uint96 price);

    
    constructor() ERC721("NFT Marketplace", "NFTM") Ownable(msg.sender) {}

    function mintAndList(string memory _uri, uint96 _price) external {
        require(_price > 0, "El precio debe ser mayor a cero");
        require(_tokenIds < MAX_SUPPLY, "Se alcanzo el maximo de NFTs");


        _tokenIds++;
        uint256 newTokenId = _tokenIds;

        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, _uri);

        listings[newTokenId] = Listing({
            seller: msg.sender,
            price: _price,
            isSold: false
        });

        emit ItemListed(newTokenId, msg.sender, _price);
    }

    function buy(uint256 _tokenId) external payable {
        Listing storage item = listings[_tokenId];

        require(!item.isSold, "Este NFT ya fue vendido");
        require(msg.value >= item.price, "Fondos insuficientes");

        item.isSold = true;
        pendingWithdrawals[item.seller] += msg.value;

        _transfer(item.seller, msg.sender, _tokenId);
        emit ItemSold(_tokenId, msg.sender, item.price);
    }

    function getListing(uint256 _tokenId) external view returns (address, uint96, bool) {
        Listing memory item = listings[_tokenId];
        return (item.seller, item.price, item.isSold);
    }

    function withdraw() external {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "Sin fondos para retirar");

        pendingWithdrawals[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }
}
