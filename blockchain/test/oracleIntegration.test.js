/**
 * This test starts your off-chain oracle server, deploys AssetToken, MockDAI, and 
 * LendingPool (funding it and setting the oracle), mints an NFT to Alice, fetches a 
 * signed valuation via HTTP, and then has Alice approve the NFT and call borrow(...), 
 * asserting the LoanCreated event and that the pool holds the NFT while Alice receives the correct DAI.
 */



const { expect } = require("chai");
const { ethers } = require("hardhat");
const axios = require("axios");
const app = require("../../oracle/sign");

describe("Oracle ↔ LendingPool Integration", function () {
  let server, oracleUrl;
  let assetToken, stablecoin, pool;
  let oracleSigner, alice;

  before(async function () {
    server = app.listen(0);
    const port = server.address().port;
    oracleUrl = `http://127.0.0.1:${port}/api/valuation`;
  });

  after(async function () {
    await server.close();
  });

  beforeEach(async function () {
    [oracleSigner, alice] = await ethers.getSigners();

    const AT = await ethers.getContractFactory("AssetToken");
    assetToken = await AT.deploy();
    await assetToken.waitForDeployment();

    const MD = await ethers.getContractFactory("MockDAI");
    stablecoin = await MD.deploy();
    await stablecoin.waitForDeployment();

    const LP = await ethers.getContractFactory("LendingPool");
    pool = await LP.deploy(assetToken.target, stablecoin.target);
    await pool.waitForDeployment();

    await pool.setOracle(oracleSigner.address);
    await pool.setOracleSigner(oracleSigner.address);
    await stablecoin.mint(pool.target, ethers.parseEther("10000"));

    // mint NFT #1  Alice
    await assetToken.mint(alice.address, "IntegrationAsset", "uri://1");
  });

  it("fetches a signed valuation and then borrows on-chain", async function () {
    const tokenId = 1n;

    const res = await axios.get(`${oracleUrl}/${tokenId}`);
    expect(res.status).to.equal(200);

    const { valuationWei, signature, oracleSignerAddress } = res.data;
    expect(oracleSignerAddress).to.equal(oracleSigner.address);

    await assetToken.connect(alice).approve(pool.target, tokenId);

    const val       = BigInt(valuationWei);
    const borrowAmt = (val * 70n) / 100n;

    await expect(
      pool.connect(alice).borrow(tokenId, borrowAmt, valuationWei, signature)
    )
      .to.emit(pool, "LoanCreated")
      .withArgs(2n, tokenId, borrowAmt);

    expect(await assetToken.ownerOf(tokenId)).to.equal(pool.target);
    expect(await stablecoin.balanceOf(alice.address)).to.equal(borrowAmt);
  });
});
