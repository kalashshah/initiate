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
  {
    type: "function" as const,
    function: {
      name: "get_erc721_token_transfers",
      description: "Get ERC-721 (NFT) token transfer events by address or contract.",
      parameters: {
        type: "object",
        properties: {
          address: {
            type: "string",
            description: "Address to get ERC-721 transfers for",
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
      name: "get_erc1155_token_transfers",
      description: "Get ERC-1155 token transfer events by address or contract.",
      parameters: {
        type: "object",
        properties: {
          address: {
            type: "string",
            description: "Address to get ERC-1155 transfers for",
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
      name: "get_internal_transactions",
      description: "Get internal transactions by transaction hash or address (up to 10,000).",
      parameters: {
        type: "object",
        properties: {
          txhash: {
            type: "string",
            description: "Transaction hash to check for internal transactions",
          },
          address: {
            type: "string",
            description: "Address to get internal transactions for",
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
      name: "get_contract_abi",
      description: "Get the ABI for a verified smart contract address.",
      parameters: {
        type: "object",
        properties: {
          address: {
            type: "string",
            description: "The contract address to get the ABI for",
          },
        },
        required: ["address"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_contract_source_code",
      description: "Get the source code for a verified smart contract address.",
      parameters: {
        type: "object",
        properties: {
          address: {
            type: "string",
            description: "The contract address to get the source code for",
          },
        },
        required: ["address"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_contract_creation",
      description: "Get the creator address and transaction hash for one or more contract addresses (up to 10).",
      parameters: {
        type: "object",
        properties: {
          contractaddresses: {
            type: "string",
            description: "Comma-separated list of contract addresses (max 10)",
          },
        },
        required: ["contractaddresses"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_token_info",
      description: "Get name, symbol, supply, decimals, and type (ERC-20/ERC-721) for a token contract address.",
      parameters: {
        type: "object",
        properties: {
          contractaddress: {
            type: "string",
            description: "The token contract address to get info for",
          },
        },
        required: ["contractaddress"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_token_holders",
      description: "Get list of token holders and their balances for a specific token contract address.",
      parameters: {
        type: "object",
        properties: {
          contractaddress: {
            type: "string",
            description: "The token contract address to get holders for",
          },
          page: {
            type: "number",
            description: "Page number for pagination",
          },
          offset: {
            type: "number",
            description: "Number of holders per page",
          },
        },
        required: ["contractaddress"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_bridged_tokens",
      description: "Get list of bridged tokens (only available on chains with native bridge).",
      parameters: {
        type: "object",
        properties: {
          chainid: {
            type: "number",
            description: "Chain ID where the original token exists",
          },
          page: {
            type: "number",
            description: "Page number for pagination",
          },
          offset: {
            type: "number",
            description: "Number of tokens per page",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_transaction_info",
      description: "Get detailed information about a transaction including gas, value, logs, revert reason, and more.",
      parameters: {
        type: "object",
        properties: {
          txhash: {
            type: "string",
            description: "The transaction hash to get info for",
          },
          index: {
            type: "number",
            description: "Log index for pagination",
          },
        },
        required: ["txhash"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_transaction_receipt_status",
      description: "Get transaction receipt status (0 = failed, 1 = successful).",
      parameters: {
        type: "object",
        properties: {
          txhash: {
            type: "string",
            description: "The transaction hash to check status for",
          },
        },
        required: ["txhash"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_transaction_error_status",
      description: "Get error status and description for a transaction.",
      parameters: {
        type: "object",
        properties: {
          txhash: {
            type: "string",
            description: "The transaction hash to check for errors",
          },
        },
        required: ["txhash"],
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

export async function handleGetERC721TokenTransfers(params: {
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
  url.searchParams.append("action", "tokennfttx");

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

export async function handleGetERC1155TokenTransfers(params: {
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
  url.searchParams.append("action", "token1155tx");

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

export async function handleGetInternalTransactions(params: {
  txhash?: string;
  address?: string;
  sort?: string;
  startblock?: number;
  endblock?: number;
  page?: number;
  offset?: number;
}) {
  const url = new URL(`${API_BASE_URL}`);
  url.searchParams.append("module", "account");
  url.searchParams.append("action", "txlistinternal");

  if (params.txhash) url.searchParams.append("txhash", params.txhash);
  if (params.address) url.searchParams.append("address", params.address);
  if (params.sort) url.searchParams.append("sort", params.sort);
  if (params.startblock !== undefined) url.searchParams.append("startblock", params.startblock.toString());
  if (params.endblock !== undefined) url.searchParams.append("endblock", params.endblock.toString());
  if (params.page !== undefined) url.searchParams.append("page", params.page.toString());
  if (params.offset !== undefined) url.searchParams.append("offset", params.offset.toString());

  const response = await fetch(url.toString());
  const data = await response.json();
  return data;
}

export async function handleGetContractABI(params: { address: string }) {
  const url = new URL(`${API_BASE_URL}`);
  url.searchParams.append("module", "contract");
  url.searchParams.append("action", "getabi");
  url.searchParams.append("address", params.address);

  const response = await fetch(url.toString());
  const data = await response.json();
  return data;
}

export async function handleGetContractSourceCode(params: { address: string }) {
  const url = new URL(`${API_BASE_URL}`);
  url.searchParams.append("module", "contract");
  url.searchParams.append("action", "getsourcecode");
  url.searchParams.append("address", params.address);

  const response = await fetch(url.toString());
  const data = await response.json();
  return data;
}

export async function handleGetContractCreation(params: { contractaddresses: string }) {
  const url = new URL(`${API_BASE_URL}`);
  url.searchParams.append("module", "contract");
  url.searchParams.append("action", "getcontractcreation");
  url.searchParams.append("contractaddresses", params.contractaddresses);

  const response = await fetch(url.toString());
  const data = await response.json();
  return data;
}

export async function handleGetTokenInfo(params: { contractaddress: string }) {
  const url = new URL(`${API_BASE_URL}`);
  url.searchParams.append("module", "token");
  url.searchParams.append("action", "getToken");
  url.searchParams.append("contractaddress", params.contractaddress);

  const response = await fetch(url.toString());
  const data = await response.json();
  return data;
}

export async function handleGetTokenHolders(params: {
  contractaddress: string;
  page?: number;
  offset?: number;
}) {
  const url = new URL(`${API_BASE_URL}`);
  url.searchParams.append("module", "token");
  url.searchParams.append("action", "getTokenHolders");
  url.searchParams.append("contractaddress", params.contractaddress);

  if (params.page !== undefined) url.searchParams.append("page", params.page.toString());
  if (params.offset !== undefined) url.searchParams.append("offset", params.offset.toString());

  const response = await fetch(url.toString());
  const data = await response.json();
  return data;
}

export async function handleGetBridgedTokens(params: {
  chainid?: number;
  page?: number;
  offset?: number;
}) {
  const url = new URL(`${API_BASE_URL}`);
  url.searchParams.append("module", "token");
  url.searchParams.append("action", "bridgedTokenList");

  if (params.chainid !== undefined) url.searchParams.append("chainid", params.chainid.toString());
  if (params.page !== undefined) url.searchParams.append("page", params.page.toString());
  if (params.offset !== undefined) url.searchParams.append("offset", params.offset.toString());

  const response = await fetch(url.toString());
  const data = await response.json();
  return data;
}

export async function handleGetTransactionInfo(params: { txhash: string; index?: number }) {
  const url = new URL(`${API_BASE_URL}`);
  url.searchParams.append("module", "transaction");
  url.searchParams.append("action", "gettxinfo");
  url.searchParams.append("txhash", params.txhash);

  if (params.index !== undefined) url.searchParams.append("index", params.index.toString());

  const response = await fetch(url.toString());
  const data = await response.json();
  return data;
}

export async function handleGetTransactionReceiptStatus(params: { txhash: string }) {
  const url = new URL(`${API_BASE_URL}`);
  url.searchParams.append("module", "transaction");
  url.searchParams.append("action", "gettxreceiptstatus");
  url.searchParams.append("txhash", params.txhash);

  const response = await fetch(url.toString());
  const data = await response.json();
  return data;
}

export async function handleGetTransactionErrorStatus(params: { txhash: string }) {
  const url = new URL(`${API_BASE_URL}`);
  url.searchParams.append("module", "transaction");
  url.searchParams.append("action", "getstatus");
  url.searchParams.append("txhash", params.txhash);

  const response = await fetch(url.toString());
  const data = await response.json();
  return data;
}

