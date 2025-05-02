const { ethers } = require("ethers");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

const PRIVATE_KEY = "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const wallet = new ethers.Wallet(PRIVATE_KEY);

async function signValuation(tokenId, valuationWei) {
  const abiEncoded = ethers.utils.defaultAbiCoder.encode(
    ["uint256", "uint256"],
    [tokenId, valuationWei]
  );

  const hash = ethers.utils.keccak256(abiEncoded);
  const signature = await wallet.signMessage(ethers.utils.arrayify(hash));

  return { valuationWei, signature };
}

app.get("/api/valuation/:tokenId", async (req, res) => {
  const tokenId = req.params.tokenId;
  const valuationWei = "2000000000000000000000"; // 2000 DAI (in wei)

  try {
    const { signature } = await signValuation(tokenId, valuationWei);
    res.json({
      valuationWei,
      signature,
      oracleAddress: wallet.address,
    });
  } catch (err) {
    console.error("Signing failed:", err);
    res.status(500).json({ error: "Signing failed" });
  }
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`🟢 Oracle server running at http://localhost:${PORT}`);
});