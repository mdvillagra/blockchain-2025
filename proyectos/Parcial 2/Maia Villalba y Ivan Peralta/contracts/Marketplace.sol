// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract MarketplaceNFT is ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 public nextTokenId;
    uint96 constant public DECIMALS = 1e18;

    struct Listing {
        address seller;
        uint96 price; // Precio en wei, usa uint96 para ahorro de gas
        bool isSold;
    }

    mapping(uint256 => Listing) public listings;
    mapping(address => uint256) public pendingWithdrawals;

    event ItemListed(uint256 indexed tokenId, address indexed seller, uint96 price);
    event ItemSold(uint256 indexed tokenId, address indexed buyer, uint96 price);

    constructor() ERC721("MarketplaceNFT", "MNFT") {}


    /// @notice Crea y lista un NFT en el mercado
    function mintAndList(string memory _uri, uint256 _price) external {
        require(_price > 0, "El precio debe ser mayor a 0");

        uint256 tokenId = nextTokenId;
        nextTokenId++;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _uri);

        listings[tokenId] = Listing({
            seller: msg.sender,
            price: uint96(_price),
            isSold: false
        });

        emit ItemListed(tokenId, msg.sender, uint96(_price));
    }



    /// @notice Compra un NFT listado
    function buy(uint256 _tokenId) external payable nonReentrant {
        Listing storage item = listings[_tokenId];
        require(!item.isSold, "Ya vendido");
        require(msg.value == item.price, "Monto incorrecto");
        require(item.seller != address(0), "NFT no listado");

        item.isSold = true;
        pendingWithdrawals[item.seller] += msg.value;

        _transfer(item.seller, msg.sender, _tokenId);

        emit ItemSold(_tokenId, msg.sender, item.price);
    }



    /// @notice Devuelve la info de un NFT listado
    function getListing(uint256 _tokenId) external view returns (address seller, uint96 price, bool isSold) {
        Listing storage item = listings[_tokenId];
        return (item.seller, item.price, item.isSold);
    }



    /// @notice Permite al vendedor retirar sus fondos
    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "Sin fondos");

        pendingWithdrawals[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Fallo el retiro");
    }
}


