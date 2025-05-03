const { ethers } = require("ethers");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PRIVATE_KEY = "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";//hardcoded but is ok
const wallet = new ethers.Wallet(PRIVATE_KEY);

function getRandomDai(min = 1000, max = 5000) {
  const rand = Math.floor(Math.random() * (max - min + 1)) + min;
  return rand.toString();
}

app.get("/api/valuation/:tokenId", async (req, res) => {
  try {
    const tokenId = parseInt(req.params.tokenId);
    if (isNaN(tokenId)) {
      return res.status(400).json({ error: "Invalid tokenId" });
    }

    const randomDai = getRandomDai();
    const valuationWei = ethers.utils.parseEther(randomDai).toString();

    const messageHash = ethers.utils.solidityKeccak256(
      ["uint256", "uint256"],
      [tokenId, valuationWei]
    );

    const signature = await wallet.signMessage(ethers.utils.arrayify(messageHash));

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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🟢 Oracle server running at http://localhost:${PORT}`);
});
