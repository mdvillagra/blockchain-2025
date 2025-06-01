// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Marketplace is ERC721URIStorage, Ownable {
    uint256 public tokenCounter;
    uint96 constant FEE_DENOMINATOR = 1 ether;

    struct Listing {
        address owner;
        uint256 price;
        bool isSold;
    }

    mapping(uint256 => Listing) public listings;
    mapping(address => uint256) public balances;

    event ItemListed(uint256 tokenId, address owner, uint256 price);
    event ItemSold(uint256 tokenId, address buyer, uint256 price);

    constructor() ERC721("MyNFT", "MNFT") Ownable(msg.sender) {
        tokenCounter = 0;
    }

    function mintAndList(string memory _uri, uint256 _price) public {
        require(_price > 0, "Price must be positive");

        uint256 tokenId = tokenCounter++;
        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, _uri);

        listings[tokenId] = Listing(msg.sender, _price, false);
        emit ItemListed(tokenId, msg.sender, _price);
    }

    function buy(uint256 _tokenId) public payable {
        Listing storage item = listings[_tokenId];
        require(!item.isSold, "Item already sold");
        require(msg.value >= item.price, "Insufficient funds");

        item.isSold = true;
        balances[item.owner] += msg.value;

        _transfer(item.owner, msg.sender, _tokenId);
        emit ItemSold(_tokenId, msg.sender, item.price);
    }

    function withdraw() public {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "Nothing to withdraw");
        balances[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }

    function getListing(uint256 _tokenId) public view returns (address, uint256, bool) {
        Listing memory item = listings[_tokenId];
        return (item.owner, item.price, item.isSold);
    }
}
