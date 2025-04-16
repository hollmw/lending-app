// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockDAI is ERC20 {
    constructor() ERC20("MockDAI", "mDAI") {
        _mint(msg.sender, 1000000 * 10 ** decimals()); // Mint 1M tokens to deployer
    }
    
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}