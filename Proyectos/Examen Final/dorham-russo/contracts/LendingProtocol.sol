// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract LendingProtocol {
    IERC20 public immutable collateralToken;
    IERC20 public immutable loanToken;
    uint256 public constant INTEREST_RATE = 5; // 5%
    uint256 public constant COLLATERAL_RATIO = 150; // 150% = 1.5x
    uint256 private constant PRICE_RATIO = 1; // 1:1

    struct UserPosition {
        uint256 collateral;
        uint256 debt;
        uint256 lastUpdated;
    }

    mapping(address => UserPosition) public positions;

    event Deposited(address indexed user, uint256 amount);
    event Borrowed(address indexed user, uint256 amount);
    event Repaid(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    constructor(address _collateralToken, address _loanToken) {
        collateralToken = IERC20(_collateralToken);
        loanToken = IERC20(_loanToken);
    }

    function depositCollateral(uint256 amount) external {
        collateralToken.transferFrom(msg.sender, address(this), amount);
        positions[msg.sender].collateral += amount;
        positions[msg.sender].lastUpdated = block.timestamp;
        emit Deposited(msg.sender, amount);
    }

    function borrow(uint256 amount) external {
        uint256 collateralValue = positions[msg.sender].collateral * PRICE_RATIO;
        uint256 requiredCollateral = (amount * COLLATERAL_RATIO) / 100;
        
        require(collateralValue >= requiredCollateral, "Insufficient collateral");
        require(loanToken.balanceOf(address(this)) >= amount, "Insufficient liquidity");
        
        positions[msg.sender].debt += amount;
        positions[msg.sender].lastUpdated = block.timestamp;
        loanToken.transfer(msg.sender, amount);
        emit Borrowed(msg.sender, amount);
    }

    function repay() external {
        uint256 debt = positions[msg.sender].debt;
        require(debt > 0, "No debt to repay");
        
        uint256 interest = calculateInterest(msg.sender);
        uint256 totalAmount = debt + interest;
        
        loanToken.transferFrom(msg.sender, address(this), totalAmount);
        positions[msg.sender].debt = 0;
        emit Repaid(msg.sender, totalAmount);
    }

    function withdrawCollateral() external {
        require(positions[msg.sender].debt == 0, "Outstanding debt");
        uint256 amount = positions[msg.sender].collateral;
        require(amount > 0, "No collateral");
        
        collateralToken.transfer(msg.sender, amount);
        positions[msg.sender].collateral = 0;
        emit Withdrawn(msg.sender, amount);
    }

    function getUserPosition(address user) external view returns (
        uint256 collateral,
        uint256 debt,
        uint256 interest
    ) {
        UserPosition memory position = positions[user];
        return (
            position.collateral,
            position.debt,
            calculateInterest(user)
        );
    }

    function calculateInterest(address user) private view returns (uint256) {
        if (positions[user].debt == 0) return 0;
        
        uint256 timeElapsed = block.timestamp - positions[user].lastUpdated;
        uint256 weeksElapsed = timeElapsed / 1 weeks;
        return (positions[user].debt * INTEREST_RATE * weeksElapsed) / 100;
    }
}