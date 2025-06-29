// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Protocolo de Préstamos Descentralizados
/// @notice Permite depósito de colateral, préstamos y gestión de deudas
contract LendingProtocol is Ownable {
    IERC20 public collateralToken;
    IERC20 public loanToken;
    uint256 public constant COLLATERAL_RATIO = 150; // Ratio 150% (66.67% LTV)
    uint256 public constant WEEKLY_INTEREST_RATE = 5; // 5% semanal

    struct UserPosition {
        uint256 collateralAmount;
        uint256 debtAmount;
    }

    mapping(address => UserPosition) public positions;

    event CollateralDeposited(address indexed user, uint256 amount);
    event Borrowed(address indexed user, uint256 amount);
    event Repaid(address indexed user, uint256 principal, uint256 interest);
    event CollateralWithdrawn(address indexed user, uint256 amount);

    /// @notice Inicializa el contrato con los tokens
    /// @param _collateralToken Dirección del token colateral (cUSD)
    /// @param _loanToken Dirección del token de préstamo (dDAI)
    constructor(address _collateralToken, address _loanToken, address initialOwner) Ownable(initialOwner) {
        require(_collateralToken != address(0), "Direccion token colateral invalida");
        require(_loanToken != address(0), "Direccion token prestamo invalida");
        collateralToken = IERC20(_collateralToken);
        loanToken = IERC20(_loanToken);
    }

    /// @notice Deposita tokens colaterales
    /// @param amount Cantidad a depositar
    function depositCollateral(uint256 amount) external {
        require(amount > 0, "Monto debe ser mayor a 0");
        require(collateralToken.transferFrom(msg.sender, address(this), amount), "Transferencia fallo");
        positions[msg.sender].collateralAmount += amount;
        emit CollateralDeposited(msg.sender, amount);
    }

    /// @notice Toma un préstamo (máx. 66.67% del colateral)
    /// @param amount Cantidad a pedir prestada
    function borrow(uint256 amount) external {
        require(amount > 0, "Monto debe ser mayor a 0");
        UserPosition storage pos = positions[msg.sender];
        require(pos.debtAmount == 0, "Ya tiene un prestamo activo");

        uint256 maxBorrow = (pos.collateralAmount * 100) / COLLATERAL_RATIO;
        require(amount <= maxBorrow, "Excede limite de prestamo");

        pos.debtAmount = amount;
        require(loanToken.transfer(msg.sender, amount), "Transferencia de prestamo fallo");
        emit Borrowed(msg.sender, amount);
    }

    /// @notice Paga un préstamo con interés (5% semanal)
    function repay() external {
        UserPosition storage pos = positions[msg.sender];
        require(pos.debtAmount > 0, "No tiene deuda activa");

        uint256 principal = pos.debtAmount;
        uint256 interest = (principal * WEEKLY_INTEREST_RATE) / 100;
        
        require(loanToken.transferFrom(msg.sender, address(this), principal + interest), "Pago fallo");
        pos.debtAmount = 0;
        emit Repaid(msg.sender, principal, interest);
    }

    /// @notice Retira colateral (si no hay deuda pendiente)
    function withdrawCollateral() external {
        UserPosition storage pos = positions[msg.sender];
        require(pos.debtAmount == 0, "Tiene deuda pendiente");
        require(pos.collateralAmount > 0, "No tiene colateral");

        uint256 amount = pos.collateralAmount;
        pos.collateralAmount = 0;
        require(collateralToken.transfer(msg.sender, amount), "Retiro fallo");
        emit CollateralWithdrawn(msg.sender, amount);
    }

    /// @notice Obtiene datos del usuario
    /// @return collateral Colateral depositado
    /// @return debt Deuda actual
    /// @return interest Interés acumulado
    function getUserData(address user) external view returns (
        uint256 collateral,
        uint256 debt,
        uint256 interest
    ) {
        UserPosition storage pos = positions[user];
        collateral = pos.collateralAmount;
        debt = pos.debtAmount;
        interest = (debt * WEEKLY_INTEREST_RATE) / 100;
    }
}