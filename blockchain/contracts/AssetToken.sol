// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AssetToken is ERC721Enumerable, Ownable {
    uint256 private _tokenIdCounter;

    mapping(uint256 => string) private _tokenURIs;

    constructor() ERC721("AssetToken", "AST") {}

    function mint(address to, string memory _tokenURI) public returns (uint256) {
        _tokenIdCounter++;
        uint256 newTokenId = _tokenIdCounter;
        _mint(to, newTokenId);
        _tokenURIs[newTokenId] = _tokenURI;
        return newTokenId;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return _tokenURIs[tokenId];
    }
}
