const hre = require("hardhat");
const { ethers, parseEther } = require("ethers");

async function main() {
  const [signer] = await hre.ethers.getSigners();

  console.log("Using account:", signer.address);
  const tx = await signer.sendTransaction({
    to: signer.address,
    value: parseEther("0.01"),
  });

  console.log("Transaction hash:", tx.hash);
  await tx.wait();
  console.log("Mined!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
