import {formatEther, formatUnits} from 'ethers'

// Blockscout API Tools
// API Base URL: https://eth-sepolia.blockscout.com/api
const API_BASE_URL = "https://arbitrum.blockscout.com/api";

export const blockscoutTools = [
  {
    type: "function" as const,
    function: {
      name: "get_native_token_balance",
      description: "Get the native token balance for an Ethereum address. Returns balance in wei.",
      parameters: {
        type: "object",
        properties: {
          address: {
            type: "string",
            description: "The Ethereum address to get balance for",
          },
        },
        required: ["address"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_transactions_by_address",
      description: "Get transactions by Ethereum address. Maximum of 10,000 transactions. For faster results, specify a smaller block range.",
      parameters: {
        type: "object",
        properties: {
          address: {
            type: "string",
            description: "The Ethereum address to get transactions for",
          },
          sort: {
            type: "string",
            enum: ["asc", "desc"],
            description: "Sort order: 'asc' for ascending, 'desc' for descending",
          },
          startblock: {
            type: "number",
            description: "Starting block number to search from",
          },
          endblock: {
            type: "number",
            description: "Ending block number to search to",
          },
          page: {
            type: "number",
            description: "Page number for pagination",
          },
          offset: {
            type: "number",
            description: "Number of transactions per page",
          },
        },
        required: ["address"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_erc20_token_transfers",
      description: "Get ERC-20 token transfer events by address (up to 10,000).",
      parameters: {
        type: "object",
        properties: {
          address: {
            type: "string",
            description: "Address to get ERC-20 token transfers for",
          },
          contractaddress: {
            type: "string",
            description: "Token contract address to filter by",
          },
          sort: {
            type: "string",
            enum: ["asc", "desc"],
            description: "Sort order: 'asc' for ascending, 'desc' for descending",
          },
          startblock: {
            type: "number",
            description: "Starting block number to search from",
          },
          endblock: {
            type: "number",
            description: "Ending block number to search to",
          },
          page: {
            type: "number",
            description: "Page number for pagination",
          },
          offset: {
            type: "number",
            description: "Number of transactions per page",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_token_list",
      description: "Get list of all tokens and their balances owned by an Ethereum address.",
      parameters: {
        type: "object",
        properties: {
          address: {
            type: "string",
            description: "Address to get token list for",
          },
        },
        required: ["address"],
      },
    },
  },
];

// Handler functions for each tool
export async function handleGetNativeTokenBalance(params: { address: string }) {
  const url = new URL(`${API_BASE_URL}`);
  url.searchParams.append("module", "account");
  url.searchParams.append("action", "balance");
  url.searchParams.append("address", params.address);

  const response = await fetch(url.toString());
  const data = await response.json();
  return formatEther(data.result);
}

export async function handleGetTransactionsByAddress(params: {
  address: string;
  sort?: string;
  startblock?: number;
  endblock?: number;
  page?: number;
  offset?: number;
}) {
  const url = new URL(`${API_BASE_URL}`);
  url.searchParams.append("module", "account");
  url.searchParams.append("action", "txlist");
  url.searchParams.append("address", params.address);
  
  if (params.sort) url.searchParams.append("sort", params.sort);
  if (params.startblock !== undefined) url.searchParams.append("startblock", params.startblock.toString());
  if (params.endblock !== undefined) url.searchParams.append("endblock", params.endblock.toString());
  if (params.page !== undefined) url.searchParams.append("page", params.page.toString());
  if (params.offset !== undefined) url.searchParams.append("offset", params.offset.toString());

  const response = await fetch(url.toString());
  const data = await response.json();
  return data;
}

export async function handleGetERC20TokenTransfers(params: {
  address?: string;
  contractaddress?: string;
  sort?: string;
  startblock?: number;
  endblock?: number;
  page?: number;
  offset?: number;
}) {
  const url = new URL(`${API_BASE_URL}`);
  url.searchParams.append("module", "account");
  url.searchParams.append("action", "tokentx");

  if (params.address) url.searchParams.append("address", params.address);
  if (params.contractaddress) url.searchParams.append("contractaddress", params.contractaddress);
  if (params.sort) url.searchParams.append("sort", params.sort);
  if (params.startblock !== undefined) url.searchParams.append("startblock", params.startblock.toString());
  if (params.endblock !== undefined) url.searchParams.append("endblock", params.endblock.toString());
  if (params.page !== undefined) url.searchParams.append("page", params.page.toString());
  if (params.offset !== undefined) url.searchParams.append("offset", params.offset.toString());

  const response = await fetch(url.toString());
  const data = await response.json();
  return data;
}

export async function handleGetTokenList(params: { address: string }) {
  const url = new URL(`${API_BASE_URL}`);
  url.searchParams.append("module", "account");
  url.searchParams.append("action", "tokenlist");
  url.searchParams.append("address", params.address);

  const response = await fetch(url.toString());
  const data = await response.json();
  
  // Format token balances using formatUnits
  if (data.result && Array.isArray(data.result)) {
    const formattedTokens = data.result.map((token: {
      balance: string;
      contractAddress: string;
      decimals: string;
      name: string;
      symbol: string;
      type: string;
    }) => {
      const decimals = parseInt(token.decimals) || 18;
      const formattedBalance = formatUnits(token.balance, decimals);
      
      return {
        name: token.name,
        formattedBalance,
        image: `https://static.cx.metamask.io/api/v1/tokenIcons/42161/${token.contractAddress}.png`,
      };
    });
    
    return {
      ...data,
      result: formattedTokens,
    };
  }
  
  return data;
}

