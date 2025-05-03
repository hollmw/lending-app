
/**
 * This suite performs an end-to-end integration test of the LendingPool system: it deploys the ERC-721 
 * AssetToken, ERC-20 MockDAI, and LendingPool contracts; configures the oracle and funds the pool; then 
 * walks through minting NFTs to Alice, borrowing against them both via off-chain signatures and on-chain 
 * calls, repaying a loan and reclaiming collateral, and finally having Bob liquidate an undercollateralized 
 * position—verifying all key events, balances, ownership transfers, and loan records along the way.
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LendingPool System Integration", function () {
  let assetToken, stablecoin, pool;
  let owner, alice, bob, oracle;

  beforeEach(async function () {
    [owner, alice, bob, oracle] = await ethers.getSigners();
    const AssetToken = await ethers.getContractFactory("AssetToken");
    assetToken = await AssetToken.deploy();
    await assetToken.waitForDeployment();

    const MockDAI = await ethers.getContractFactory("MockDAI");
    stablecoin = await MockDAI.deploy();
    await stablecoin.waitForDeployment();

    const LendingPool = await ethers.getContractFactory("LendingPool");
    pool = await LendingPool.deploy(assetToken.target, stablecoin.target);
    await pool.waitForDeployment();

    // Configure oracle address and seed pool liquidity
    await pool.setOracle(oracle.address);
    await pool.setOracleSigner(oracle.address);
    await stablecoin.mint(pool.target, ethers.parseEther("10000"));
  });

  it("full end-to-end: mint → borrowWithSignature → repay → borrow → liquidate", async function () {
    // Mint NFT #1 to Alice and verify ownership
    await assetToken.mint(alice.address, "Asset #1", "uri://1");
    expect(await assetToken.ownerOf(1n)).to.equal(alice.address);

    // Borrow using off-chain signature and emit ValuationUsed
    await assetToken.connect(alice).approve(pool.target, 1n);
    const valuation1 = ethers.parseEther("100");
    const deadline   = BigInt((await ethers.provider.getBlock()).timestamp + 3600);
    const packed1    = ethers.solidityPackedKeccak256(
      ["uint256","uint256","uint256"],
      [1n, valuation1, deadline]
    );
    const sig1       = await oracle.signMessage(ethers.getBytes(packed1));
    const { r, s, v } = ethers.Signature.from(sig1);

    await expect(
      pool.connect(alice).borrowWithSignature(
        1n,
        ethers.parseEther("70"),
        valuation1,
        deadline,
        v, r, s
      )
    )
      .to.emit(pool, "ValuationUsed")
      .withArgs(1n, valuation1, ethers.parseEther("70"));

    // Borrow on-chain via borrow() and emit LoanCreated, check balances & collateral transfer
    await assetToken.connect(alice).approve(pool.target, 1n);
    const encodedBorrow1 = new ethers.AbiCoder().encode(
      ["uint256","uint256"],
      [1n, valuation1]
    );
    const hashBorrow1    = ethers.keccak256(encodedBorrow1);
    const sigBorrow1     = await oracle.signMessage(ethers.getBytes(hashBorrow1));
    const borrowAmt1     = ethers.parseEther("50");

    await expect(
      pool.connect(alice).borrow(1n, borrowAmt1, valuation1, sigBorrow1)
    )
      .to.emit(pool, "LoanCreated")
      .withArgs(2n, 1n, borrowAmt1);

    expect(await assetToken.ownerOf(1n)).to.equal(pool.target);
    expect(await stablecoin.balanceOf(alice.address)).to.equal(borrowAmt1);

    // Repay loan #2 in full and verify LoanRepaid + NFT returns to Alice
    const loan2     = await pool.loans(2n);
    const totalDue2 = loan2.amount + loan2.interestDue;
    await stablecoin.mint(alice.address, totalDue2);
    await stablecoin.connect(alice).approve(pool.target, totalDue2);

    await expect(pool.connect(alice).repay(2n))
      .to.emit(pool, "LoanRepaid")
      .withArgs(2n, totalDue2);

    expect(await assetToken.ownerOf(1n)).to.equal(alice.address);

    // Mint NFT #2, create loan #3 and then Bob liquidates it, receiving the NFT
    await assetToken.mint(alice.address, "Asset #2", "uri://2");
    const valuation2     = ethers.parseEther("200");
    const encodedBorrow2 = new ethers.AbiCoder().encode(
      ["uint256","uint256"],
      [2n, valuation2]
    );
    const hashBorrow2    = ethers.keccak256(encodedBorrow2);
    const sigBorrow2     = await oracle.signMessage(ethers.getBytes(hashBorrow2));
    const borrowAmt2     = ethers.parseEther("140");

    await assetToken.connect(alice).approve(pool.target, 2n);
    await expect(
      pool.connect(alice).borrow(2n, borrowAmt2, valuation2, sigBorrow2)
    )
      .to.emit(pool, "LoanCreated")
      .withArgs(3n, 2n, borrowAmt2);

    await expect(pool.connect(bob).liquidate(3n))
      .to.emit(pool, "LoanLiquidated")
      .withArgs(3n);
    expect(await assetToken.ownerOf(2n)).to.equal(bob.address);

    // Verify that Alice’s loan history includes loan IDs 2 and 3
    const loansAlice = await pool.getUserLoans(alice.address);
    expect(loansAlice.map(x => x.toString())).to.include.members(["2","3"]);
  });
});
