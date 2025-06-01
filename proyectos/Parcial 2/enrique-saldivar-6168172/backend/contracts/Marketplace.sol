// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract Marketplace is ERC721, ERC721URIStorage, Ownable {
  
  uint256 private _tokenIdCounter;

  struct Listing {
    address owner;
    uint256 price;
    bool isSold;
    address seller;
  }

  mapping (uint256 => Listing) public listings;

  event ItemListed(
    uint256 indexed tokenId,
    address indexed seller,
    uint256 price
  );

  event ItemSold(
    uint256 indexed tokenId,
    address indexed buyer,
    uint256 price
  );

  constructor(address initialOwner) ERC721("Marketplace", "MKT") Ownable(initialOwner) {
  }
  // Function to mint a new NFT
  function mintAndList(string memory _uri, uint256 _price) public onlyOwner {
    require(_price > 0, "El precio debe ser mayor que 0");

    _tokenIdCounter += 1;
    uint256 newTokenId = _tokenIdCounter;

    _safeMint(msg.sender, newTokenId);
    _setTokenURI(newTokenId, _uri);

    listings[newTokenId] = Listing({
        owner: msg.sender,
        price: _price,
        isSold: false,
        seller: msg.sender
    });

    emit ItemListed(newTokenId, msg.sender, _price);
}
  function buy(uint256 tokenId) public payable {
    Listing storage listing = listings[tokenId];
    require(listing.owner != address(0), "NFT no existe");
    require(!listing.isSold, "NFT ya vendido");
    require(msg.value >= listing.price, "Precio insuficiente");
    require(msg.sender != listing.seller, "No puedes comprar tu propio NFT");
    require(ownerOf(tokenId) == listing.owner, "El propietario no es el vendedor");

    address seller = listing.seller;

    // Actualizar estado antes de la transferencia
    listing.isSold = true;
    
    // Transfer the NFT to the buyer
    _transfer(listing.owner, msg.sender, tokenId);

    // Pay the seller
    (bool success, ) = seller.call{value: listing.price}("");
    require(success, "Error al transferir el pago al vendedor");

    // Emit the ItemSold event
    emit ItemSold(tokenId, msg.sender, listing.price);
  }

  function getListing(uint256 tokenId) public view returns (address owner, uint256 price, bool isSold) {
    require(tokenId > 0 && tokenId <= _tokenIdCounter, "NFT no existe");

    Listing storage listing = listings[tokenId];
    return (listing.owner, listing.price, listing.isSold);
  }

  function withdraw() public onlyOwner {
    uint256 balance = address(this).balance;
    require(balance > 0, "No hay fondos para retirar");

    (bool success, ) = payable(owner()).call{value: balance}("");
    require(success, "Error al retirar los fondos");
  }
  function _baseURI() internal view virtual override returns (string memory) {
    return "";
  }  function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
    return super.tokenURI(tokenId);
  }
  
  
  // Para obtener la cantidad total de tokens
  function totalTokens() public view returns (uint256) {
    return _tokenIdCounter;
  }
  

  function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC721, ERC721URIStorage)
    returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}