// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// Decentralized lending protocol with collateralized debt positions

// Permite a los usuarios depositar garantías, tomar prestados tokens, reembolsar préstamos y retirar garantías.
// Mecánica del Protocolo Principal:
// 1. Préstamos Colateralizados: Los usuarios depositan cUSD para tomar prestado dDAI
// 2. Parámetros Fijos:
// - Tasa de colateralización del 150% (hasta el 66,67% del valor de la garantía)
// - 5% de interés simple semanal sobre préstamos
// - Tasa de intercambio de tokens fija 1:1
// 3. Gestión de Posiciones:
// - Cada usuario mantiene una única posición de deuda
// - El interés se acumula semanalmente según el tiempo transcurrido
// Características de Seguridad:
// - Protección de reentrada en todas las funciones que cambian de estado
// - Referencias de tokens inmutables para evitar robos de datos
// - Comprobaciones explícitas de desbordamiento/subdesbordamiento mediante Solidity 0.8+
// - Validación de deuda antes de operaciones críticas
contract LendingProtocol is ReentrancyGuard {
    // Los contratos de tokens inmutables garantizan la integridad del protocolo
    IERC20 public immutable collateralToken;
    IERC20 public immutable loanToken;

    // Constantes de protocolo (parámetros fijos)
    uint256 public constant COLLATERALIZATION_RATIO = 150; // 150% - los usuarios pueden tomar prestado hasta el 66,67% de la garantía
    uint256 public constant WEEKLY_INTEREST_RATE = 5; // 5% por semana
    uint256 public constant SECONDS_PER_WEEK = 604800; // 7 días en segundos
    uint256 public constant PRECISION = 100; // Para cálculos de porcentajes

    // User debt position structure

    // Seguimiento:
    // - collateral: cUSD bloqueado en el protocolo (depósito de seguridad)
    // - debtPrincipal: dDAI original prestado (antes de intereses)
    // - debtTimestamp: Última fecha de acumulación de intereses
    // Cálculo de intereses:
    // Devengado semanalmente según el tiempo transcurrido desde debtTimestamp
    struct UserPosition {
        uint256 collateral;
        uint256 debtPrincipal;
        uint256 debtTimestamp;
    }

    // Dirección de usuario -> Mapeo de posición
    mapping(address => UserPosition) public positions;

    // Declaraciones de eventos para cambios de estado críticos
    event CollateralDeposited(address indexed user, uint256 amount);
    event LoanBorrowed(address indexed user, uint256 amount);
    event LoanRepaid(address indexed user, uint256 amount);
    event CollateralWithdrawn(address indexed user, uint256 amount);

    // Initializes protocol with token addresses
    // _collateralToken: cUSD contract address
    // _loanToken: dDAI contract address

    // Requisitos:
    // - Ambas direcciones deben ser distintas de cero
    // - Los tokens deben implementar la interfaz estándar ERC20
    constructor(address _collateralToken, address _loanToken) {
        require(_collateralToken != address(0), "Invalid collateral token");
        require(_loanToken != address(0), "Invalid loan token");

        collateralToken = IERC20(_collateralToken);
        loanToken = IERC20(_loanToken);
    }

    // Deposits collateral to secure future loans
    // amount: Quantity of cUSD to lock

    // Flujo de trabajo:
    // 1. Transferir cUSD del usuario al contrato
    // 2. Aumentar el saldo de garantía del usuario
    function depositCollateral(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");

        require(
            collateralToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        positions[msg.sender].collateral += amount;

        emit CollateralDeposited(msg.sender, amount);
    }

    // Borrows dDAI against deposited collateral
    // amount: Quantity of dDAI to borrow

    // Flujo de trabajo:
    // 1. Aplicar los intereses devengados a la deuda existente
    // 2. Verificar que el préstamo no infrinja el ratio de garantía del 150 %
    // 3. Verificar la liquidez del protocolo
    // 4. Actualizar la posición de la deuda
    // 5. Transferir dDAI al usuario
    // Se revierte si:
    // - El importe del préstamo supera la capacidad de garantía disponible
    // - El protocolo carece de suficiente liquidez de dDAI
    function borrow(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");

        UserPosition storage position = positions[msg.sender];

        _updateDebtWithInterest(position);

        uint256 maxBorrowable = _calculateMaxBorrowable(
            position.collateral,
            position.debtPrincipal
        );
        require(amount <= maxBorrowable, "Exceeds borrow limit");

        require(
            loanToken.balanceOf(address(this)) >= amount,
            "Insufficient contract balance"
        );

        position.debtPrincipal += amount;
        position.debtTimestamp = block.timestamp;

        require(loanToken.transfer(msg.sender, amount), "Transfer failed");

        emit LoanBorrowed(msg.sender, amount);
    }

    // Repays entire debt position (principal + accrued interest)

    // Flujo de trabajo:
    // 1. Calcular la deuda actual (capital + intereses)
    // 2. Transferir dDAI del usuario al protocolo
    // 3. Restablecer la posición de deuda a cero
    function repay() external nonReentrant {
        UserPosition storage position = positions[msg.sender];
        require(position.debtPrincipal > 0, "No debt to repay");

        uint256 currentDebt = getCurrentDebt(msg.sender);

        require(
            loanToken.transferFrom(msg.sender, address(this), currentDebt),
            "Transfer failed"
        );

        position.debtPrincipal = 0;
        position.debtTimestamp = 0;

        emit LoanRepaid(msg.sender, currentDebt);
    }

    // Withdraws collateral after full repayment

    // Requisitos:
    // - Sin deudas pendientes (capital e intereses deben ser cero)
    // - Saldo de garantía positivo
    function withdrawCollateral() external nonReentrant {
        UserPosition storage position = positions[msg.sender];
        require(position.debtPrincipal == 0, "Outstanding debt");
        require(position.collateral > 0, "No collateral");

        uint256 amount = position.collateral;
        position.collateral = 0;

        require(
            collateralToken.transfer(msg.sender, amount),
            "Transfer failed"
        );

        emit CollateralWithdrawn(msg.sender, amount);
    }

    // Calculates user's current debt (principal + accrued interest)
    // user: Account address

    // Cálculo de intereses:
    // - Interés simple (no compuesto)
    // - Devengo semanal basado en el tiempo transcurrido
    // - Fórmula: debtPrincipal + (debtPrincipal * interestRate * weeksPassed)
    function getCurrentDebt(address user) public view returns (uint256) {
        UserPosition memory position = positions[user];

        if (position.debtPrincipal == 0) {
            return 0;
        }

        uint256 weeksPassed = (block.timestamp - position.debtTimestamp) /
            SECONDS_PER_WEEK;

        if (weeksPassed == 0) {
            return position.debtPrincipal;
        }

        uint256 interest = (position.debtPrincipal *
            WEEKLY_INTEREST_RATE *
            weeksPassed) / PRECISION;

        return position.debtPrincipal + interest;
    }

    // Returns comprehensive user position data
    // user: Account address
    // return collateral Locked cUSD amount
    // return currentDebt Total debt (principal + interest)
    // return interestAccrued Only the interest portion of debt
    function getUserData(
        address user
    )
        external
        view
        returns (
            uint256 collateral,
            uint256 currentDebt,
            uint256 interestAccrued
        )
    {
        UserPosition memory position = positions[user];
        collateral = position.collateral;
        currentDebt = getCurrentDebt(user);
        interestAccrued = currentDebt - position.debtPrincipal;
    }

    // Calculates maximum borrowable amount for user
    // user: Account address
    // return Maximum additional dDAI that can be borrowed

    // Cálculo:
    // 1. Deuda total máxima = collateral / 1,5
    // 2. Préstamo disponible = Deuda máxima - Deuda existente
    function getMaxBorrowable(address user) external view returns (uint256) {
        UserPosition memory position = positions[user];
        UserPosition memory tempPosition = position;

        _updateDebtWithInterestView(tempPosition);

        return
            _calculateMaxBorrowable(
                tempPosition.collateral,
                tempPosition.debtPrincipal
            );
    }

    // Computes position health factor
    // user: Account address
    // return Health factor (scaled by PRECISION)

    // Interpretación:
    // - >100: Posición segura (collateral > 150% de la deuda)
    // - 100: Exactamente en el umbral de liquidación
    // - <100: Infracolateralizada (sujeta a liquidación)
    // Fórmula:
    // Factor de salud = (Collateral / (Debt * Collateralization Ratio)) * PRECISION
    function getHealthFactor(address user) external view returns (uint256) {
        UserPosition memory position = positions[user];
        uint256 currentDebt = getCurrentDebt(user);

        if (currentDebt == 0) {
            return type(uint256).max;
        }

        return
            (position.collateral * PRECISION) /
            ((currentDebt * COLLATERALIZATION_RATIO) / PRECISION);
    }

    // ========== FUNCIONES INTERNAS ========== //

    // Updates debt position with accrued interest
    // position: Storage reference to user's position

    // Modifica el estado:
    // - Aumenta debtPrincipal según los intereses acumulados
    // - Restablece debtTimestamp a la hora del bloque actual
    function _updateDebtWithInterest(UserPosition storage position) internal {
        if (position.debtPrincipal == 0) return;

        uint256 weeksPassed = (block.timestamp - position.debtTimestamp) /
            SECONDS_PER_WEEK;

        if (weeksPassed > 0) {
            uint256 interest = (position.debtPrincipal *
                WEEKLY_INTEREST_RATE *
                weeksPassed) / PRECISION;
            position.debtPrincipal += interest;
            position.debtTimestamp = block.timestamp;
        }
    }

    // View version of interest accrual (doesn't modify state)
    // position: Memory copy of user position
    function _updateDebtWithInterestView(
        UserPosition memory position
    ) internal view {
        if (position.debtPrincipal == 0) return;

        uint256 weeksPassed = (block.timestamp - position.debtTimestamp) /
            SECONDS_PER_WEEK;

        if (weeksPassed > 0) {
            uint256 interest = (position.debtPrincipal *
                WEEKLY_INTEREST_RATE *
                weeksPassed) / PRECISION;
            position.debtPrincipal += interest;
        }
    }

    // Computes maximum borrowable amount given collateral and debt
    // collateralAmount: Current collateral in cUSD
    // existingDebt: Current debt in dDAI
    // return Additional borrow capacity in dDAI

    // Fórmula:
    //Deuda Total Máxima = collateralAmount * PRECISION / COLLATERALIZATION_RATIO
    // Préstamo Disponible = maxTotalDebt - existingDebt
    function _calculateMaxBorrowable(
        uint256 collateralAmount,
        uint256 existingDebt
    ) internal pure returns (uint256) {
        uint256 maxTotalDebt = (collateralAmount * PRECISION) /
            COLLATERALIZATION_RATIO;

        if (existingDebt >= maxTotalDebt) {
            return 0;
        }

        return maxTotalDebt - existingDebt;
    }
}
