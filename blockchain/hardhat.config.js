require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.18",
  networks: {
    geth: {
      url: "http://127.0.0.1:8545",
      accounts: ["0x77b2bb0fc713f66221a192b18a10966bc5a124de6ab7e35b8641bc6d5c9c9"]
    }
  }
};