// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
/
 * @title Mercado de NFTs
 * @dev Contrato para la venta de NFTs ERC-721 con funcionalidad básica de mercado
 */
contract Market is ERC721URIStorage, Ownable {
    uint256 public nextTokenId = 0;
    uint96 public constant BASE_PRICE = 0.01 ether;
    // Estructura para almacenar información de NFTs listados
    struct Listing {
        address owner;   // Dueño actual del NFT
        uint96 price;    // Precio de venta en wei
        bool sold;       // Estado de venta
    }
    // Mapeo de tokenId a su información de listado
    mapping(uint256 => Listing) public listings;
    // Eventos del mercado
    event ItemListed(uint256 indexed tokenId, address owner, uint96 price);
    event ItemSold(uint256 indexed tokenId, address buyer, uint96 price);
    /
     * @dev Constructor que inicializa la colección y crea el lote inicial de NFTs
     */
    constructor() ERC721("NFT Market", "NFTM") Ownable(msg.sender) {
        _mintInitialBatch();
    }
    /
     * @dev Función interna para crear los primeros 10 NFTs del mercado
     */
    function _mintInitialBatch() private {
        for (uint256 i = 0; i < 10; i++) {
            _safeMint(owner(), i);
            _setTokenURI(i, string(abi.encodePacked("nft-", Strings.toString(i), ".jpg"));
            listings[i] = Listing(owner(), BASE_PRICE, false);
            emit ItemListed(i, owner(), BASE_PRICE);
        }
        nextTokenId = 10;
    }
    /
     * @notice Permite a un usuario crear y listar un nuevo NFT
     * @param uri URI de los metadatos del NFT
     * @param price Precio de venta en wei
     */
    function mintAndList(string memory uri, uint96 price) external {
        require(price > 0, "El precio debe ser mayor a cero");
        uint256 tokenId = nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
        listings[tokenId] = Listing(msg.sender, price, false);
        emit ItemListed(tokenId, msg.sender, price);
    }
    /**
     * @notice Permite comprar un NFT listado en el mercado
     * @dev El valor enviado debe ser exactamente igual al precio
     * @param tokenId ID del NFT a comprar
     */
    function buy(uint256 tokenId) external payable {
        Listing storage listing = listings[tokenId];
        require(_exists(tokenId), "El NFT no existe");
        require(!listing.sold, "El NFT ya fue vendido");
        require(msg.value == listing.price, "Monto de pago incorrecto");

        listing.sold = true;
        _transfer(listing.owner, msg.sender, tokenId);

        (bool success, ) = payable(listing.owner).call{value: listing.price}("");
        require(success, "Transferencia de fondos fallida");

        emit ItemSold(tokenId, msg.sender, listing.price);
    }
    /
     * @notice Obtiene la información de listado de un NFT
     * @param tokenId ID del NFT a consultar
     * @return owner Dirección del dueño actual
     * @return price Precio de venta
     * @return sold Estado de venta
     */
    function getListing(uint256 tokenId) external view returns (address owner, uint96 price, bool sold) {
        require(_exists(tokenId), "El NFT no existe");
        Listing memory listing = listings[tokenId];
        return (listing.owner, listing.price, listing.sold);
    }
    /
     * @notice Permite al dueño del contrato retirar los fondos acumulados
     * @dev Solo el dueño puede ejecutar esta función
     */
    function withdraw() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Retiro de fondos fallido");
    }
}