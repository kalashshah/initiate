//
//  APIService.swift
//  initiate Watch App
//
//  Created by Kalash Shah on 08/10/25.
//

import Foundation

// MARK: - API Response Models
struct ExecuteAPIResponse: Codable {
    let success: Bool
    let data: ExecuteData?
    let error: String?
}

struct ExecuteData: Codable {
    let id: String?
    let object: String?
    let created: Int?
    let model: String?
    let choices: [Choice]?
    let usage: Usage?
}

struct Choice: Codable {
    let index: Int?
    let message: Message?
    let finish_reason: String?
}

struct Message: Codable {
    let role: String?
    let content: String?
    let tool_calls: [ToolCall]?
}

struct ToolCall: Codable {
    let id: String?
    let type: String?
    let function: FunctionCall?
}

struct FunctionCall: Codable {
    let name: String?
    let arguments: String?
}

struct Usage: Codable {
    let prompt_tokens: Int?
    let completion_tokens: Int?
    let total_tokens: Int?
}

// Blockscout Response Models
struct BlockscoutResponse: Codable {
    let message: String
    let result: BlockscoutResult?
    let status: String
}

enum BlockscoutResult: Codable {
    case string(String)
    case array([TransactionResult])
    case unknown
    
    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        
        if let stringValue = try? container.decode(String.self) {
            self = .string(stringValue)
        } else if let arrayValue = try? container.decode([TransactionResult].self) {
            self = .array(arrayValue)
        } else {
            self = .unknown
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let value):
            try container.encode(value)
        case .array(let value):
            try container.encode(value)
        case .unknown:
            try container.encodeNil()
        }
    }
}

struct TransactionResult: Codable {
    let blockHash: String?
    let blockNumber: String?
    let from: String?
    let to: String?
    let value: String?
    let gas: String?
    let gasPrice: String?
    let gasUsed: String?
    let hash: String?
    let timeStamp: String?
    let input: String?
    let contractAddress: String?
    let confirmations: String?
    let methodId: String?
    let functionName: String?
    let tokenName: String?
    let tokenSymbol: String?
    let tokenDecimal: String?
    let tokenValue: String?
}

// API Response wrapper
struct APIResponse: Codable, Equatable {
    let success: Bool
    let data: APIResponseData?
    let message: String?
    let error: String?
    let toolCalls: [ToolCall]?  // Changed from var to let for immutability
    let toolResults: [ToolResult]?  // Changed from var to let for immutability
    
    init(success: Bool, data: APIResponseData?, message: String?, error: String?, toolCalls: [ToolCall]? = nil, toolResults: [ToolResult]? = nil) {
        self.success = success
        self.data = data
        self.message = message
        self.error = error
        self.toolCalls = toolCalls
        self.toolResults = toolResults
    }
    
    // Custom Equatable implementation for stable rendering
    static func == (lhs: APIResponse, rhs: APIResponse) -> Bool {
        lhs.success == rhs.success &&
        lhs.message == rhs.message &&
        lhs.error == rhs.error &&
        lhs.toolCalls?.count == rhs.toolCalls?.count &&
        lhs.toolResults?.count == rhs.toolResults?.count
    }
}

struct APIResponseData: Codable {
    let text: String?
    let number: Double?
    let boolean: Bool?
    let array: [String]?
    let object: [String: String]?
    let timestamp: String?
    let type: String?
    let blockscoutData: BlockscoutData?
}

struct BlockscoutData: Codable {
    let toolName: String?
    let result: [String: String]?
    let rawData: String?
}

struct TranscriptionResponse: Codable {
    let success: Bool
    let transcription: TranscriptionData?
    let generation: ExecuteData?
    let toolResults: [ToolResult]?
    let toolCalls: [ToolCall]?
    let finalContent: String?
    let error: String?
}

struct TranscriptionData: Codable {
    let text: String?
    let confidence: Double?
}

struct ToolResult: Codable {
    let tool_call_id: String?
    let role: String?
    let name: String?
    let content: String?
}

// MARK: - API Service
class APIService: ObservableObject {
    @Published var isLoading = false
    @Published var lastResponse: APIResponse?
    @Published var errorMessage = ""
    
    private let baseURL = "http://localhost:3000" // Local Next.js app
    
    func makeRequest(with text: String) {
        guard !text.isEmpty else {
            errorMessage = "No text provided"
            return
        }
        
        isLoading = true
        errorMessage = ""
        
        // Make API request to execute endpoint
        makeExecuteAPIRequest(with: text)
    }
    
    func transcribeAudio(base64Audio: String) {
        isLoading = true
        errorMessage = ""
        
        // Make real transcription API call to Next.js server
        guard let url = URL(string: "\(baseURL)/api/transcribe") else {
            errorMessage = "Invalid URL"
            isLoading = false
            // Notify VoiceInputManager about the failure
            NotificationCenter.default.post(
                name: NSNotification.Name("TranscriptionFailed"),
                object: nil,
                userInfo: ["error": "Invalid URL"]
            )
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let requestBody = ["audio": base64Audio, "format": "json"]
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)
        } catch {
            errorMessage = "Failed to encode request body"
            isLoading = false
            // Notify VoiceInputManager about the failure
            NotificationCenter.default.post(
                name: NSNotification.Name("TranscriptionFailed"),
                object: nil,
                userInfo: ["error": "Failed to encode request body"]
            )
            return
        }
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                self.isLoading = false
                
                if let error = error {
                    self.errorMessage = "Transcription error: \(error.localizedDescription)"
                    // Notify VoiceInputManager about the failure
                    NotificationCenter.default.post(
                        name: NSNotification.Name("TranscriptionFailed"),
                        object: nil,
                        userInfo: ["error": error.localizedDescription]
                    )
                    return
                }
                
                guard let data = data else {
                    self.errorMessage = "No data received"
                    // Notify VoiceInputManager about the failure
                    NotificationCenter.default.post(
                        name: NSNotification.Name("TranscriptionFailed"),
                        object: nil,
                        userInfo: ["error": "No data received"]
                    )
                    return
                }
                
                do {
                    let transcriptionResponse = try JSONDecoder().decode(TranscriptionResponse.self, from: data)
                    if transcriptionResponse.success {
                        // Create API response with tool calls and final content
                        let responseData = APIResponseData(
                            text: transcriptionResponse.finalContent ?? transcriptionResponse.transcription?.text,
                            number: nil,
                            boolean: nil,
                            array: nil,
                            object: nil,
                            timestamp: nil,
                            type: self.detectToolCallType(from: transcriptionResponse.toolCalls),
                            blockscoutData: nil
                        )
                        
                        // Store full transcription response with tool calls and results
                        self.lastResponse = APIResponse(
                            success: true,
                            data: responseData,
                            message: transcriptionResponse.finalContent,
                            error: nil,
                            toolCalls: transcriptionResponse.toolCalls,
                            toolResults: transcriptionResponse.toolResults
                        )
                        
                        // Notify VoiceInputManager about successful transcription
                        NotificationCenter.default.post(
                            name: NSNotification.Name("TranscriptionComplete"),
                            object: nil,
                            userInfo: ["text": transcriptionResponse.finalContent ?? transcriptionResponse.transcription?.text ?? ""]
                        )
                        
                    } else {
                        self.errorMessage = transcriptionResponse.error ?? "Transcription failed"
                        // Notify VoiceInputManager about the failure
                        NotificationCenter.default.post(
                            name: NSNotification.Name("TranscriptionFailed"),
                            object: nil,
                            userInfo: ["error": transcriptionResponse.error ?? "Transcription failed"]
                        )
                    }
                } catch {
                    self.errorMessage = "Failed to decode transcription response: \(error.localizedDescription)"
                    // Notify VoiceInputManager about the failure
                    NotificationCenter.default.post(
                        name: NSNotification.Name("TranscriptionFailed"),
                        object: nil,
                        userInfo: ["error": "Failed to decode transcription response: \(error.localizedDescription)"]
                    )
                }
            }
        }.resume()
        
        // Old simulation code (commented out):
        /*
        guard let url = URL(string: "\(baseURL)/transcribe") else {
            errorMessage = "Invalid URL"
            isLoading = false
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let requestBody = ["audio": base64Audio, "format": "json"]
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)
        } catch {
            errorMessage = "Failed to encode request body"
            isLoading = false
            // Notify VoiceInputManager about the failure
            NotificationCenter.default.post(
                name: NSNotification.Name("TranscriptionFailed"),
                object: nil,
                userInfo: ["error": "Failed to encode request body"]
            )
            return
        }
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                self.isLoading = false
                
                if let error = error {
                    self.errorMessage = "Transcription error: \(error.localizedDescription)"
                    return
                }
                
                guard let data = data else {
                    self.errorMessage = "No data received"
                    return
                }
                
                do {
                    let transcriptionResponse = try JSONDecoder().decode(TranscriptionResponse.self, from: data)
                    // Handle transcription response
                } catch {
                    self.errorMessage = "Failed to decode transcription response: \(error.localizedDescription)"
                }
            }
        }.resume()
        */
    }
    
    private func simulateTranscriptionResponse(base64Audio: String) {
        isLoading = false
        
        // Simulate transcription result
        let simulatedText = "Hello, this is a simulated transcription of your voice input"
        
        // Create a callback to notify VoiceInputManager
        // In a real implementation, you would use a completion handler or delegate pattern
        NotificationCenter.default.post(
            name: NSNotification.Name("TranscriptionComplete"),
            object: nil,
            userInfo: ["text": simulatedText]
        )
    }
    
    private func simulateAPIResponse(for text: String) {
        isLoading = false
        
        // Simulate different response types based on input
        let response: APIResponse
        
        if text.lowercased().contains("weather") {
            response = APIResponse(
                success: true,
                data: APIResponseData(
                    text: "It's sunny and 72°F today",
                    number: 72.0,
                    boolean: nil,
                    array: ["sunny", "warm", "clear skies"],
                    object: ["temperature": "72°F", "condition": "sunny", "humidity": "45%"],
                    timestamp: ISO8601DateFormatter().string(from: Date()),
                    type: "weather",
                    blockscoutData: nil
                ),
                message: "Weather information retrieved",
                error: nil
            )
        } else if text.lowercased().contains("time") {
            response = APIResponse(
                success: true,
                data: APIResponseData(
                    text: "Current time is \(DateFormatter.localizedString(from: Date(), dateStyle: .none, timeStyle: .medium))",
                    number: nil,
                    boolean: nil,
                    array: nil,
                    object: ["timezone": "UTC", "format": "12-hour"],
                    timestamp: ISO8601DateFormatter().string(from: Date()),
                    type: "time",
                    blockscoutData: nil
                ),
                message: "Time information retrieved",
                error: nil
            )
        } else if text.lowercased().contains("calculate") || text.lowercased().contains("math") {
            response = APIResponse(
                success: true,
                data: APIResponseData(
                    text: "Calculation result: 42",
                    number: 42.0,
                    boolean: nil,
                    array: nil,
                    object: ["operation": "calculation", "result": "42"],
                    timestamp: ISO8601DateFormatter().string(from: Date()),
                    type: "calculation",
                    blockscoutData: nil
                ),
                message: "Calculation completed",
                error: nil
            )
        } else if text.lowercased().contains("list") {
            response = APIResponse(
                success: true,
                data: APIResponseData(
                    text: "Here's your list",
                    number: nil,
                    boolean: nil,
                    array: ["Item 1", "Item 2", "Item 3", "Item 4"],
                    object: nil,
                    timestamp: ISO8601DateFormatter().string(from: Date()),
                    type: "list",
                    blockscoutData: nil
                ),
                message: "List generated",
                error: nil
            )
        } else {
            response = APIResponse(
                success: true,
                data: APIResponseData(
                    text: "You said: \(text)",
                    number: nil,
                    boolean: nil,
                    array: nil,
                    object: ["input": text, "processed": "true"],
                    timestamp: ISO8601DateFormatter().string(from: Date()),
                    type: "text",
                    blockscoutData: nil
                ),
                message: "Text processed successfully",
                error: nil
            )
        }
        
        lastResponse = response
    }
    
    // Real API implementation for Next.js execute endpoint
    private func makeExecuteAPIRequest(with text: String) {
        guard let url = URL(string: "\(baseURL)/api/execute") else {
            errorMessage = "Invalid URL"
            isLoading = false
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let requestBody: [String: Any] = [
            "messages": [
                ["role": "user", "content": text]
            ]
        ]
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)
        } catch {
            errorMessage = "Failed to encode request body"
            isLoading = false
            return
        }
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                self.isLoading = false
                
                if let error = error {
                    self.errorMessage = "Network error: \(error.localizedDescription)"
                    return
                }
                
                guard let data = data else {
                    self.errorMessage = "No data received"
                    return
                }
                
                do {
                    let executeResponse = try JSONDecoder().decode(ExecuteAPIResponse.self, from: data)
                    self.lastResponse = self.parseExecuteResponse(executeResponse)
                } catch {
                    print("Decode error: \(error)")
                    self.errorMessage = "Failed to decode response: \(error.localizedDescription)"
                }
            }
        }.resume()
    }
    
    private func parseExecuteResponse(_ response: ExecuteAPIResponse) -> APIResponse {
        // Extract the final response content from the execute response
        guard let message = response.data?.choices?.first?.message?.content else {
            return APIResponse(
                success: response.success,
                data: nil,
                message: nil,
                error: response.error
            )
        }
        
        // Detect Blockscout result type from the message
        let resultType = detectResultType(from: message)
        
        let responseData = APIResponseData(
            text: message,
            number: nil,
            boolean: nil,
            array: nil,
            object: nil,
            timestamp: nil,
            type: resultType,
            blockscoutData: nil
        )
        
        return APIResponse(
            success: response.success,
            data: responseData,
            message: message,
            error: response.error
        )
    }
    
    private func detectResultType(from message: String) -> String {
        if message.contains("balance") {
            return "blockscout_balance"
        } else if message.contains("transaction") {
            return "blockscout_transaction"
        } else if message.contains("token") {
            return "blockscout_token"
        } else if message.contains("ERC-20") {
            return "blockscout_erc20"
        } else if message.contains("ERC-721") || message.contains("NFT") {
            return "blockscout_erc721"
        } else {
            return "blockscout_general"
        }
    }
    
    private func detectToolCallType(from toolCalls: [ToolCall]?) -> String {
        guard let toolCalls = toolCalls, !toolCalls.isEmpty else {
            return "text"
        }
        
        let toolName = toolCalls.first?.function?.name
        
        if toolName == "get_native_token_balance" {
            return "blockscout_balance"
        } else if toolName == "get_transactions_by_address" {
            return "blockscout_transaction"
        } else if toolName == "get_token_list" {
            return "blockscout_token_list"
        } else if toolName == "get_erc20_token_transfers" {
            return "blockscout_erc20"
        } else {
            return "blockscout_general"
        }
    }
}
