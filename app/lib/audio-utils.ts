/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  blockscoutTools,
  handleGetNativeTokenBalance,
  handleGetTransactionsByAddress,
  handleGetERC20TokenTransfers,
  handleGetTokenList,
} from "../app/api/execute/tools/blockscout-tools";

// Types for transcription
export interface TranscriptionRequest {
  audio: string;
  format: string;
}

export interface TranscriptionResponse {
  success: boolean;
  text?: string;
  confidence?: number;
  error?: string;
}

// Types for execute API
export interface ExecuteRequest {
  messages: Array<{
    role: string;
    content: string;
  }>;
}

export interface ExecuteResponse {
  success: boolean;
  data?: any;
  error?: string;
  toolResults?: any[];
  toolCalls?: any[];
  finalContent?: string;
}

// Helper function to check if audio data has valid headers
function checkAudioHeaders(buffer: Buffer): boolean {
  if (buffer.length < 8) return false;

  const header8 = buffer.subarray(0, 8);
  const header4 = buffer.subarray(0, 4);

  // Check for M4A/MP4 (ftyp box)
  if (
    header8[4] === 0x66 &&
    header8[5] === 0x74 &&
    header8[6] === 0x79 &&
    header8[7] === 0x70
  ) {
    return true;
  }

  // Check for MP3
  if (header4[0] === 0xff && header4[1] === 0xfb) return true;
  if (header4[0] === 0x49 && header4[1] === 0x44 && header4[2] === 0x33)
    return true;

  // Check for WAV
  if (
    header4[0] === 0x52 &&
    header4[1] === 0x49 &&
    header4[2] === 0x46 &&
    header4[3] === 0x46
  )
    return true;

  // Check for OGG
  if (
    header4[0] === 0x4f &&
    header4[1] === 0x67 &&
    header4[2] === 0x67 &&
    header4[3] === 0x53
  )
    return true;

  // Check for FLAC
  if (
    header4[0] === 0x66 &&
    header4[1] === 0x4c &&
    header4[2] === 0x61 &&
    header4[3] === 0x43
  )
    return true;

  return false;
}

/**
 * Transcribes audio data using Groq API
 */
export async function transcribeAudio(
  request: TranscriptionRequest
): Promise<TranscriptionResponse> {
  try {
    console.log(
      "🎤 Transcription function called at:",
      new Date().toISOString()
    );

    // Validate request
    if (!request.audio || !request.format) {
      console.log("❌ Missing required fields:", {
        audio: !!request.audio,
        format: !!request.format,
      });
      return {
        success: false,
        error: "Missing required fields: audio and format",
      };
    }

    console.log("📝 Request body:", {
      audioLength: request.audio.length,
      format: request.format,
      audioPreview: request.audio.substring(0, 50) + "...",
    });

    // Get GROQ_API_KEY from environment
    const groqApiKey = process.env.GROQ_API_KEY;

    if (!groqApiKey) {
      console.log("❌ GROQ_API_KEY not set");
      return {
        success: false,
        error: "GROQ_API_KEY environment variable is not set",
      };
    }

    console.log("✅ GROQ_API_KEY found, length:", groqApiKey.length);

    // Convert base64 audio to buffer
    const audioBuffer = Buffer.from(request.audio, "base64");
    console.log("🔊 Audio buffer size:", audioBuffer.length, "bytes");

    // Validate audio data
    if (audioBuffer.length === 0) {
      console.error("❌ Audio buffer is empty");
      return {
        success: false,
        error: "Audio data is empty",
      };
    }

    if (audioBuffer.length < 1000) {
      console.error(
        "❌ Audio buffer is too small:",
        audioBuffer.length,
        "bytes"
      );
      return {
        success: false,
        error: `Audio data is too small (${audioBuffer.length} bytes). Minimum expected: 1000 bytes`,
      };
    }

    // Check if the data looks like valid audio by examining headers
    const hasValidAudioHeaders = checkAudioHeaders(audioBuffer);
    if (!hasValidAudioHeaders) {
      console.error("❌ Audio data doesn't have valid audio headers");
      console.log(
        "📊 First 32 bytes:",
        Array.from(audioBuffer.subarray(0, 32))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(" ")
      );
    }

    // Try different approaches to handle the audio format issue
    const formatsToTry = [
      { type: "audio/mp4", name: "audio.m4a" },
      { type: "audio/mpeg", name: "audio.mp3" },
      { type: "audio/wav", name: "audio.wav" },
      { type: "audio/m4a", name: "audio.m4a" },
    ];

    let apiResponse;
    let lastError;

    for (const format of formatsToTry) {
      try {
        console.log(`🔄 Trying format: ${format.type} (${format.name})`);

        // Create new FormData for this attempt
        const testFormData = new FormData();
        const testBlob = new Blob([audioBuffer], { type: format.type });
        testFormData.append("file", testBlob, format.name);
        testFormData.append("model", "whisper-large-v3-turbo");
        testFormData.append("response_format", "json");

        apiResponse = await fetch(
          "https://api.groq.com/openai/v1/audio/transcriptions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${groqApiKey}`,
            },
            body: testFormData,
          }
        );

        if (apiResponse.ok) {
          console.log(`✅ Success with format: ${format.type}`);
          break;
        } else {
          const errorText = await apiResponse.text();
          console.log(
            `❌ Failed with ${format.type}: ${apiResponse.status} - ${errorText}`
          );
          lastError = errorText;
        }
      } catch (error) {
        console.log(`❌ Error with ${format.type}:`, error);
        lastError = error;
      }
    }

    if (!apiResponse || !apiResponse.ok) {
      console.error("❌ All format attempts failed");
      console.error("❌ Last error:", lastError);
      throw new Error(
        `Groq API error: All format attempts failed. Last error: ${lastError}`
      );
    }

    const transcription = await apiResponse.json();
    console.log("✅ Groq transcription successful:", transcription.text);

    return {
      success: true,
      text: transcription.text,
      confidence: 0.95, // Groq doesn't provide confidence scores, using a high default
    };
  } catch (error) {
    console.error("❌ Transcription error:", error);
    console.error("❌ Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      success: false,
      error: `Failed to transcribe audio: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
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
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

/**
 * Generates a response using the execute API with tool calling support
 */
export async function generateResponse(
  messages: ExecuteRequest["messages"]
): Promise<ExecuteResponse> {
  try {
    console.log("🤖 Generate function called with messages:", messages.length);

    // Get environment variables
    const anannasApiKey = process.env.ANANNAS_API_KEY;
    const anannasModel = process.env.ANANNAS_MODEL || "gpt-4o";

    if (!anannasApiKey) {
      console.log("❌ ANANNAS_API_KEY not set");
      return {
        success: false,
        error: "ANANNAS_API_KEY environment variable is not set",
      };
    }

    // Use blockscout tools
    const tools = [...blockscoutTools];

    // Build messages array for API call - response is for watchOS so keep it concise and simple
    const messagesArray = [{role: "system", content: "You are a helpful blockchain assistant for Apple Watch. IMPORTANT: Keep responses SHORT (under 2 sentences) and SIMPLE - NO markdown formatting, NO code blocks, NO symbols. Just plain text. Default address is 0xC039654Bf76d6aF77A851c26167FBf07405C59BA"}, ...messages];

    // Make first API call to Anannas
    const response = await fetch("https://api.anannas.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${anannasApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: anannasModel,
        messages: messagesArray,
        tools: tools,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anannas API error:", response.status, errorText);
      return {
        success: false,
        error: `API request failed with status ${response.status}`,
      };
    }

    const data = await response.json();

    // Check if the assistant returned tool calls
    const choice = data.choices?.[0];
    const toolCalls = choice?.message?.tool_calls;

    let toolResults: any[] = [];

    if (toolCalls && Array.isArray(toolCalls) && toolCalls.length > 0) {
      console.log(`🔧 Executing ${toolCalls.length} tool call(s)`, toolCalls.map(toolCall => toolCall.function.name + " " + toolCall.function.arguments));
      
      // Execute tool calls
      toolResults = await Promise.all(
        toolCalls.map(async (toolCall: { id: string; function: { name: string; arguments: string } }) => {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            const result = await executeToolCall(toolCall.function.name, args);
            console.log("🔧 Tool result:", result);
            return {
              tool_call_id: toolCall.id,
              role: "tool" as const,
              name: toolCall.function.name,
              content: JSON.stringify(result),
            };
          } catch (error) {
            console.error("❌ Tool execution error:", error);
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
      messagesArray.push(choice.message);
      messagesArray.push(...toolResults);

      console.log("🔄 Making second API call with tool results");

      // Make second API call with tool results
      const secondResponse = await fetch("https://api.anannas.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${anannasApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: anannasModel,
          messages: messagesArray,
          tools: tools,
          stream: false,
        }),
      });

      if (!secondResponse.ok) {
        const errorText = await secondResponse.text();
        console.error("Anannas API error on second call:", secondResponse.status, errorText);
        return {
          success: false,
          error: `API request failed with status ${secondResponse.status}`,
        };
      }

      const finalData = await secondResponse.json();
      console.log("✅ Execute response successful with tools");

      const finalChoice = finalData.choices?.[0];
      const finalContent = finalChoice?.message?.content || "";

      return {
        success: true,
        data: finalData,
        toolResults: toolResults,
        toolCalls: toolCalls,
        finalContent: finalContent,
      };
    }

    console.log("✅ Execute response successful without tools");

    const finalChoice = data.choices?.[0];
    const finalContent = finalChoice?.message?.content || "";

    return {
      success: true,
      data: data,
      toolResults: [],
      toolCalls: [],
      finalContent: finalContent,
    };
  } catch (error) {
    console.error("❌ Execute error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    };
  }
}
