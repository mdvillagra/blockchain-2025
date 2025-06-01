pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// El contrato Marketplace hereda de ERC721URIStorage y ReentrancyGuard
contract Marketplace is ERC721URIStorage,ReentrancyGuard 
{
    // Estructura que representa un NFT listado en el marketplace
    struct NFT 
    {
        address poseedor;      // Dueño actual del NFT
        uint96 precio;         // Precio de venta del NFT
        bool estaVendido;      // Indica si el NFT ya fue vendido
    }

    uint256 private _numeroToken; // Contador de tokens creados
    mapping(uint256 => NFT) public tokens; // Mapeo de ID de token a su información
    mapping(address => uint256) public retirosPendientes; // Fondos pendientes de retiro por usuario

    // Evento que se emite cuando se lista un nuevo NFT
    event ItemListed(uint256 indexed IDtoken,address indexed poseedor,uint96 precio);
    // Evento que se emite cuando se vende un NFT
    event ItemSold(uint256 indexed IDtoken,address indexed comprador,uint96 precio);

    // Constructor del contrato, inicializa el nombre y símbolo del token
    constructor() ERC721("MarketplaceNFT","MNFT") {}

    // Devuelve el número total de tokens creados
    function numeroToken() public view returns(uint256) 
    {
        return _numeroToken;
    }

    // Permite acuñar (mint) y listar un nuevo NFT en el marketplace
    function mintAndList(string memory _uri,uint96 _precio) external 
    {
        _numeroToken++; // Incrementa el contador de tokens
        uint256 IDToken = _numeroToken;
        _mint(msg.sender,IDToken); // Crea el NFT y lo asigna al remitente
        _setTokenURI(IDToken,_uri); // Asigna el URI de metadatos al NFT

        tokens[IDToken] = NFT(
        {
            poseedor: msg.sender,
            precio: _precio,
            estaVendido: false
        });

        emit ItemListed(IDToken,msg.sender,_precio); // Emite evento de listado
    }

    // Permite comprar un NFT listado
    function buy(uint256 _IDtoken) external payable nonReentrant 
    {
        NFT storage item = tokens[_IDtoken];
        require(!item.estaVendido,"Item ya vendido"); // Verifica que no esté vendido
        require(msg.value == item.precio,"Precio incorrecto"); // Verifica el precio enviado
        require(item.poseedor != address(0),"No existe el item"); // Verifica que exista el NFT

        item.estaVendido = true; // Marca como vendido
        retirosPendientes[item.poseedor] += msg.value; // Suma fondos al vendedor

        _transfer(item.poseedor,msg.sender,_IDtoken); // Transfiere el NFT al comprador

        emit ItemSold(_IDtoken,msg.sender,item.precio); // Emite evento de venta
    }

    // Devuelve la información de un NFT listado
    function getListing(uint256 _IDtoken) external view returns(address poseedor,uint96 precio,bool estaVendido) 
    {
        NFT storage item = tokens[_IDtoken];
        return(item.poseedor,item.precio,item.estaVendido);
    }

    // Permite a los usuarios retirar sus fondos acumulados por ventas
    function withdraw() external nonReentrant 
    {
        uint256 cantidad = retirosPendientes[msg.sender];
        require(cantidad > 0,"No hay fondos para retirar"); // Verifica que haya fondos
        retirosPendientes[msg.sender] = 0; // Previene reentradas
        payable(msg.sender).transfer(cantidad); // Transfiere los fondos al usuario
    }
}