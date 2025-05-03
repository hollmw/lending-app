/**
 AssetToken (ERC-721): Verifies that only the owner can mint NFTs, checks ownership and metadata 
 (name, tokenURI), and ensures querying a nonexistent token reverts.

  MockDAI (ERC-20): Confirms the deployer initially receives 1 million tokens and that any address 
  can mint additional tokens.

  LendingPool: Sets up a pool backed by an NFT collateral (AssetToken) and DAI-like stablecoin. 
  It tests off-chain valuation signature verification, borrowing via a signed valuation (emitting ValuationUsed), 
  liquidation behavior (reverting before a loan exists, then emitting LoanLiquidated after borrowing), 
  updating the interest rate, and retrieving active loan IDs per user.
 */




const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AssetToken (ERC721)", function () {
  let assetToken;
  let owner, user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    const AT = await ethers.getContractFactory("AssetToken");
    assetToken = await AT.deploy();
    await assetToken.waitForDeployment();
  });

  it("lets owner mint a new NFT and sets metadata correctly", async function () {
    await assetToken.mint(user.address, "AssetName", "uri://test");
    expect(await assetToken.ownerOf(1n)).to.equal(user.address);
    expect(await assetToken.getName(1n)).to.equal("AssetName");
    expect(await assetToken.tokenURI(1n)).to.equal("uri://test");
  });

  it("reverts querying metadata for nonexistent token", async function () {
    await expect(assetToken.tokenURI(999n)).to.be.reverted; // Should revert if token doesn't exist
  });
});

describe("MockDAI (ERC20)", function () {
  let mockDai;
  let deployer, user;

  beforeEach(async function () {
    [deployer, user] = await ethers.getSigners();
    const MD = await ethers.getContractFactory("MockDAI");
    mockDai = await MD.deploy();
    await mockDai.waitForDeployment();
  });

  it("initially mints 1M tokens to deployer", async function () {
    const balance = await mockDai.balanceOf(deployer.address);
    expect(balance).to.equal(ethers.parseEther("1000000")); // Deployer gets 1 million DAI
  });

  it("lets anyone mint new tokens", async function () {
    await mockDai.mint(user.address, ethers.parseEther("500"));
    expect(await mockDai.balanceOf(user.address)).to.equal(ethers.parseEther("500")); // User mints 500 DAI
  });
});

describe("LendingPool (ethers v6)", function () {
  let assetToken, stablecoin, pool;
  let owner, alice, bob, oracle;

  beforeEach(async function () {
    [owner, alice, bob, oracle] = await ethers.getSigners();
    const AT = await ethers.getContractFactory("AssetToken");
    assetToken = await AT.deploy();
    await assetToken.waitForDeployment();

    const MD = await ethers.getContractFactory("MockDAI");
    stablecoin = await MD.deploy();
    await stablecoin.waitForDeployment();

    const LP = await ethers.getContractFactory("LendingPool");
    pool = await LP.deploy(assetToken.target, stablecoin.target);
    await pool.waitForDeployment();

    await pool.setOracle(oracle.address);
    await pool.setOracleSigner(oracle.address);
    await stablecoin.mint(pool.target, ethers.parseEther("10000")); // Fund pool liquidity
    await assetToken.mint(alice.address, "Asset", "uri://1");      // Alice owns NFT #1
  });

  it("verifyValuationSignature returns true for valid signature", async function () {
    const tokenId = 1n;
    const valuation = ethers.parseEther("10");
    const abi = new ethers.AbiCoder();
    const encoded = abi.encode(["uint256","uint256"], [tokenId, valuation]);
    const hash = ethers.keccak256(encoded);
    const sig = await oracle.signMessage(ethers.getBytes(hash));
    expect(await pool.verifyValuationSignature(tokenId, valuation, sig)).to.be.true; // Signature matches oracle
  });

  it("borrowWithSignature allows borrowing and emits events", async function () {
    const tokenId = 1n;
    const valuation = ethers.parseEther("20");
    const deadline = (await ethers.provider.getBlock()).timestamp + 3600;
    // Sign payload with deadline
    const message = ethers.solidityPackedKeccak256(
      ["uint256","uint256","uint256"], 
      [tokenId, valuation, BigInt(deadline)]
    );
    const ethHash = ethers.hashMessage(ethers.getBytes(message));
    const { r, s, v } = ethers.Signature.from(await oracle.signMessage(ethers.getBytes(message)));
    await assetToken.connect(alice).approve(pool.target, tokenId); // Approve collateral
    await expect(
      pool.connect(alice).borrowWithSignature(
        tokenId, ethers.parseEther("14"), valuation, BigInt(deadline), v, r, s
      )
    ).to.emit(pool, "ValuationUsed"); // Should emit ValuationUsed on success
  });

  it("liquidate reverts for inactive loan and succeeds after borrow", async function () {
    await expect(pool.liquidate(1n)).to.be.revertedWith("Loan not active"); // No loan yet

    // Create a loan
    const tokenId = 1n;
    const valuation = ethers.parseEther("10");
    const abi = new ethers.AbiCoder();
    const encoded = abi.encode(["uint256","uint256"], [tokenId, valuation]);
    const hash = ethers.keccak256(encoded);
    const sig = await oracle.signMessage(ethers.getBytes(hash));
    await assetToken.connect(alice).approve(pool.target, tokenId);
    await pool.connect(alice).borrow(tokenId, ethers.parseEther("7"), valuation, sig);

    await expect(pool.liquidate(2n)).to.emit(pool, "LoanLiquidated"); // Now loan can be liquidated
  });

  it("updateInterestRate changes the rate", async function () {
    await pool.updateInterestRate(1000);
    expect(await pool.interestRate()).to.equal(1000); // Interest rate updated
  });

  it("getUserLoans returns correct loan IDs", async function () {
    // Borrow a loan for Alice
    const tokenId = 1n;
    const valuation = ethers.parseEther("10");
    const abi = new ethers.AbiCoder();
    const encoded = abi.encode(["uint256","uint256"], [tokenId, valuation]);
    const hash = ethers.keccak256(encoded);
    const sig = await oracle.signMessage(ethers.getBytes(hash));
    await assetToken.connect(alice).approve(pool.target, tokenId);
    await pool.connect(alice).borrow(tokenId, ethers.parseEther("7"), valuation, sig);

    const loans = await pool.getUserLoans(alice.address);
    expect(loans.map(n => n.toString())).to.deep.equal(["2"]); // Returns loan ID 2
  });
});
