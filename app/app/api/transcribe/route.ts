import { NextRequest, NextResponse } from "next/server";
import {
  transcribeAudio,
  generateResponse,
  TranscriptionRequest,
  TranscriptionResponse,
} from "@/lib/audio-utils";

export async function POST(request: NextRequest) {
  try {
    const body: TranscriptionRequest = await request.json();

    // Validate request
    if (!body.audio || !body.format) {
      console.log("❌ Missing required fields:", {
        audio: !!body.audio,
        format: !!body.format,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: audio and format",
        } as TranscriptionResponse,
        { status: 400 }
      );
    }

    // Step 1: Transcribe the audio
    const transcriptionResult = await transcribeAudio(body);

    if (!transcriptionResult.success) {
      return NextResponse.json(transcriptionResult, { status: 500 });
    }

    // Step 2: Generate response using the transcribed text
    const messages = [
      {
        role: "user",
        content: transcriptionResult.text || "",
      },
    ];

    const generateResult = await generateResponse(messages);

    if (!generateResult.success) {
      console.log("❌ Generation failed:", generateResult.error);
      return NextResponse.json(
        {
          success: false,
          error: `Generation failed: ${generateResult.error}`,
        } as TranscriptionResponse,
        { status: 500 }
      );
    }

    console.log("✅ Generation successful", JSON.stringify(generateResult.data, null, 2));

    // Return both transcription and generation results
    const response = {
      success: true,
      transcription: {
        text: transcriptionResult.text,
        confidence: transcriptionResult.confidence,
      },
      generation: generateResult.data,
      toolResults: generateResult.toolResults || [],
      toolCalls: generateResult.toolCalls || [],
      finalContent: generateResult.finalContent || "",
    };

    console.log("📤 Sending combined response", JSON.stringify(response, null, 2));
    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ Transcription API error:", error);
    console.error("❌ Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        success: false,
        error: `Failed to process request: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      } as TranscriptionResponse,
      { status: 500 }
    );
  }
}
