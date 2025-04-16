const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy AssetToken
  const AssetTokenFactory = await hre.ethers.getContractFactory("AssetToken");
  const assetToken = await AssetTokenFactory.deploy();
  await assetToken.waitForDeployment(); //  important
  const assetTokenAddress = await assetToken.getAddress();
  console.log("AssetToken deployed to:", assetTokenAddress);

  // Deploy MockDAI
  const MockDAIFactory = await hre.ethers.getContractFactory("MockDAI");
  const mockDAI = await MockDAIFactory.deploy();
  await mockDAI.waitForDeployment();
  const mockDAIAddress = await mockDAI.getAddress();
  console.log("MockDAI deployed to:", mockDAIAddress);

  // Deploy LendingPool
  const LendingPoolFactory = await hre.ethers.getContractFactory("LendingPool");
  const lendingPool = await LendingPoolFactory.deploy(assetTokenAddress, mockDAIAddress);
  await lendingPool.waitForDeployment();
  const lendingPoolAddress = await lendingPool.getAddress();
  console.log("LendingPool deployed to:", lendingPoolAddress);

  // Transfer initial liquidity
  const tx = await mockDAI.transfer(lendingPoolAddress, hre.ethers.parseEther("10000"));
  await tx.wait();
  console.log("Transferred 10,000 mDAI to LendingPool");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
