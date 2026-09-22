const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("==================================================");
  console.log("Deploying ParaPilot Policy Infrastructure to Monad Testnet");
  console.log("==================================================");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer Address:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer Balance:", ethers.formatEther(balance), "MON");

  const fee = await ethers.provider.getFeeData();
  const maxFeePerGas = ((fee.gasPrice ?? 100_000_000_000n) * 125n) / 100n;
  const maxPriorityFeePerGas = 2_000_000_000n;
  // Monad testnet charges the full gas limit, so every cap is explicit.
  // PasskeyVerifier does not fit here: its code deposit is about 1.12M gas.
  const gas = { deploy: 900_000n, fund: 25_000n };

  // 1. Deploy SessionKeyValidator
  console.log("\n[1] Deploying SessionKeyValidator...");
  const Validator = await ethers.getContractFactory("SessionKeyValidator");
  const validator = await Validator.deploy({ gasLimit: gas.deploy, maxFeePerGas, maxPriorityFeePerGas });
  await validator.waitForDeployment();
  const validatorAddress = await validator.getAddress();
  const txValHash = validator.deploymentTransaction() ? validator.deploymentTransaction().hash : "N/A";
  console.log("✅ SessionKeyValidator deployed to:", validatorAddress);
  console.log("   Tx Hash:", txValHash);

  // 2. Deploy sample ParaPilotAccount
  console.log("\n[2] Deploying ParaPilotAccount (Smart Account)...");
  const Account = await ethers.getContractFactory("ParaPilotAccount");
  const account = await Account.deploy(deployer.address, validatorAddress, {
    gasLimit: gas.deploy,
    maxFeePerGas,
    maxPriorityFeePerGas,
  });
  await account.waitForDeployment();
  const accountAddress = await account.getAddress();
  const txAccHash = account.deploymentTransaction() ? account.deploymentTransaction().hash : "N/A";
  console.log("✅ ParaPilotAccount deployed to:", accountAddress);
  console.log("   Tx Hash:", txAccHash);

  // 3. Fund ParaPilotAccount with 0.1 MON
  console.log("\n[3] Funding ParaPilotAccount with 0.1 MON for agent operations...");
  const fundTx = await deployer.sendTransaction({
    to: accountAddress,
    value: ethers.parseEther("0.1"),
    gasLimit: gas.fund,
    maxFeePerGas,
    maxPriorityFeePerGas,
  });
  await fundTx.wait();
  console.log("✅ Account Funded! Tx Hash:", fundTx.hash);

  const summary = {
    network: "monadTestnet",
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    contracts: {
      SessionKeyValidator: {
        address: validatorAddress,
        deploymentTx: txValHash,
        explorerUrl: `https://testnet.monadexplorer.com/address/${validatorAddress}`
      },
      ParaPilotAccount: {
        address: accountAddress,
        deploymentTx: txAccHash,
        explorerUrl: `https://testnet.monadexplorer.com/address/${accountAddress}`
      }
    },
    fundingTx: fundTx.hash,
    timestamp: new Date().toISOString()
  };

  const outFile = path.join(__dirname, "../deployments.json");
  fs.writeFileSync(outFile, JSON.stringify(summary, null, 2));
  console.log("\n==================================================");
  console.log("Deployment details written to:", outFile);
  console.log("==================================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
