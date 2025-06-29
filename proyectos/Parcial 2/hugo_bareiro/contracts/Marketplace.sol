// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol"; // Para la función withdraw

contract Marketplace is ERC721, ERC721URIStorage, ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    struct Listing {
        address seller;
        uint96 price;
        bool isSold;
    }

    mapping(uint256 => Listing) public listings;
    mapping(address => uint256) public sellerFunds;

    event ItemListed(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price,
        string uri
    );

    event ItemSold(
        uint256 indexed tokenId,
        address indexed buyer,
        address indexed seller,
        uint256 price
    );

    constructor() ERC721("MiMercadoNFT", "MMNFT") {
        _tokenIdCounter.increment(); // Empezamos los IDs de token en 1
    }

    // a. Funcion: mintAndList(string memory _uri, uint96 _price)
    function mintAndList(string memory _uri, uint96 _price) public {
        require(_price > 0, "El precio debe ser mayor que cero");

        uint256 newItemId = _tokenIdCounter.current();

        _safeMint(msg.sender, newItemId);
        _setTokenURI(newItemId, _uri);

        listings[newItemId] = Listing({
            seller: msg.sender,
            price: _price,
            isSold: false
        });

        emit ItemListed(newItemId, msg.sender, _price, _uri);
        _tokenIdCounter.increment();
    }

    // c. Funcion: getListing(uint256 _tokenId) view
    // Devuelve: dueño actual del NFT, precio, si está vendido, y el vendedor original.
    function getListing(uint256 _tokenId) public view returns (address currentOwner, uint96 price, bool isSold, address seller) {
        require(_exists(_tokenId), "Token no existe."); // Verifica que el token haya sido minteado
        Listing storage item = listings[_tokenId];
        // Si item.seller es address(0) significa que nunca fue listado formalmente, aunque exista el token.
        // Podríamos agregar un require(item.seller != address(0), "Token no listado.");
        // Pero para este caso, si el token existe y no está en 'listings', devolverá price 0 y seller address(0).

        return (ownerOf(_tokenId), item.price, item.isSold, item.seller);
    }

    // b. Funcion: buy(uint256 _tokenId) payable
    // nonReentrant es un modificador de ReentrancyGuard para prevenir ataques de reentrada.
    function buy(uint256 _tokenId) public payable nonReentrant {
        Listing storage item = listings[_tokenId]; // Usamos 'storage' para modificar el estado directamente
        address seller = item.seller;

        require(_exists(_tokenId), "Token no existe.");
        require(ownerOf(_tokenId) == seller, "El vendedor original ya no posee este token."); // El vendedor original debe ser el dueño actual para vender
        require(!item.isSold, "Este item ya fue vendido.");
        require(item.price > 0, "Este item no esta a la venta."); // Chequeo adicional
        require(msg.value == item.price, "La cantidad de Ether enviada no es correcta.");
        require(seller != msg.sender, "El vendedor no puede comprar su propio item.");

        // El vendedor (seller) debe haber aprobado este contrato (address(this))
        // para transferir el _tokenId en su nombre.
        // La función _transfer (llamada por safeTransferFrom) verificará esto.
        // Si no hay aprobación, la transacción fallará.

        // Antes de transferir, es buena práctica remover cualquier aprobación existente para este token,
        // ya que está cambiando de dueño y el contexto de la aprobación anterior ya no es válido.
        _approve(address(0), _tokenId);

        // Transferir el NFT del vendedor (seller) al comprador (msg.sender)
        // La función safeTransferFrom es parte de ERC721.sol
        ERC721.safeTransferFrom(seller, msg.sender, _tokenId);

        // Actualizar el estado del item y los fondos del vendedor
        item.isSold = true;
        sellerFunds[seller] += msg.value; // msg.value es la cantidad de Ether enviada con la transacción

        emit ItemSold(_tokenId, msg.sender, seller, item.price);
    }

    // d. Funcion: withdraw()
    // Permite al vendedor retirar los fondos acumulados por sus ventas.
    // nonReentrant previene que un contrato malicioso llame recursivamente a esta función antes de que termine.
    function withdraw() public nonReentrant {
        uint256 amount = sellerFunds[msg.sender];
        require(amount > 0, "No tienes fondos para retirar.");

        // Importante: Poner a cero el balance ANTES de enviar el Ether para prevenir reentrancy attacks.
        sellerFunds[msg.sender] = 0;

        // Enviar los fondos al msg.sender (el vendedor)
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "La transferencia de fondos fallo.");
    }

    // --- Funciones requeridas por ERC721URIStorage que debemos sobreescribir ---
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage) // Aquí especificamos ambos contratos base
        returns (string memory)
    {
        require(_exists(tokenId), "ERC721URIStorage: URI query for nonexistent token");
        return super.tokenURI(tokenId);
    }

    // Necesario para que Etherscan y otras plataformas reconozcan las interfaces
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage) // Aquí especificamos ambos contratos base
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}