// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Interfaz para el token de préstamo (loanToken) con funciones mint y burnFrom
interface ILoanToken {
    function mint(address to, uint256 amount) external;
    function burnFrom(address account, uint256 amount) external;
}

// Interfaz para el token de colateral (collateralToken) con funciones mint y transferencias
interface ICollateralToken {
    function mint(address to, uint256 amount) external;
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
}

contract LendingProtocol {
    using SafeERC20 for IERC20;

    ICollateralToken public immutable collateralToken;
    ILoanToken public immutable loanToken;

    uint256 public constant COLLATERAL_RATIO = 150; // 150% -> 66% préstamo máximo
    uint256 public constant INTEREST_RATE = 5;      // 5%


    struct Loan {
        uint256 amount;
        uint256 interest;
        bool interestMinted;
    }

    mapping(address => uint256) public collateralBalance;
    mapping(address => Loan) public loans;
    mapping(address => bool) public hasClaimedInitial;

    event Deposited(address indexed user, uint256 amount);
    event Borrowed(address indexed user, uint256 amount);
    event InterestMinted(address indexed user, uint256 interestAmount);
    event Repaid(address indexed user, uint256 totalPaid);
    event Withdrawn(address indexed user, uint256 amount);

    constructor(address _collateralToken, address _loanToken) {
        collateralToken = ICollateralToken(_collateralToken);
        loanToken = ILoanToken(_loanToken);
    }

    // Función para que el usuario reciba cUSD inicial (solo una vez al conectarse la primera vez)
    function mintInitialCollateral() external {
        require(!hasClaimedInitial[msg.sender], "Initial cUSD already claimed");
        hasClaimedInitial[msg.sender] = true;
        collateralToken.mint(msg.sender, 1000 ether);
    }

    function depositCollateral(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(collateralToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        collateralBalance[msg.sender] += amount;
        emit Deposited(msg.sender, amount);
    }


    // Función para pedir el máximo préstamo posible según colateral depositado
    function borrowMax() external {
        require(loans[msg.sender].amount == 0, "Existing loan");
        uint256 collateral = collateralBalance[msg.sender];
        require(collateral > 0, "No collateral deposited");

        uint256 maxBorrow = (collateral * 100) / COLLATERAL_RATIO;
        uint256 interest = (maxBorrow * INTEREST_RATE) / 100;

        loans[msg.sender] = Loan({
            amount: maxBorrow,
            interest: interest,
            interestMinted: false
        });

        loanToken.mint(msg.sender, maxBorrow);
        emit Borrowed(msg.sender, maxBorrow);
    }

    // Función para mintear los tokens de interés (solo una vez por prestamo, para conseguir dDAI para cubrir el interes generado)
    function mintInterest() external {
        Loan storage loan = loans[msg.sender];
        require(loan.amount > 0, "No active loan");
        require(!loan.interestMinted, "Interest already minted");

        loan.interestMinted = true;
        loanToken.mint(msg.sender, loan.interest);
        emit InterestMinted(msg.sender, loan.interest);
    }

    function repayLoan() external {
        Loan memory loan = loans[msg.sender];
        require(loan.amount > 0, "No loan to repay");

        uint256 totalDebt = loan.amount + loan.interest;
        loanToken.burnFrom(msg.sender, totalDebt);
        delete loans[msg.sender];

        emit Repaid(msg.sender, totalDebt);
    }

    function withdrawCollateral() external {
        require(loans[msg.sender].amount == 0, "Outstanding loan");
        uint256 amount = collateralBalance[msg.sender];
        require(amount > 0, "No collateral to withdraw");

        collateralBalance[msg.sender] = 0;
        require(collateralToken.transfer(msg.sender, amount), "Transfer failed");
        emit Withdrawn(msg.sender, amount);
    }

    function getUserData(address user) external view returns (
        uint256 collateral,
        uint256 debt,
        uint256 interest,
        bool interestMinted
    ) {
        collateral = collateralBalance[user];
        debt = loans[user].amount;
        interest = loans[user].interest;
        interestMinted = loans[user].interestMinted;
    }
}