"use client";

import { useState } from "react";

interface TranscriptionResponse {
  success: boolean;
  text?: string;
  confidence?: number;
  error?: string;
}

interface ProcessResponse {
  success: boolean;
  data?: {
    text?: string;
    number?: number;
    boolean?: boolean;
    array?: string[];
    object?: { [key: string]: string };
    timestamp?: string;
    type?: string;
  };
  message?: string;
  error?: string;
}

export default function Home() {
  const [transcriptionResult, setTranscriptionResult] =
    useState<TranscriptionResponse | null>(null);
  const [processResult, setProcessResult] = useState<ProcessResponse | null>(
    null
  );
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputText, setInputText] = useState("");

  const testTranscription = async () => {
    setIsTranscribing(true);
    setTranscriptionResult(null);

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audio: "dGVzdC1hdWRpby1kYXRh", // base64 encoded "test-audio-data"
          format: "json",
        }),
      });

      const result = await response.json();
      setTranscriptionResult(result);
    } catch (error) {
      setTranscriptionResult({
        success: false,
        error: "Failed to connect to API",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const testProcess = async () => {
    if (!inputText.trim()) return;

    setIsProcessing(true);
    setProcessResult(null);

    try {
      const response = await fetch("/api/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: inputText,
        }),
      });

      const result = await response.json();
      setProcessResult(result);
    } catch (error) {
      setProcessResult({
        success: false,
        error: "Failed to connect to API",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Initiate API Tester
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Test your transcription and text processing APIs
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Transcription API */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              🎤 Transcription API
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Test the transcription endpoint that returns random transcription
              strings.
            </p>

            <button
              onClick={testTranscription}
              disabled={isTranscribing}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {isTranscribing ? "Transcribing..." : "Test Transcription"}
            </button>

            {transcriptionResult && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Result:
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Success:</span>
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        transcriptionResult.success
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                    >
                      {transcriptionResult.success ? "✓" : "✗"}
                    </span>
                  </div>

                  {transcriptionResult.text && (
                    <div>
                      <span className="font-medium">Text:</span>
                      <p className="text-gray-700 dark:text-gray-300 mt-1">
                        "{transcriptionResult.text}"
                      </p>
                    </div>
                  )}

                  {transcriptionResult.confidence && (
                    <div>
                      <span className="font-medium">Confidence:</span>
                      <span className="ml-2 text-gray-700 dark:text-gray-300">
                        {(transcriptionResult.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}

                  {transcriptionResult.error && (
                    <div>
                      <span className="font-medium text-red-600 dark:text-red-400">
                        Error:
                      </span>
                      <p className="text-red-600 dark:text-red-400 mt-1">
                        {transcriptionResult.error}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Process API */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              ⚙️ Process API
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Test the text processing endpoint with different input types.
            </p>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="input-text"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Input Text:
                </label>
                <input
                  id="input-text"
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Try: 'weather', 'time', 'calculate', 'list', or any text..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <button
                onClick={testProcess}
                disabled={isProcessing || !inputText.trim()}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {isProcessing ? "Processing..." : "Test Process"}
              </button>
            </div>

            {processResult && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Result:
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Success:</span>
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        processResult.success
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                    >
                      {processResult.success ? "✓" : "✗"}
                    </span>
                  </div>

                  {processResult.message && (
                    <div>
                      <span className="font-medium">Message:</span>
                      <p className="text-gray-700 dark:text-gray-300 mt-1">
                        {processResult.message}
                      </p>
                    </div>
                  )}

                  {processResult.data && (
                    <div>
                      <span className="font-medium">Data:</span>
                      <div className="mt-2 p-3 bg-white dark:bg-gray-600 rounded border">
                        <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {JSON.stringify(processResult.data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {processResult.error && (
                    <div>
                      <span className="font-medium text-red-600 dark:text-red-400">
                        Error:
                      </span>
                      <p className="text-red-600 dark:text-red-400 mt-1">
                        {processResult.error}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Test Examples */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            🚀 Quick Test Examples
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              "What's the weather like?",
              "What time is it?",
              "Calculate 2 + 2",
              "Create a shopping list",
            ].map((example, index) => (
              <button
                key={index}
                onClick={() => setInputText(example)}
                className="p-3 text-left bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors text-sm"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
