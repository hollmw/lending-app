// oracle/test/oracle.test.js
const request = require("supertest");
const { expect } = require("chai");
const { ethers } = require("ethers");

const app = require("../sign");

const server = request(app);

describe("Oracle API", function() {
  it("GET /api/valuation/:tokenId → valid JSON + recoverable signature", async function() {
    const tokenId = 123;
    const res = await server.get(`/api/valuation/${tokenId}`);
    expect(res.status).to.equal(200);
    expect(res.body).to.have.keys([
      "valuationWei",
      "signature",
      "oracleSignerAddress",
      "randomDai"
    ]);

    const { valuationWei, signature, oracleSignerAddress } = res.body;
    const hash = ethers.utils.solidityKeccak256(
      ["uint256", "uint256"],
      [tokenId, valuationWei]
    );
    const recovered = ethers.utils.verifyMessage(
      ethers.utils.arrayify(hash),
      signature
    );
    expect(recovered).to.equal(oracleSignerAddress);
  });

  it("POST /api/valuation → accepts description + returns description", async function() {
    const payload = { description: "Some rare artifact" };
    const res = await server
      .post("/api/valuation")
      .send(payload)
      .set("Content-Type", "application/json");

    expect(res.status).to.equal(200);
    expect(res.body.description).to.equal(payload.description);
    expect(res.body).to.include.keys([
      "valuationWei",
      "signature",
      "oracleSignerAddress",
      "randomDai"
    ]);

    // verify signature for ["string","uint256"]
    const { valuationWei, signature, oracleSignerAddress } = res.body;
    const hash = ethers.utils.solidityKeccak256(
      ["string", "uint256"],
      [payload.description, valuationWei]
    );
    const recovered = ethers.utils.verifyMessage(
      ethers.utils.arrayify(hash),
      signature
    );
    expect(recovered).to.equal(oracleSignerAddress);
  });

  it("GET /api/valuation/:tokenId → 400 on invalid tokenId", async function() {
    const res = await server.get("/api/valuation/not-a-number");
    expect(res.status).to.equal(400);
    expect(res.body.error).to.match(/Invalid tokenId/);
  });

  it("POST /api/valuation → 400 on missing description", async function() {
    const res = await server
      .post("/api/valuation")
      .send({})
      .set("Content-Type", "application/json");
    expect(res.status).to.equal(400);
    expect(res.body.error).to.match(/Missing asset description/);
  });
});
