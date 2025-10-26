import { ethers } from "ethers";

// Web3 Tools - for executing blockchain transactions
export const web3Tools = [
  {
    type: "function" as const,
    function: {
      name: "send_native_token",
      description: "Send native blockchain token (ETH on Ethereum, ARB on Arbitrum, etc.) to another address.",
      parameters: {
        type: "object",
        properties: {
          to: {
            type: "string",
            description: "The recipient address to send tokens to",
          },
          amount: {
            type: "string",
            description: "The amount of tokens to send (in native units, e.g., '0.1' for 0.1 ETH)",
          },
        },
        required: ["to", "amount"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "send_erc20_token",
      description: "Send ERC-20 tokens to another address. Requires token contract address, recipient, and amount.",
      parameters: {
        type: "object",
        properties: {
          contractAddress: {
            type: "string",
            description: "The ERC-20 token contract address",
          },
          to: {
            type: "string",
            description: "The recipient address to send tokens to",
          },
          amount: {
            type: "string",
            description: "The amount of tokens to send (in token units, e.g., '100' for 100 USDC)",
          },
        },
        required: ["contractAddress", "to", "amount"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_gas_price",
      description: "Get current gas price in Gwei for the network.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "estimate_transaction_gas",
      description: "Estimate gas cost for a transaction without executing it.",
      parameters: {
        type: "object",
        properties: {
          to: {
            type: "string",
            description: "The recipient address",
          },
          data: {
            type: "string",
            description: "Transaction data (optional, for contract calls)",
          },
        },
        required: ["to"],
      },
    },
  },
];

// Helper function to get wallet from private key
function getWallet(): ethers.Wallet {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("PRIVATE_KEY environment variable is not set");
  }

  // Get RPC URL from environment (Arbitrum for this project)
  const rpcUrl = process.env.RPC_URL || "https://arb1.arbitrum.io/rpc";
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  return new ethers.Wallet(privateKey, provider);
}

// Handler functions for each tool
export async function handleSendNativeToken(params: { to: string; amount: string }) {
  const wallet = getWallet();
  const tx = await wallet.sendTransaction({
    to: params.to,
    value: ethers.parseEther(params.amount),
  });
  
  return {
    success: true,
    hash: tx.hash,
    from: wallet.address,
    to: params.to,
    amount: params.amount,
    message: `Transaction sent: ${tx.hash}. Waiting for confirmation...`,
  };
}

export async function handleSendERC20Token(params: {
  contractAddress: string;
  to: string;
  amount: string;
}) {
  const wallet = getWallet();
  
  // ERC-20 ABI (just the transfer function)
  const erc20Abi = [
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function decimals() external view returns (uint8)",
  ];
  
  const contract = new ethers.Contract(params.contractAddress, erc20Abi, wallet);
  
  // Get decimals to properly format the amount
  const decimals = await contract.decimals();
  const amount = ethers.parseUnits(params.amount, decimals);
  
  const tx = await contract.transfer(params.to, amount);
  
  return {
    success: true,
    hash: tx.hash,
    from: wallet.address,
    to: params.to,
    contractAddress: params.contractAddress,
    amount: params.amount,
    message: `Token transfer sent: ${tx.hash}. Waiting for confirmation...`,
  };
}

export async function handleGetGasPrice(_params: Record<string, never>) {
  const rpcUrl = process.env.RPC_URL || "https://arb1.arbitrum.io/rpc";
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const feeData = await provider.getFeeData();
  
  return {
    gasPrice: ethers.formatUnits(feeData.gasPrice || BigInt(0), "gwei") + " Gwei",
    maxFeePerGas: feeData.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, "gwei") + " Gwei" : null,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? ethers.formatUnits(feeData.maxPriorityFeePerGas, "gwei") + " Gwei" : null,
  };
}

export async function handleEstimateTransactionGas(params: { to: string; data?: string }) {
  const wallet = getWallet();
  
  const estimate = await wallet.provider?.estimateGas({
    to: params.to,
    from: wallet.address,
    data: params.data,
  });
  
  const feeData = await wallet.provider?.getFeeData();
  const estimatedCost = estimate ? estimate * (feeData?.gasPrice || BigInt(0)) : BigInt(0);

  return {
    estimatedGas: estimate ? estimate.toString() : "N/A",
    estimatedCost: ethers.formatEther(estimatedCost),
    estimatedCostUSD: "N/A", // Would need price oracle to calculate this
    to: params.to,
  };
}

