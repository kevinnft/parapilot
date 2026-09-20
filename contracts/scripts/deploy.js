const { ethers } = require("hardhat");

async function main() {
  console.log("==================================================");
  console.log("Deploying ParaPilot Policy Infrastructure to Monad");
  console.log("==================================================");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer Address:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer Balance:", ethers.formatEther(balance), "MON / ETH");

  // 1. Deploy SessionKeyValidator
  console.log("\n[1] Deploying SessionKeyValidator...");
  const Validator = await ethers.getContractFactory("SessionKeyValidator");
  const validator = await Validator.deploy();
  await validator.waitForDeployment();
  const validatorAddress = await validator.getAddress();
  console.log("✅ SessionKeyValidator deployed to:", validatorAddress);

  // 2. Deploy sample ParaPilotAccount
  console.log("\n[2] Deploying sample ParaPilotAccount...");
  const Account = await ethers.getContractFactory("ParaPilotAccount");
  const account = await Account.deploy(deployer.address, validatorAddress);
  await account.waitForDeployment();
  const accountAddress = await account.getAddress();
  console.log("✅ ParaPilotAccount deployed to:", accountAddress);

  console.log("\n==================================================");
  console.log("Deployment Summary:");
  console.log("  - Network:           Monad (ChainID: " + (await ethers.provider.getNetwork()).chainId + ")");
  console.log("  - SessionValidator: ", validatorAddress);
  console.log("  - Account Template: ", accountAddress);
  console.log("==================================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
