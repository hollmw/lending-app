const fs = require("fs");
const { Wallet } = require("@ethereumjs/wallet");

const keyfile = fs.readFileSync("./data/keystore/UTC--2025-04-10T20-48-36.381129147Z--964c7150be82f82b9a983063b829fa36defa0c30", "utf8");
const password = "password"; // Your actual password here

(async () => {
  const wallet = await Wallet.fromV3(JSON.parse(keyfile), password);
  console.log("Private key:", "0x" + wallet.getPrivateKey().toString("hex"));
})();
