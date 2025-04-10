async function main() {
    const [deployer] = await ethers.getSigners();
  
    console.log("Deploying contracts with:", deployer.address);
  
    const MockDAI = await ethers.getContractFactory("MockDAI");
    const dai = await MockDAI.deploy();
    await dai.deployed();
    console.log("MockDAI deployed to:", dai.address);
  
    const LendingPool = await ethers.getContractFactory("LendingPool");
    const pool = await LendingPool.deploy(dai.address);
    await pool.deployed();
    console.log("LendingPool deployed to:", pool.address);
  }
  
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
  