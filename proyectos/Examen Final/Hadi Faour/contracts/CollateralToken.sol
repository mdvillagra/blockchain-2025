// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Importa la implementación estándar de token ERC20 de OpenZeppelin
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// Importa el contrato Ownable que permite controlar permisos de propietario
import "@openzeppelin/contracts/access/Ownable.sol";

// Definición del contrato CollateralToken que hereda de ERC20 y Ownable
contract CollateralToken is ERC20, Ownable {

    // Constructor del contrato que inicializa el token con nombre y símbolo
    // También asigna al deployer del contrato como propietario (owner)
    constructor() ERC20("Collateral USD", "cUSD") Ownable(msg.sender) {}

    // Función pública para crear (mintear) nuevos tokens
    function mint(address to, uint256 amount) external {
        // Permitir mint solo si lo llama el owner (LendingProtocol) o el contrato mismo
        require(msg.sender == owner() || msg.sender == address(this), "Not authorized");
        _mint(to, amount);
    }
}
