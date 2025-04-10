// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MockDAI.sol";

contract LendingPool {
    MockDAI public dai;
    uint256 public constant LTV = 70; //loan to value 70%

    mapping(address => uint256) public debt;

    constructor(address _daiAddress) {
        dai = MockDAI(_daiAddress);
    }

    function getCollateralValue(address user) public pure returns (uint256) {
        //everyone gets 1eth collat
        return 1 ether;
    }

    function getHealthFactor(address user) public view returns (uint256) {
        uint256 collateral = getCollateralValue(user);
        uint256 borrowed = debt[user];

        if (borrowed == 0) return type(uint256).max;
        return (collateral * 1e18) / borrowed; //1e18 precision
    }

    function borrow(uint256 amount) external {
        uint256 maxBorrow = (getCollateralValue(msg.sender) * LTV) / 100;
        require(debt[msg.sender] + amount <= maxBorrow, "Exceeds LTV");

        debt[msg.sender] += amount;
        dai.mint(msg.sender, amount);
    }

    function repay(uint256 amount) external {
        require(debt[msg.sender] >= amount, "Repaying too much");

        dai.transferFrom(msg.sender, address(this), amount);
        debt[msg.sender] -= amount;
    }

    function liquidate(address user) external {
        require(getHealthFactor(user) < 1e18, "Healthy position");
        debt[user] = 0;
        //sieze collateral
    }
}
