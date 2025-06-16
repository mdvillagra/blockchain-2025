// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Marketplace is ERC721URIStorage, Ownable {
    uint256 public tokenId;
    uint96 public constant fee = 500; // 5%
    address public feeReceiver;

    struct Listing {
        address seller;
        uint96 price;
        bool isSold;
    }

    mapping(uint256 => Listing) public listings;
    mapping(address => uint256) public balances;

    event ItemListed(uint256 tokenId, address seller, uint96 price);
    event ItemSold(uint256 tokenId, address buyer, uint96 price);

    constructor() ERC721("MyNFT", "MNFT") Ownable(msg.sender) {
        feeReceiver = msg.sender;
    }



    function mintAndList(string memory uri, uint96 price) public {
        require(price > 0, "Price must be > 0");
        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
        listings[tokenId] = Listing(msg.sender, price, false);
        emit ItemListed(tokenId, msg.sender, price);
        tokenId++;
    }

    function buy(uint256 id) public payable {
        Listing storage item = listings[id];
        require(!item.isSold, "Already sold");
        require(msg.value == item.price, "Incorrect value");
        item.isSold = true;
        _transfer(item.seller, msg.sender, id);
        uint256 feeAmount = (msg.value * fee) / 10000;
        balances[item.seller] += msg.value - feeAmount;
        balances[feeReceiver] += feeAmount;
        emit ItemSold(id, msg.sender, item.price);
    }

    function getListing(uint256 id) external view returns (address, uint96, bool) {
        Listing memory item = listings[id];
        return (item.seller, item.price, item.isSold);
    }

    function withdraw() public {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "Nothing to withdraw");
        balances[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }
}