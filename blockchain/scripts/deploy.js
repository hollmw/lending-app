// scripts/deploy.js

const fs = require('fs');
const path = require('path');
const { parseUnits } = require('ethers');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);

  const AssetToken = await ethers.getContractFactory('AssetToken');
  const assetToken = await AssetToken.deploy();
  await assetToken.waitForDeployment();
  const assetTokenAddress = await assetToken.getAddress();
  console.log('AssetToken deployed to:', assetTokenAddress);

  const MockDAI = await ethers.getContractFactory('MockDAI');
  const mockDai = await MockDAI.deploy();
  await mockDai.waitForDeployment();
  const mockDaiAddress = await mockDai.getAddress();
  console.log('MockDAI deployed to:', mockDaiAddress);

  const LendingPool = await ethers.getContractFactory('LendingPool');
  const lendingPool = await LendingPool.deploy(mockDaiAddress, assetTokenAddress);
  await lendingPool.waitForDeployment();
  const lendingPoolAddress = await lendingPool.getAddress();
  console.log('LendingPool deployed to:', lendingPoolAddress);

  const transferTx = await mockDai.transfer(lendingPoolAddress, parseUnits('10000', 18));
  await transferTx.wait();
  console.log('Transferred 10,000 mDAI to LendingPool');

  // === Save addresses to frontend/src/addresses.js ===
  const addresses = `
    export const assetTokenAddress = "${assetTokenAddress}";\nexport const mockDaiAddress = "${mockDaiAddress}";\nexport const lendingPoolAddress = "${lendingPoolAddress}";
    `;

  const frontendDir = path.resolve(__dirname, '..', '..', 'frontend', 'src');

  if (!fs.existsSync(frontendDir)) {
    console.error('Error: Frontend directory not found:', frontendDir);
    return;
  }

  fs.writeFileSync(
    path.join(frontendDir, 'addresses.js'),
    addresses.trim(),
    { encoding: 'utf8' }
  );

  console.log('Wrote deployed addresses to frontend/src/addresses.js');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
