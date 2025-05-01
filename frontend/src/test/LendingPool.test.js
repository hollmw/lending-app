const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LendingPool", function() {
  let owner, user;
  let assetToken, stablecoin, lendingPool;

  beforeEach(async function() {
    [owner, user] = await ethers.getSigners();
    
    const AssetToken = await ethers.getContractFactory("AssetToken");
    assetToken = await AssetToken.deploy();
    
    const Stablecoin = await ethers.getContractFactory("Stablecoin");
    stablecoin = await Stablecoin.deploy();
    
    const LendingPool = await ethers.getContractFactory("LendingPool");
    lendingPool = await LendingPool.deploy(assetToken.address, stablecoin.address);
    
    // Mint NFT to user
    await assetToken.connect(user).mint(user.address, 1);
    // Fund pool with stablecoins
    await stablecoin.mint(lendingPool.address, ethers.utils.parseEther("1000"));
  });

  it("Should allow borrowing against NFT", async function() {
    // Approve lending pool
    await assetToken.connect(user).approve(lendingPool.address, 1);
    
    // Borrow
    const borrowAmount = ethers.utils.parseEther("100");
    await expect(lendingPool.connect(user).borrow(1, borrowAmount))
      .to.emit(lendingPool, "LoanCreated");
    
    // Verify loan created
    const loan = await lendingPool.loans(1);
    expect(loan.isActive).to.be.true;
    expect(loan.amount).to.equal(borrowAmount);
  });

  it("Should fail if not approved", async function() {
    const borrowAmount = ethers.utils.parseEther("100");
    await expect(lendingPool.connect(user).borrow(1, borrowAmount))
      .to.be.revertedWith("LendingPool: Not approved to transfer NFT");
  });
});