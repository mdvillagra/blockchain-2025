// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title Marketplace de NFTs
/// @notice Implementa un marketplace completo para NFTs con funcionalidades de mint, listado y compra
/// @dev Hereda de ERC721 para implementar el estándar NFT
contract Marketplace is ERC721 {
    // Contador para IDs de tokens
    uint256 private _tokenIds;

    /// @notice Estructura que almacena la información de un NFT listado
    /// @param tokenId ID único del token
    /// @param seller Dirección del vendedor
    /// @param price Precio en wei
    /// @param sold Estado de venta del NFT
    struct Listing {
        uint256 tokenId;
        address seller;
        uint96  price;
        bool    sold;
    }

    // Mappings para almacenar datos del marketplace
    mapping(uint256 => Listing) private _listings;    // Listings por tokenId
    mapping(address => uint96)   private _proceeds;   // Ganancias por vendedor
    mapping(uint256 => string)   private _tokenURIs;  // URIs de metadatos por tokenId

    // Eventos para tracking de acciones importantes
    event ItemListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event ItemSold  (uint256 indexed tokenId, address indexed buyer,  uint256 price);

    /// @notice Constructor que inicializa el token ERC721 con nombre y símbolo
    constructor() ERC721("MiNFT", "MNFT") {}

    // === URI STORAGE ===

    function _setTokenURI(uint256 tokenId, string memory uri) internal {
        _tokenURIs[tokenId] = uri;
    }

    /// @notice Devuelve la URI almacenada para un token
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return _tokenURIs[tokenId];
    }

    // === MARKETPLACE LOGIC ===

    /// @notice Mintea un NFT al vendedor y lo lista en el mercado
    /// @param uri URI de los metadatos del NFT (puede ser data-URI, IPFS o HTTP)
    /// @param price Precio en wei al que se listará el NFT
    /// @dev Incrementa el contador de tokens y emite evento ItemListed
    function mintAndList(string memory uri, uint256 price) external {
        require(price > 0, "Precio debe ser > 0");
        _tokenIds++;
        uint256 newId = _tokenIds;

        _mint(msg.sender, newId);
        _setTokenURI(newId, uri);
        _listings[newId] = Listing(newId, msg.sender, uint96(price), false);

        emit ItemListed(newId, msg.sender, price);
    }

    /// @notice Compra un NFT listado, transfiere el token y los fondos
    /// @param tokenId ID del NFT a comprar
    /// @dev Requiere que el valor enviado coincida con el precio listado
    function buy(uint256 tokenId) external payable {
        Listing storage lst = _listings[tokenId];
        require(!lst.sold, "Ya vendido");
        require(msg.value == lst.price, "Valor incorrecto");

        lst.sold = true;
        _proceeds[lst.seller] += uint96(msg.value);

        _safeTransfer(lst.seller, msg.sender, tokenId, "");
        emit ItemSold(tokenId, msg.sender, msg.value);
    }

    /// @notice Retorna los datos de un listing.
    function getListing(uint256 tokenId)
        external
        view
        returns (address owner, uint256 price, bool isSold)
    {
        Listing memory lst = _listings[tokenId];
        return (lst.seller, lst.price, lst.sold);
    }

    /// @notice Devuelve cuántos tokens se han minteado (tokenId máximo)
    function totalTokens() external view returns (uint256) {
        return _tokenIds;
    }

    /// @notice Retira las ganancias acumuladas por el vendedor
    /// @dev Transfiere todos los fondos disponibles al vendedor
    function withdraw() external {
        uint96 amount = _proceeds[msg.sender];
        require(amount > 0, "Sin fondos");
        _proceeds[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }
}
