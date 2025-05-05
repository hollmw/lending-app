// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockDAI
 * @dev A simple mock ERC-20 token used for testing stablecoin interactions.
 *      Includes a public `mint` function to simplify test funding.
 */
contract MockDAI is ERC20 {
    /**
     * @dev Constructor mints 1,000,000 tokens to the deployer.
     */
    constructor() ERC20("MockDAI", "mDAI") {
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    /**
     * @dev Allows any user to mint tokens for testing purposes.
     * @param to Address to receive minted tokens
     * @param amount Number of tokens to mint (in wei)
     */
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
