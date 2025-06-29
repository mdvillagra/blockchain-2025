// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Marketplace is ERC721URIStorage, Ownable {
    struct Listing {
        address owner;
        uint96 price;
        bool isSold;
    }

    uint256 public nextTokenId;
    mapping(uint256 => Listing) public listings;

    event ItemListed(uint256 indexed tokenId, address owner, uint96 price);
    event ItemSold(uint256 indexed tokenId, address buyer);

    constructor() ERC721("NFT Marketplace", "NFTM") {}

    function mintAndList(string memory _uri, uint96 _price) external {
        uint256 tokenId = ++nextTokenId;
        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, _uri);
        listings[tokenId] = Listing(msg.sender, _price, false);
        emit ItemListed(tokenId, msg.sender, _price);
    }

    function buy(uint256 tokenId) external payable {
        Listing storage listing = listings[tokenId];
        require(!listing.isSold, "Already sold");
        require(msg.value >= listing.price, "Insufficient funds");
        require(listing.owner != address(0), "Not listed");

        listing.isSold = true;
        _transfer(listing.owner, msg.sender, tokenId);
        payable(listing.owner).transfer(msg.value);
        emit ItemSold(tokenId, msg.sender);
    }

    function getListing(uint256 tokenId) external view returns (address, uint96, bool) {
        Listing memory l = listings[tokenId];
        return (l.owner, l.price, l.isSold);
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
