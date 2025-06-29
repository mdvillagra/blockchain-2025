// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LoanToken
 * @dev Token ERC20 para préstamos en el protocolo
 * Representa dDAI (Decentralized DAI)
 */
contract LoanToken is ERC20, Ownable {
    // Constantes para mint público
    uint256 public constant DAILY_MINT_LIMIT = 1000 * 10**18; // 1000 tokens por día
    uint256 public constant MINT_COOLDOWN = 24 hours; // 24 horas entre mints
    
    // Mapeo para rastrear último mint de cada usuario
    mapping(address => uint256) public lastMintTime;
    mapping(address => uint256) public dailyMintedAmount;
    
    constructor() ERC20("Decentralized DAI", "dDAI") Ownable(msg.sender) {
        // Mint inicial de tokens para el owner
        _mint(msg.sender, 1000000 * 10**decimals());
    }

    /**
     * @dev Función para que el owner pueda mintear tokens
     * @param to Dirección a la que se mintearán los tokens
     * @param amount Cantidad de tokens a mintear
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Función pública para que cualquier usuario pueda mintear tokens de prueba
     * Permite mintear hasta 1000 tokens por día por usuario
     */
    function mintForTesting() external {
        require(
            block.timestamp >= lastMintTime[msg.sender] + MINT_COOLDOWN,
            "Mint cooldown active. Wait 24 hours between mints"
        );
        
        // Resetear cantidad diaria si ha pasado un día
        if (block.timestamp >= lastMintTime[msg.sender] + MINT_COOLDOWN) {
            dailyMintedAmount[msg.sender] = 0;
        }
        
        require(
            dailyMintedAmount[msg.sender] == 0,
            "Daily mint limit reached"
        );
        
        // Actualizar registros
        lastMintTime[msg.sender] = block.timestamp;
        dailyMintedAmount[msg.sender] = DAILY_MINT_LIMIT;
        
        // Mintear tokens
        _mint(msg.sender, DAILY_MINT_LIMIT);
    }

    /**
     * @dev Función para verificar cuándo puede mintear nuevamente un usuario
     * @param user Dirección del usuario
     * @return nextMintTime Timestamp cuando puede mintear nuevamente
     */
    function getNextMintTime(address user) external view returns (uint256) {
        return lastMintTime[user] + MINT_COOLDOWN;
    }

    /**
     * @dev Función para verificar si un usuario puede mintear
     * @param user Dirección del usuario
     * @return canMint Si puede mintear ahora
     */
    function canMint(address user) external view returns (bool) {
        return block.timestamp >= lastMintTime[user] + MINT_COOLDOWN;
    }

    /**
     * @dev Función para que el owner pueda quemar tokens
     * @param from Dirección de la que se quemarán los tokens
     * @param amount Cantidad de tokens a quemar
     */
    function burnFrom(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
} 