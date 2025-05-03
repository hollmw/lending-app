// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AssetToken is ERC721Enumerable, Ownable {
    uint256 public nextTokenId = 1;

    // Token metadata
    mapping(uint256 => string) public tokenURIs;
    mapping(uint256 => string) public assetNames;

    constructor() ERC721("AssetToken", "AST") {}

    function mint(address to, string memory assetName, string memory uri) external {
        uint256 tokenId = nextTokenId;
        nextTokenId++;

        _safeMint(to, tokenId);
        tokenURIs[tokenId] = uri;
        assetNames[tokenId] = assetName;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Query for nonexistent token");
        return tokenURIs[tokenId];
    }

    function getName(uint256 tokenId) external view returns (string memory) {
        require(_exists(tokenId), "Query for nonexistent token");
        return assetNames[tokenId];
    }
}
