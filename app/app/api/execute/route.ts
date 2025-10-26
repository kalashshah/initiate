import { NextRequest, NextResponse } from "next/server";
import { blockscoutTools } from "./tools/blockscout-tools";
import {
  handleGetNativeTokenBalance,
  handleGetTransactionsByAddress,
  handleGetERC20TokenTransfers,
  handleGetTokenList,
  handleGetERC721TokenTransfers,
  handleGetERC1155TokenTransfers,
  handleGetInternalTransactions,
  handleGetContractABI,
  handleGetContractSourceCode,
  handleGetContractCreation,
} from "./tools/blockscout-tools";

// Types for the execute API
interface ExecuteRequest {
  messages: Array<{
    role: string;
    content: string;
  }>;
}

interface ExecuteResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

// Helper function to execute tool calls
async function executeToolCall(toolName: string, args: Record<string, unknown>) {
  switch (toolName) {
    case "get_native_token_balance":
      return await handleGetNativeTokenBalance(args as { address: string });
    case "get_transactions_by_address":
      return await handleGetTransactionsByAddress(args as {
        address: string;
        sort?: string;
        startblock?: number;
        endblock?: number;
        page?: number;
        offset?: number;
      });
    case "get_erc20_token_transfers":
      return await handleGetERC20TokenTransfers(args as {
        address?: string;
        contractaddress?: string;
        sort?: string;
        startblock?: number;
        endblock?: number;
        page?: number;
        offset?: number;
      });
    case "get_token_list":
      return await handleGetTokenList(args as { address: string });
    case "get_erc721_token_transfers":
      return await handleGetERC721TokenTransfers(args as {
        address?: string;
        contractaddress?: string;
        sort?: string;
        startblock?: number;
        endblock?: number;
        page?: number;
        offset?: number;
      });
    case "get_erc1155_token_transfers":
      return await handleGetERC1155TokenTransfers(args as {
        address?: string;
        contractaddress?: string;
        sort?: string;
        startblock?: number;
        endblock?: number;
        page?: number;
        offset?: number;
      });
    case "get_internal_transactions":
      return await handleGetInternalTransactions(args as {
        txhash?: string;
        address?: string;
        sort?: string;
        startblock?: number;
        endblock?: number;
        page?: number;
        offset?: number;
      });
    case "get_contract_abi":
      return await handleGetContractABI(args as { address: string });
    case "get_contract_source_code":
      return await handleGetContractSourceCode(args as { address: string });
    case "get_contract_creation":
      return await handleGetContractCreation(args as { contractaddresses: string });
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

// Static tools array
const tools = [...blockscoutTools];

export async function POST(request: NextRequest) {
  try {
    const body: ExecuteRequest = await request.json();

    // Validate request
    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing or invalid messages array",
        } as ExecuteResponse,
        { status: 400 }
      );
    }

    // Get environment variables
    const anannasApiKey = process.env.ANANNAS_API_KEY;
    const anannasModel = process.env.ANANNAS_MODEL || "gpt-4o";

    if (!anannasApiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "ANANNAS_API_KEY environment variable is not set",
        } as ExecuteResponse,
        { status: 500 }
      );
    }

    // Build messages array for API call
    const messages = [...body.messages];

    // Make API call to Anannas
    const response = await fetch("https://api.anannas.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${anannasApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: anannasModel,
        messages: messages,
        tools: tools,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anannas API error:", response.status, errorText);
      return NextResponse.json(
        {
          success: false,
          error: `API request failed with status ${response.status}`,
        } as ExecuteResponse,
        { status: response.status }
      );
    }

    const data = await response.json();

    // Check if the assistant returned tool calls
    const choice = data.choices?.[0];
    const toolCalls = choice?.message?.tool_calls;

    if (toolCalls && Array.isArray(toolCalls) && toolCalls.length > 0) {
      // Execute tool calls
      const toolResults = await Promise.all(
        toolCalls.map(async (toolCall: { id: string; function: { name: string; arguments: string } }) => {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            const result = await executeToolCall(toolCall.function.name, args);
            return {
              tool_call_id: toolCall.id,
              role: "tool" as const,
              name: toolCall.function.name,
              content: JSON.stringify(result),
            };
          } catch (error) {
            return {
              tool_call_id: toolCall.id,
              role: "tool" as const,
              name: toolCall.function.name,
              content: JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
            };
          }
        })
      );

      // Add assistant message and tool results to messages
      messages.push(choice.message);
      messages.push(...toolResults);

      // Make second API call with tool results
      const secondResponse = await fetch("https://api.anannas.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${anannasApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: anannasModel,
          messages: messages,
          tools: tools,
          stream: false,
        }),
      });

      if (!secondResponse.ok) {
        const errorText = await secondResponse.text();
        console.error("Anannas API error on second call:", secondResponse.status, errorText);
        return NextResponse.json(
          {
            success: false,
            error: `API request failed with status ${secondResponse.status}`,
          } as ExecuteResponse,
          { status: secondResponse.status }
        );
      }

      const finalData = await secondResponse.json();

      return NextResponse.json({
        success: true,
        data: finalData,
      } as ExecuteResponse);
    }

    return NextResponse.json({
      success: true,
      data: data,
    } as ExecuteResponse);
  } catch (error) {
    console.error("Execute API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      } as ExecuteResponse,
      { status: 500 }
    );
  }
}
