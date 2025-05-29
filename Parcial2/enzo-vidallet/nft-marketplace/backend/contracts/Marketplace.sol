// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NFTMarketplace is ERC721URIStorage, ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    Counters.Counter private _itemsSold;

    address payable owner;
    uint256 public listingPrice = 0.025 ether;

    struct MarketItem {
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
    }

    mapping(uint256 => MarketItem) private idToMarketItem;

    event MarketItemCreated (
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool sold
    );

    event MarketItemSold (
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price
    );

    constructor() ERC721("NFT Marketplace", "NFTM") {
        owner = payable(msg.sender);
    }

    function mintAndList(string memory tokenURI, uint256 price) public payable nonReentrant {
        require(price > 0, "Price must be at least 1 wei");
        require(msg.value == listingPrice, "Must pay listing price");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _mint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        idToMarketItem[newTokenId] = MarketItem(
            newTokenId,
            payable(msg.sender),
            payable(address(this)),
            price,
            false
        );

        _transfer(msg.sender, address(this), newTokenId);
        emit MarketItemCreated(newTokenId, msg.sender, address(this), price, false);
    }

    function buy(uint256 tokenId) public payable nonReentrant {
        uint256 price = idToMarketItem[tokenId].price;
        address seller = idToMarketItem[tokenId].seller;

        require(msg.value == price, "Please submit the asking price");
        require(seller != address(0), "Item not for sale");

        idToMarketItem[tokenId].owner = payable(msg.sender);
        idToMarketItem[tokenId].sold = true;
        idToMarketItem[tokenId].seller = payable(address(0));
        _itemsSold.increment();

        _transfer(address(this), msg.sender, tokenId);
        payable(seller).transfer(msg.value);
        emit MarketItemSold(tokenId, seller, msg.sender, price);
    }

    function getListing(uint256 tokenId) public view returns (address, uint256, bool) {
        MarketItem memory item = idToMarketItem[tokenId];
        return (item.owner, item.price, item.sold);
    }

    function withdraw() public nonReentrant {
        require(msg.sender == owner, "Only owner can withdraw");
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success, "Transfer failed");
    }

    // Función adicional para precargar NFTs
    function mintInitialBatch(string[] memory tokenURIs, uint256[] memory prices) public payable {
        require(tokenURIs.length == prices.length, "Arrays length mismatch");
        require(tokenURIs.length <= 10, "Max 10 items");

        for(uint i = 0; i < tokenURIs.length; i++) {
            mintAndList(tokenURIs[i], prices[i]);
        }
    }

    function getCurrentTokenId() public view returns (uint256) {
        return _tokenIds.current();
    }
}