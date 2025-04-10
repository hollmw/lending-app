require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.18",
  networks: {
    geth: {
      url: "http://127.0.0.1:8545",
      accounts: ["0x3312808a70ac5b2fa204f035934c6edf57eebf4e85fdf7e4831bef1b90657be49b"]
    }
  }
};