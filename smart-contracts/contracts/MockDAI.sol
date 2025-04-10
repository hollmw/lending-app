// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockDAI is ERC20 {
    constructor() ERC20("Mock DAI", "mDAI") {
        _mint(msg.sender, 1000000 * 10 ** decimals()); //deployer gets 1million erc20 tokens
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
