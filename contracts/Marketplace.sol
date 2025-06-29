// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract Marketplace is ERC721URIStorage /* , Ownable */ { // Descomenta ", Ownable" si lo usas
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct Listing {
        address seller;
        uint256 price;
        bool isSold;
    }

    mapping(uint256 => Listing) private listings;
    mapping(address => uint256) private proceeds;

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

    constructor() ERC721("MyNFT", "MNFT") {}


    /**
     * @dev Mints and lists a single NFT in the marketplace.
     * @param _uri Metadata URI for the NFT.
     * @param _price Price in wei (must be > 0).
     */
    function mintAndList(string memory _uri, uint256 _price) external {
        require(_price > 0, "Price must be > 0");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _mint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, _uri);

        listings[newTokenId] = Listing({
            seller: msg.sender,
            price: _price,
            isSold: false
        });

        emit ItemListed(newTokenId, msg.sender, _price);
    }

    /**
     * @dev Mints and lists multiple NFTs in a single transaction.
     * @param _uris Array of metadata URIs for the NFTs.
     * @param _prices Array of prices in wei for the NFTs. Prices must be > 0.
     * The length of _uris and _prices arrays must be the same and > 0.
     */
    // Descomenta "onlyOwner" si quieres restringir esta función al dueño del contrato
    function batchMintAndList(string[] memory _uris, uint256[] memory _prices) external /* onlyOwner */ {
        require(_uris.length == _prices.length, "URIs and prices array length mismatch");
        require(_uris.length > 0, "Cannot mint zero items");

        for (uint256 i = 0; i < _uris.length; i++) {
            require(_prices[i] > 0, "Price must be > 0 for all items");

            _tokenIds.increment();
            uint256 newTokenId = _tokenIds.current();

            _mint(msg.sender, newTokenId); // Mints to the caller (e.g., contract owner or an admin)
            _setTokenURI(newTokenId, _uris[i]);

            listings[newTokenId] = Listing({
                seller: msg.sender, // The caller becomes the seller for all minted items
                price: _prices[i],
                isSold: false
            });

            emit ItemListed(newTokenId, msg.sender, _prices[i]);
        }
    }


    /**
     * @dev Buys a listed NFT.
     * @param _tokenId ID of the token to buy.
     */
    function buy(uint256 _tokenId) external payable {
        Listing storage item = listings[_tokenId];

        require(_tokenId > 0 && _tokenId <= _tokenIds.current(), "Invalid tokenId");
        require(!item.isSold, "Already sold");
        require(msg.value == item.price, "Incorrect price");
        require(item.seller != address(0), "Item not listed");

        address originalSeller = item.seller;
        item.isSold = true;
        proceeds[originalSeller] += msg.value;
        _transfer(originalSeller, msg.sender, _tokenId);

        emit ItemSold(_tokenId, msg.sender, msg.value);
    }

    /**
     * @dev Returns listing information for a token.
     */
    function getListing(uint256 _tokenId)
        external
        view
        returns (
            address seller,
            uint256 price,
            bool isSold
        )
    {
        require(_tokenId > 0 && _tokenId <= _tokenIds.current(), "Query for non-existent token");
        Listing storage item = listings[_tokenId];
        return (item.seller, item.price, item.isSold);
    }

    /**
     * @dev Allows a seller to withdraw their accumulated funds.
     */
    function withdraw() external {
        uint256 amount = proceeds[msg.sender];
        require(amount > 0, "No funds to withdraw");

        proceeds[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed.");
    }

    /**
     * @dev Returns the ID of the latest minted token.
     * Returns 0 if no tokens have been minted.
     */
    function getLatestTokenId() external view returns (uint256) {
        return _tokenIds.current();
    }

    
}