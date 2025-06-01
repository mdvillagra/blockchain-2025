// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Marketplace is ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 public tokenCounter;
    uint96 public constant DECIMALS = 1e18;

    struct Listing {
        address owner;
        address buyer;
        uint96 price;
        bool isSold;
    }

    mapping(uint256 => Listing) public listings; // tokenId => información de la venta
    mapping(address => uint256) public pendingWithdrawals; // Saldo pendiente por retirar para cada vendedor

    event ItemListed(uint256 indexed tokenId, address owner, uint96 price);
    event ItemSold(uint256 indexed tokenId, address buyer, uint96 price);

    constructor() ERC721("NFTMarket", "NFTM") {
        tokenCounter = 0;
    }

    // Permite al usuario mintear un NFT y listarlo para la venta
    function mintAndList(string memory _uri, uint96 _price) external {
        require(_price > 0, "Price must be > 0");

        uint256 tokenId = tokenCounter;
        _mint(msg.sender, tokenId); // Mintear NFT al llamador
        _setTokenURI(tokenId, _uri); // Asignar metadata

        listings[tokenId] = Listing({
            owner: msg.sender,
            buyer: address(0),
            price: _price,
            isSold: false
        });

        tokenCounter++;

        emit ItemListed(tokenId, msg.sender, _price);
    }

    // Compra un NFT listado, usando protección contra reentradas
    function buy(uint256 _tokenId) external payable nonReentrant {
        Listing storage item = listings[_tokenId];
        require(!item.isSold, "Already sold");
        require(msg.value == item.price, "Incorrect price");

        item.isSold = true;
        item.buyer = msg.sender;
        pendingWithdrawals[item.owner] += msg.value;

        _transfer(item.owner, msg.sender, _tokenId);
        emit ItemSold(_tokenId, msg.sender, item.price);
    }

    // Retiro seguro de fondos acumulados por ventas
    function withdraw() external {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds");
        pendingWithdrawals[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }

    // Devuelve los detalles de una venta específica
    function getListing(
        uint256 _tokenId
    ) external view returns (address, address, uint96, bool) {
        Listing memory item = listings[_tokenId];
        return (item.owner, item.buyer, item.price, item.isSold);
    }
}
