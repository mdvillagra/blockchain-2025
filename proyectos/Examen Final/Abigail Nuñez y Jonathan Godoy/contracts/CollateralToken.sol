// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// ERC20 implementation for the collateral token in the lending protocol

// Este contrato representa el activo que los usuarios depositan como garantía para obtener préstamos.
// Características principales:
// - Símbolo del token: cUSD
// - Precisión decimal fija de 18 para cumplir con los estándares de Ethereum
// - Capacidad de acuñación restringida al titular del contrato
// - Representa una stablecoin vinculada al dólar estadounidense (1 cUSD = 1 USD)
// - Diseñado para uso exclusivo dentro del ecosistema del protocolo de préstamos
// El token cUSD cumple funciones esenciales:
// 1. Activo colateral principal para posiciones de préstamo
// 2. Medio de preservación de valor (stablecoin)
// 3. Garantía de seguridad para el protocolo de préstamos
contract CollateralToken is ERC20, Ownable {
    // Initializes the collateral token with metadata

    // Ejecución del constructor:
    // - Establece el nombre del token ("Collateral USD") y el símbolo ("cUSD")
    // - Asigna al implementador como propietario inicial del contrato
    // - NO crea el suministro inicial (la acuñación se realiza por separado)
    constructor() ERC20("Collateral USD", "cUSD") {}

    // Controlled token minting function
    // to: Destination address for new tokens
    // amount: Quantity of tokens to create (in base units)

    // Características de la función:
    // - Restringido al propietario del contrato
    // - Uso exclusivo para:
    // a) Configuración del entorno de prueba
    // b) Simulación de depósitos de usuarios
    // c) Escenarios de inicialización del protocolo
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // Explicitly defines token decimal precision

    // Anula el comportamiento predeterminado de ERC20 para:
    // - Garantizar la coherencia con los cálculos financieros
    // - Coincidir con la precisión decimal del token de préstamo (dDAI)
    // - Evitar errores de redondeo en los cálculos de la ratio de garantía
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}
