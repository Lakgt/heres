import fs from "node:fs";
import path from "node:path";
import { network } from "hardhat";

function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const contents = fs.readFileSync(filePath, "utf8");

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(process.cwd(), ".env"));
loadEnvFile(path.join(process.cwd(), "..", ".env"));

if (!process.env.INJECTIVE_EVM_RPC_URL || !process.env.INJECTIVE_EVM_PRIVATE_KEY) {
  throw new Error(
    "Missing Injective deploy env. Set INJECTIVE_EVM_RPC_URL and INJECTIVE_EVM_PRIVATE_KEY before running the deploy command."
  );
}

const connection = await network.connect();
const { viem, networkName } = connection;

const [walletClient] = await viem.getWalletClients();
const publicClient = await viem.getPublicClient();

if (walletClient === undefined) {
  throw new Error("No wallet client found. Set INJECTIVE_EVM_PRIVATE_KEY in your env before deploying.");
}

console.log(`Deploying HeresCapsuleManager to ${networkName}...`);
console.log(`Deployer: ${walletClient.account.address}`);

const { contract, deploymentTransaction } = await viem.sendDeploymentTransaction("HeresCapsuleManager");

console.log(`Deployment tx: ${deploymentTransaction.hash}`);

const receipt = await publicClient.waitForTransactionReceipt({
  hash: deploymentTransaction.hash,
});

const deployedAddress = contract.address;

console.log(`Deployed at: ${deployedAddress}`);
console.log(`Block: ${receipt.blockNumber}`);

const outputPath = path.join(process.cwd(), "deployments.json");
const current = fs.existsSync(outputPath)
  ? JSON.parse(fs.readFileSync(outputPath, "utf8"))
  : {};

current[networkName] = {
  address: deployedAddress,
  txHash: deploymentTransaction.hash,
  deployer: walletClient.account.address,
  blockNumber: receipt.blockNumber.toString(),
  deployedAt: new Date().toISOString(),
};

fs.writeFileSync(outputPath, JSON.stringify(current, null, 2));
console.log(`Saved deployment record to ${outputPath}`);
