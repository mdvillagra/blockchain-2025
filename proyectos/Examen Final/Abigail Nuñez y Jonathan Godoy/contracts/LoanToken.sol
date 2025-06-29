// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// ERC20 implementation for the loan token in the lending protocol

// Este contrato representa el token de deuda emitido por el protocolo de préstamos.
// Características principales:
// - Símbolo del token: dDAI
// - Precisión decimal fija de 18 (estándar para tokens ERC20)
// - Capacidad de acuñación controlada, restringida al titular del contrato
// - Representación de moneda estable sin rebase (1 dDAI = equivalente a 1 USD)
// - Suministro total inmutable tras la fase inicial de acuñación
// El token dDAI cumple dos funciones principales en el ecosistema:
// 1. Representa las obligaciones de deuda pendientes de los prestatarios
// 2. Funciona como moneda de desembolso del préstamo
contract LoanToken is ERC20, Ownable {
    // Initializes the ERC20 token with name and symbol

    // El constructor:
    // - Establece los metadatos del token ("DAI de deuda", "dDAI")
    // - Establece al implementador como propietario inicial del contrato
    // - NO realiza ninguna acuñación inicial
    constructor() ERC20("Debt DAI", "dDAI") {}

    // Privileged token minting function
    // to: Destination address for minted tokens
    // amount: Quantity of tokens to mint (in base units)

    // Esta función:
    // - Solo puede ser ejecutada por el propietario del contrato (inicialmente, el implementador).
    // - Aumenta el suministro total y el saldo del receptor.
    // - Se utiliza durante:
    // a) Inicialización del protocolo (fondo de préstamo).
    // b) Configuración del entorno de prueba (fondo de usuario).

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // Explicitly sets token decimal precision

    // Anula la implementación predeterminada de ERC20 para:
    // - Proporcionar una declaración de precisión explícita
    // - Garantizar la compatibilidad con los cálculos financieros
    // - Igualar la precisión decimal del token de garantía
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}
