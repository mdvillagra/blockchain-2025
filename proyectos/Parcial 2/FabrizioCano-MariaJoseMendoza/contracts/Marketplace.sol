// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Marketplace is ERC721URIStorage, Ownable {
    uint256 public nextTokenId;
    uint256 public listingFee = 0.01 ether;

    struct Listing {
        address seller;
        uint96 price;
        bool isSold;
    }

    mapping(uint256 => Listing) public listings;
    mapping(address => uint256) public pendingWithdrawals;

    event ItemListed(uint256 indexed tokenId, address seller, uint96 price);
    event ItemSold(uint256 indexed tokenId, address buyer);
    event Withdraw(address indexed seller, uint256 amount);

    constructor() ERC721("MiNFT", "MNFT") {}

    function mintAndList(string memory _uri, uint96 _price) external payable {
        require(msg.value >= listingFee, "Listing fee required");
        require(_price > 0, "Price must be greater than 0");

        uint256 tokenId = nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _uri);

        listings[tokenId] = Listing({
            seller: msg.sender,
            price: _price,
            isSold: false
        });

        emit ItemListed(tokenId, msg.sender, _price);
    }

    function buy(uint256 _tokenId) external payable {
        Listing storage listing = listings[_tokenId];
        require(!listing.isSold, "Item already sold");
        require(msg.value >= listing.price, "Not enough ETH sent");

        listing.isSold = true;
        pendingWithdrawals[listing.seller] += msg.value;

        _transfer(listing.seller, msg.sender, _tokenId);
        emit ItemSold(_tokenId, msg.sender);
    }

    function getListing(uint256 _tokenId)
        external
        view
        returns (address seller, uint96 price, bool isSold)
    {
        Listing memory l = listings[_tokenId];
        return (l.seller, l.price, l.isSold);
    }

    function withdraw() external {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds to withdraw");
        pendingWithdrawals[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
        emit Withdraw(msg.sender, amount);
    }
}