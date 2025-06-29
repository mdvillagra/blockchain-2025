// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "@openzeppelin/contracts/utils/Strings.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract TokenTreasure2025 is ERC721, Ownable {
    struct Listing {
        address owner;
        uint96 price; // Usamos uint96 para optimizar gas
        bool isSold;
        string uri; // URI del NFT
    }

    mapping(uint256 => Listing) public listings;
    uint256 public nextTokenId = 1;

    event ItemListed(uint256 indexed tokenId, address owner, uint96 price);
    event ItemSold(uint256 indexed tokenId, address buyer);

    constructor() ERC721("TokenTreasure2025", "TTRS") Ownable(msg.sender) {}

    // Mint y listado de NFTs
    function mintAndList(string memory _uri, uint96 _price) external {
        uint256 tokenId = nextTokenId++;
        _safeMint(msg.sender, tokenId);

        listings[tokenId] = Listing(msg.sender, _price, false, _uri);
        emit ItemListed(tokenId, msg.sender, _price);
    }

    // Compra de NFT
    function buy(uint256 tokenId) external payable {
        Listing storage listing = listings[tokenId];
        require(!listing.isSold, "NFT ya vendido");
        require(msg.value >= listing.price, "Fondos insuficientes");

        listing.isSold = true;
        _transfer(listing.owner, msg.sender, tokenId);
        payable(listing.owner).transfer(msg.value);

        emit ItemSold(tokenId, msg.sender);
    }

    // Retiro de fondos por el vendedor
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // Obtener detalles del listado
    function getListing(
        uint256 tokenId
    ) external view returns (address, uint96, bool, string memory ) {
        Listing memory listing = listings[tokenId];
        return (listing.owner, listing.price, listing.isSold, listing.uri);
    }

    //get Full list of NFTs
    function getAllListings() external view returns (Listing[] memory) {
        Listing[] memory allListings = new Listing[](nextTokenId - 1);
        for (uint256 i = 1; i < nextTokenId; i++) {
            allListings[i - 1] = listings[i];
        }
        return allListings;
    }

    // Función para mintear 10 NFTs iniciales
    function mintInitialBatch() external onlyOwner {
        for (uint i = 0; i < 10; i++) {
            uint256 tokenId = nextTokenId++;
            _safeMint(owner(), tokenId);
            string memory uri = string.concat(
                "https://picsum.photos/id/",
                Strings.toString(i),
                "/200/300"
            );
            listings[tokenId] = Listing(owner(), 0.01 ether, false, uri);
            emit ItemListed(tokenId, owner(), 0.01 ether);
        }
    }
}
