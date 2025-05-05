// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Import OpenZeppelin contracts for ERC721 functionality and access control
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// AssetToken is a basic ERC-721 NFT contract for representing tokenized real-world assets
contract AssetToken is ERC721Enumerable, Ownable {
    uint256 public nextTokenId = 1; // Tracks the next token ID to mint

    // Custom metadata mappings
    mapping(uint256 => string) public tokenURIs;     // Maps token ID to metadata URI
    mapping(uint256 => string) public assetNames;    // Maps token ID to a human-readable asset name

    // Set name and symbol for the NFT collection
    constructor() ERC721("AssetToken", "AST") {}

    /**
     * @dev Mints a new NFT to the `to` address with a name and metadata URI
     * Can be called by any address (no access restriction)
     */
    function mint(address to, string memory assetName, string memory uri) external {
        uint256 tokenId = nextTokenId;
        nextTokenId++;

        _safeMint(to, tokenId); // Safely mint the NFT to the recipient
        tokenURIs[tokenId] = uri; // Store the metadata URI
        assetNames[tokenId] = assetName; // Store the human-readable name
    }

    /**
     * @dev Returns the metadata URI for a given token ID
     * Overrides the default `tokenURI` to use the custom mapping
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Query for nonexistent token");
        return tokenURIs[tokenId];
    }

    /**
     * @dev Returns the human-readable name of an asset for a given token ID
     */
    function getName(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "Query for nonexistent token");
        return assetNames[tokenId];
    }
}
