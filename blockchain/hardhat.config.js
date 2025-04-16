require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ethers");

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.0", // for your contracts like AssetToken and LendingPool
      },
      {
        version: "0.8.28", // for Lock.sol or others that need newer version
      }
    ]
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    }
  }
};