// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title NFT Marketplace
/// @notice Contrato para la venta y compra de NFTs
contract Marketplace is ERC721, Ownable, ReentrancyGuard {
    uint96 public constant MAX_SUPPLY = 1000;

    struct Listing {
        address seller;
        uint96 price;
        bool isSold;
        string uri;
    }

    mapping(uint256 => Listing) public listings;
    mapping(address => uint256) public pendingWithdrawals;
    mapping(uint256 => string) private _tokenURIs;

    uint256 public listingCount;
    uint256 private _currentTokenId = 0;

    event ItemListed(uint256 tokenId, address seller, uint96 price);
    event ItemSold(uint256 tokenId, address buyer, uint96 price);
    event DebugValueReceived(uint256 value);

    constructor() ERC721("NFT Market", "NFTM") Ownable(msg.sender) {}

    /// @notice Obtiene el URI del token
    /// @param tokenId ID del token
    /// @return URI del token
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(
            bytes(_tokenURIs[tokenId]).length > 0,
            "URI query for nonexistent token"
        );
        return _tokenURIs[tokenId];
    }

    /// @notice Aprueba al marketplace para gestionar sus propios NFTs
    function approveMarketplace() public onlyOwner {
        setApprovalForAll(address(this), true);
    }

    /// @notice Mintea y lista un lote de NFTs
    /// @param _uris Array de URIs de los NFTs
    /// @param _prices Array de precios de los NFTs
    function mintAndList(string[] memory _uris, uint96[] memory _prices) public {
        uint256 batchLength = _uris.length;
        require(batchLength > 0, "Empty batch");
        require(batchLength == _prices.length, "Mismatched inputs");
        require(
            _currentTokenId + batchLength <= MAX_SUPPLY,
            "Max supply exceeded"
        );

        for (uint256 i = 0; i < batchLength; i++) {
            uint256 tokenId = _currentTokenId;
            _mint(address(this), tokenId);
            _tokenURIs[tokenId] = _uris[i];
            listings[tokenId] = Listing(msg.sender, _prices[i], false, _uris[i]);
            emit ItemListed(tokenId, msg.sender, _prices[i]);

            _currentTokenId++;
            listingCount++;
        }
    }

    /// @notice Compra un NFT listado
    /// @param _tokenId ID del token a comprar
    function buy(uint256 _tokenId) public payable nonReentrant {
        emit DebugValueReceived(msg.value);

        Listing storage listing = listings[_tokenId];
        require(listing.price > 0, "NFT no listado");
        require(!listing.isSold, "Already sold");
        require(msg.value == listing.price, "Exact payment required");

        listing.isSold = true;
        pendingWithdrawals[listing.seller] += listing.price;

        _safeTransfer(address(this), msg.sender, _tokenId, "");

        emit ItemSold(_tokenId, msg.sender, listing.price);
    }

    /// @notice Obtiene la información de un listing
    /// @param _tokenId ID del token
    /// @return seller Vendedor del NFT
    /// @return price Precio del NFT
    /// @return isSold Si el NFT está vendido
    /// @return uri URI del NFT
    function getListing(uint256 _tokenId) public view returns (address, uint96, bool, string memory) {
        Listing memory l = listings[_tokenId];
        return (l.seller, l.price, l.isSold, l.uri);
    }

    /// @notice Obtiene el total de NFTs listados
    /// @return Cantidad total de NFTs listados
    function getTotalListings() public view returns (uint256) {
        return listingCount;
    }

    /// @notice Retira los fondos acumulados
    function withdraw() public nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "Nothing to withdraw");

        pendingWithdrawals[msg.sender] = 0;
        
        // Usar call en lugar de transfer para mejor seguridad
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
    }
}
