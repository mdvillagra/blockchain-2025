// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title LendingProtocol
/// @notice Protocolo de prestamos con colateral sin oraculos externos ni liquidadores automaticos.
contract LendingProtocol is Ownable {
    /// @dev Token ERC20 usado como colateral (cUSD)
    IERC20 public collateralToken;
    /// @dev Token ERC20 usado como prestamo (dDAI)
    IERC20 public loanToken;

    /// @notice Tasa de interes semanal fija (5% = 5 * 10^16, usando tasa con 18 decimales)
    uint256 public constant WEEKLY_INTEREST_RATE = 5e16; // 0.05 * 10^18

    /// @dev Mapeo de colateral depositado por usuario (en unidades token, con 18 decimales)
    mapping(address => uint256) private collateralBalance;

    /// @dev Mapeo de deuda principal (sin interes) que tiene cada usuario (en unidades token, 18 decimales)
    mapping(address => uint256) private principalDebt;

    /// @dev Mapeo de timestamp de la ultima vez que el usuario pidio prestado o actualizo interes
    mapping(address => uint256) private lastBorrowTimestamp;

    /// @dev Mapeo de interes acumulado pendiente (en unidades token, 18 decimales)
    mapping(address => uint256) private accruedInterest;

    /// @notice Evento que se emite cuando un usuario deposita colateral
    event CollateralDeposited(address indexed user, uint256 amount);

    /// @notice Evento que se emite cuando un usuario pide prestado
    event Borrowed(address indexed user, uint256 amount);

    /// @notice Evento que se emite cuando un usuario paga su deuda
    event Repaid(address indexed user, uint256 amountPlusInterest);

    /// @notice Evento que se emite cuando un usuario retira su colateral
    event CollateralWithdrawn(address indexed user, uint256 amount);

    /// @param _collateralToken Direccion del CollateralToken (cUSD)
    /// @param _loanToken Direccion del LoanToken (dDAI)
    constructor(address _collateralToken, address _loanToken) Ownable(msg.sender) {
        collateralToken = IERC20(_collateralToken);
        loanToken = IERC20(_loanToken);
    }

    /// @notice Deposita tokens de colateral (cUSD) en el protocolo.
    /// @param amount Cantidad de tokens (en wei, 18 decimales) a depositar como colateral.
    function depositCollateral(uint256 amount) external {
        require(amount > 0, "Monto de colateral debe ser > 0");
        bool sent = collateralToken.transferFrom(msg.sender, address(this), amount);
        require(sent, "Transfer fallida");
        collateralBalance[msg.sender] += amount;

        if (principalDebt[msg.sender] > 0) {
            _accrueInterest(msg.sender);
        } else {
            lastBorrowTimestamp[msg.sender] = block.timestamp;
        }

        emit CollateralDeposited(msg.sender, amount);
    }

    /// @notice Calcula y actualiza el interes acumulado para un usuario, de acuerdo al tiempo transcurrido.
    /// @param user Direccion del usuario.
    function _accrueInterest(address user) internal {
        uint256 principal = principalDebt[user];
        if (principal == 0) {
            lastBorrowTimestamp[user] = block.timestamp;
            return;
        }
        uint256 timeElapsed = block.timestamp - lastBorrowTimestamp[user];
        uint256 weeksElapsed = timeElapsed / 1 weeks;
        if (weeksElapsed > 0) {
            uint256 interest = (principal * WEEKLY_INTEREST_RATE * weeksElapsed) / 1e18;
            accruedInterest[user] += interest;
            lastBorrowTimestamp[user] += weeksElapsed * 1 weeks;
        }
    }

    /// @notice Permite al usuario pedir prestado (dDAI) hasta que la deuda total (principal + interes) sea <= 66% del colateral.
    /// @param amount Cantidad de tokens (en wei) que quiere pedir prestado.
    function borrow(uint256 amount) external {
        require(amount > 0, "Monto de prestamo debe ser > 0");
        require(collateralBalance[msg.sender] > 0, "No tienes colateral depositado");

        _accrueInterest(msg.sender);

        uint256 totalDebt = principalDebt[msg.sender] + accruedInterest[msg.sender];
        uint256 newDebt = totalDebt + amount;
        uint256 maxDebtAllowed = (collateralBalance[msg.sender] * 66) / 100;

        require(newDebt <= maxDebtAllowed, "Excede ratio de colateralizacion de 150%");

        principalDebt[msg.sender] = principalDebt[msg.sender] + amount;

        bool sent = loanToken.transfer(msg.sender, amount);
        require(sent, "Transfer de LoanToken fallida");

        emit Borrowed(msg.sender, amount);
    }

    /// @notice Permite al usuario repagar su deuda (principal + todo interes acumulado).
    function repay() external {
        _accrueInterest(msg.sender);

        uint256 principal = principalDebt[msg.sender];
        uint256 interest = accruedInterest[msg.sender];
        uint256 totalOwed = principal + interest;
        require(totalOwed > 0, "Sin deuda pendiente");

        bool sent = loanToken.transferFrom(msg.sender, address(this), totalOwed);
        require(sent, "Transfer de LoanToken para repago fallida");

        principalDebt[msg.sender] = 0;
        accruedInterest[msg.sender] = 0;
        lastBorrowTimestamp[msg.sender] = 0;

        emit Repaid(msg.sender, totalOwed);
    }

    /// @notice Permite al usuario retirar todo su colateral si no hay deuda activa.
    function withdrawCollateral() external {
        _accrueInterest(msg.sender);
        require(principalDebt[msg.sender] + accruedInterest[msg.sender] == 0, "Deuda pendiente, no puedes retirar");

        uint256 amount = collateralBalance[msg.sender];
        require(amount > 0, "No tienes colateral");

        collateralBalance[msg.sender] = 0;
        bool sent = collateralToken.transfer(msg.sender, amount);
        require(sent, "Transfer de CollateralToken fallida");

        emit CollateralWithdrawn(msg.sender, amount);
    }

    /// @notice Devuelve datos del usuario: (colateral depositado, deuda principal, interes acumulado)
    /// @param user Direccion del usuario
    function getUserData(address user) external view returns (
        uint256 _collateralBalance,
        uint256 _principalDebt,
        uint256 _accruedInterest
    ) {
        // Asignamos directamente a las variables de retorno nombradas
        _collateralBalance = collateralBalance[user];
        _principalDebt = principalDebt[user];
        _accruedInterest = accruedInterest[user]; // Interés guardado

        // Calculamos el interés acumulado dinámicamente si hay deuda
        if (_principalDebt > 0) {
            uint256 timeElapsed = block.timestamp - lastBorrowTimestamp[user];
            uint256 weeksElapsed = timeElapsed / 1 weeks; // 'weeks' es una unidad de tiempo global en Solidity
            
            if (weeksElapsed > 0) {
                uint256 newInterest = (_principalDebt * WEEKLY_INTEREST_RATE * weeksElapsed) / 1e18;
                _accruedInterest += newInterest;
            }
        }

        // No es necesario un return explícito con valores, ya que las variables de retorno ya están asignadas.
        // Un `return;` vacío es opcional aquí, la función retornará los valores de `_collateralBalance`, `_principalDebt`, y `_accruedInterest` automáticamente.
    }

    /// @notice Solo el owner puede retirar tokens atascados en el contrato (rescate de emergencia)
    /// @param token Direccion del token ERC20 que se quiere rescatar
    /// @param to Direccion a la cual enviar los tokens
    /// @param amount Cantidad de tokens (wei) a rescatar
    function rescueTokens(address token, address to, uint256 amount) external onlyOwner {
        IERC20(token).transfer(to, amount);
    }
}
