// scripts/copyAbis.js

const fs = require('fs');
const path = require('path');

const contracts = ['AssetToken', 'LendingPool', 'MockDAI']; //add

const sourceBase = path.resolve(__dirname, '../artifacts/contracts');
const dest = path.resolve(__dirname, '../../frontend/src/abis');

if (!fs.existsSync(dest)) {
  fs.mkdirSync(dest, { recursive: true });
}

contracts.forEach((name) => {
  const contractJson = path.join(sourceBase, `${name}.sol/${name}.json`);
  const abi = JSON.parse(fs.readFileSync(contractJson)).abi;

  fs.writeFileSync(
    path.join(dest, `${name}.json`),
    JSON.stringify({ abi }, null, 2),
    'utf8'
  );

  console.log(`✅ Copied ABI for ${name} → frontend/src/abis/${name}.json`);
});
