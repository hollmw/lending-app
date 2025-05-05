const { ethers } = require("ethers");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());            // @dev Enable Cross-Origin Resource Sharing
app.use(express.json());    // @dev Parse incoming JSON requests

// @dev Hardcoded private key for local testing (use env vars in production)
const PRIVATE_KEY = "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const wallet = new ethers.Wallet(PRIVATE_KEY); // @dev Ethers.js wallet from private key

/**
 * @dev Returns a random DAI valuation between `min` and `max` (as string)
 */
function getRandomDai(min = 1000, max = 5000) {
  const rand = Math.floor(Math.random() * (max - min + 1)) + min;
  return rand.toString();
}

/**
 * @route GET /api/valuation/:tokenId
 * @dev Signs a valuation message for a given NFT tokenId
 *      The message format is keccak256(tokenId, valuationWei)
 */
app.get("/api/valuation/:tokenId", async (req, res) => {
  try {
    const tokenId = parseInt(req.params.tokenId);
    if (isNaN(tokenId)) {
      return res.status(400).json({ error: "Invalid tokenId" });
    }

    const randomDai = getRandomDai();
    const valuationWei = ethers.utils.parseEther(randomDai).toString(); // Convert to wei

    const messageHash = ethers.utils.solidityKeccak256(
      ["uint256", "uint256"],
      [tokenId, valuationWei]
    );

    const signature = await wallet.signMessage(ethers.utils.arrayify(messageHash)); // Sign the hash

    res.json({
      valuationWei,
      signature,
      oracleSignerAddress: wallet.address,
      randomDai
    });
  } catch (err) {
    console.error("Signing failed:", err);
    res.status(500).json({ error: "Signing failed" });
  }
});

/**
 * @route POST /api/valuation
 * @dev Signs a valuation based on asset description (optional endpoint format)
 *      The message format is keccak256(description, valuationWei)
 */
app.post("/api/valuation", async (req, res) => {
  const { description } = req.body;

  if (!description) {
    return res.status(400).json({ error: "Missing asset description" });
  }

  const randomDai = getRandomDai();
  const valuationWei = ethers.utils.parseEther(randomDai).toString();

  try {
    const messageHash = ethers.utils.solidityKeccak256(
      ["string", "uint256"],
      [description, valuationWei]
    );
    const signature = await wallet.signMessage(ethers.utils.arrayify(messageHash));

    res.json({
      valuationWei,
      signature,
      oracleSignerAddress: wallet.address,
      randomDai,
      description
    });
  } catch (err) {
    console.error("Signing failed:", err);
    res.status(500).json({ error: "Signing failed" });
  }
});

/**
 * @dev Start server only if script is run directly (not imported)
 */
const PORT = process.env.PORT || 8080;
if (require.main === module) {
  app.listen(PORT, () =>
    console.log(`🟢 Oracle server running at http://localhost:${PORT}`)
  );
}

// @dev Export the app for testing or script import
module.exports = app;
