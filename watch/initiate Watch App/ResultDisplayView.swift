//
//  ResultDisplayView.swift
//  initiate Watch App
//
//  Created by Kalash Shah on 08/10/25.
//

import SwiftUI

struct ResultDisplayView: View {
    let response: APIResponse?
    @State private var showingDetails = false
    
    var body: some View {
        if let response = response {
            ScrollView(.vertical, showsIndicators: true) {
                VStack(alignment: .leading, spacing: 12) {
                    // Success indicator
                    HStack {
                        Image(systemName: response.success ? "checkmark.circle.fill" : "xmark.circle.fill")
                            .foregroundColor(response.success ? .green : .red)
                        Text(response.success ? "Success" : "Error")
                            .font(.caption)
                            .fontWeight(.medium)
                        Spacer()
                    }
                    .padding(.horizontal)
                    
                    // Display custom card based on tool calls
                    if let toolCalls = response.toolCalls, !toolCalls.isEmpty {
                        if let toolName = toolCalls.first?.function?.name {
                            switch toolName {
                            case "get_native_token_balance":
                                TokenBalanceCard(toolResults: response.toolResults)
                                    .padding(.horizontal)
                                    .id("balance_card") // Fixed identifier
                            case "get_token_list":
                                TokenListCard(toolResults: response.toolResults)
                                    .padding(.horizontal)
                                    .id("token_list_card")
                            case "get_transactions_by_address":
                                TransactionsCard(toolResults: response.toolResults)
                                    .padding(.horizontal)
                                    .id("transactions_card")
                            case "get_erc20_token_transfers":
                                ERC20TransfersCard(toolResults: response.toolResults)
                                    .padding(.horizontal)
                                    .id("erc20_card")
                            default:
                                GeneralCard(toolResults: response.toolResults)
                                    .padding(.horizontal)
                                    .id("general_card")
                            }
                        }
                    }
                    
                    // Final content - markdown display
                    if let finalContent = response.message, !finalContent.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Response:")
                                .font(.caption)
                                .fontWeight(.semibold)
                                .foregroundColor(.secondary)
                            
                            Text(parseMarkdown(finalContent))
                                .font(.body)
                                .foregroundColor(.primary)
                        }
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.gray.opacity(0.1))
                        .cornerRadius(12)
                        .padding(.horizontal)
                        .id("final_content") // Fixed identifier
                    }
                    
                    // Error message
                    if let error = response.error {
                        Text("Error: \(error)")
                            .font(.caption)
                            .foregroundColor(.red)
                            .padding(.top, 4)
                            .padding(.horizontal)
                            .id("error_message")
                    }
                }
                .padding(.vertical)
                .padding(.bottom, 50) // Extra bottom padding
            }
        } else {
            Text("No results yet")
                .font(.caption)
                .foregroundColor(.secondary)
                .padding()
        }
    }
    
    private func parseMarkdown(_ text: String) -> String {
        // Simple markdown parser for watchOS
        var result = text
        
        // Remove markdown headers
        result = result.replacingOccurrences(of: #"^#{1,6}\s+"#, with: "", options: .regularExpression)
        
        // Convert bold markers to simple text
        result = result.replacingOccurrences(of: #"\*\*(.*?)\*\*"#, with: "$1", options: .regularExpression)
        result = result.replacingOccurrences(of: #"__(.*?)__"#, with: "$1", options: .regularExpression)
        
        // Convert italic markers
        result = result.replacingOccurrences(of: #"\*(.*?)\*"#, with: "$1", options: .regularExpression)
        result = result.replacingOccurrences(of: #"_(.*?)_"#, with: "$1", options: .regularExpression)
        
        // Remove code blocks
        result = result.replacingOccurrences(of: #"```[\s\S]*?```"#, with: "", options: .regularExpression)
        result = result.replacingOccurrences(of: #"`(.*?)`"#, with: "$1", options: .regularExpression)
        
        return result.trimmingCharacters(in: .whitespacesAndNewlines)
    }
}

// MARK: - Custom Tool Result Cards

struct TokenBalanceCard: View {
    let toolResults: [ToolResult]?
    
    var balanceText: String {
        guard let result = toolResults?.first,
              let content = result.content else {
            return "Loading..."
        }
        
        // Content is a JSON-encoded string (e.g., "\"0.000270384992491\"")
        // First, decode the JSON string to get the actual value
        if let data = content.data(using: .utf8),
           let decodedBalance = try? JSONDecoder().decode(String.self, from: data) {
            // Convert to a nice readable format
            if let doubleValue = Double(decodedBalance) {
                return "\(String(format: "%.5f", doubleValue)) ETH"
            } else {
                return "\(decodedBalance) ETH"
            }
        }
        
        // If parsing fails, show raw content (for debugging)
        return content
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "bitcoinsign.circle.fill")
                    .foregroundColor(.orange)
                    .font(.title3)
                Text("Token Balance")
                    .font(.headline)
                Spacer()
            }
            
            Text(balanceText)
                .font(.title2)
                .fontWeight(.semibold)
                .foregroundColor(.orange)
                .lineLimit(3)
                .frame(minHeight: 30) // Ensure text takes up space
        }
        .padding()
        .frame(minHeight: 80) // Ensure card has minimum height
        .background(
            LinearGradient(
                colors: [Color.orange.opacity(0.15), Color.orange.opacity(0.05)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(12)
    }
}

struct TokenListCard: View {
    let toolResults: [ToolResult]?
    
    struct TokenItem: Codable {
        let name: String?
        let formattedBalance: String?
        let image: String?
    }
    
    struct TokenListResponse: Codable {
        let message: String?
        let result: [TokenItem]?
        let status: String?
    }
    
    private func formatBalance(_ balance: String) -> String {
        // Convert to double to check value
        if let doubleValue = Double(balance) {
            if doubleValue < 0.001 {
                return "<0.001"
            }
            
            // Format to show up to 4 digits
            let formatter = NumberFormatter()
            formatter.numberStyle = .decimal
            formatter.maximumFractionDigits = 4
            formatter.minimumFractionDigits = 0
            
            if let formatted = formatter.string(from: NSNumber(value: doubleValue)) {
                return formatted
            }
        }
        return balance
    }
    
    var tokens: [TokenItem] {
        guard let result = toolResults?.first,
              let content = result.content else {
            return []
        }
        
        // Content is a JSON string like: {"message":"OK","result":[...],"status":"1"}
        // Need to decode it as an object and extract the result array
        
        if let data = content.data(using: .utf8),
           let response = try? JSONDecoder().decode(TokenListResponse.self, from: data),
           let tokens = response.result {
            return tokens
        }
        
        // If that fails, try decoding the content as a string first (double-encoded)
        if let data = content.data(using: .utf8),
           let jsonString = try? JSONDecoder().decode(String.self, from: data),
           let jsonData = jsonString.data(using: .utf8),
           let response = try? JSONDecoder().decode(TokenListResponse.self, from: jsonData),
           let tokens = response.result {
            return tokens
        }
        
        print("⚠️ Failed to parse token list content: \(content)")
        return []
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "circle.grid.3x3.fill")
                    .foregroundColor(.purple)
                    .font(.title3)
                Text("Token List")
                    .font(.headline)
                Spacer()
                if !tokens.isEmpty {
                    Text("\(tokens.count)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            if !tokens.isEmpty {
                VStack(spacing: 4) {
                    ForEach(Array(tokens.enumerated()), id: \.offset) { index, token in
                        HStack(spacing: 6) {
                            // Token icon
                            if let imageUrl = token.image,
                               let url = URL(string: imageUrl) {
                                AsyncImage(url: url) { image in
                                    image
                                        .resizable()
                                        .aspectRatio(contentMode: .fill)
                                } placeholder: {
                                    Circle()
                                        .fill(Color.gray.opacity(0.3))
                                }
                                .frame(width: 18, height: 18)
                                .clipShape(Circle())
                            } else {
                                Circle()
                                    .fill(Color.purple.opacity(0.3))
                                    .frame(width: 18, height: 18)
                            }
                            
                            if let name = token.name {
                                Text(name)
                                    .font(.caption2)
                                    .fontWeight(.medium)
                                    .lineLimit(1)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                            }
                            if let balance = token.formattedBalance {
                                Text(formatBalance(balance))
                                    .font(.system(size: 10))
                                    .fontWeight(.semibold)
                                    .foregroundColor(.purple)
                            }
                        }
                        .padding(.horizontal, 6)
                        .padding(.vertical, 4)
                        .background(index % 2 == 0 ? Color.purple.opacity(0.08) : Color.clear)
                        .cornerRadius(6)
                    }
                }
            } else if let result = toolResults?.first, let content = result.content {
                // Fallback: show raw content if parsing fails
                Text(content)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(5)
            }
        }
        .padding()
        .frame(minHeight: 100) // More height for vertical list
        .background(
            LinearGradient(
                colors: [Color.purple.opacity(0.15), Color.purple.opacity(0.05)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(12)
    }
}

struct TransactionsCard: View {
    let toolResults: [ToolResult]?
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "arrow.left.arrow.right.circle.fill")
                    .foregroundColor(.blue)
                    .font(.title3)
                Text("Transactions")
                    .font(.headline)
                Spacer()
            }
            
            if let result = toolResults?.first, let content = result.content {
                Text(content)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(10)
            }
        }
        .padding()
        .frame(minHeight: 80)
        .background(
            LinearGradient(
                colors: [Color.blue.opacity(0.15), Color.blue.opacity(0.05)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(12)
    }
}

struct ERC20TransfersCard: View {
    let toolResults: [ToolResult]?
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "sparkles")
                    .foregroundColor(.mint)
                    .font(.title3)
                Text("ERC-20 Transfers")
                    .font(.headline)
                Spacer()
            }
            
            if let result = toolResults?.first, let content = result.content {
                Text(content)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(10)
            }
        }
        .padding()
        .frame(minHeight: 80)
        .background(
            LinearGradient(
                colors: [Color.mint.opacity(0.15), Color.mint.opacity(0.05)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(12)
    }
}

struct GeneralCard: View {
    let toolResults: [ToolResult]?
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "network")
                    .foregroundColor(.cyan)
                    .font(.title3)
                Text("Blockchain Data")
                    .font(.headline)
                Spacer()
            }
            
            if let result = toolResults?.first, let content = result.content {
                Text(content)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(10)
            }
        }
        .padding()
        .frame(minHeight: 80)
        .background(
            LinearGradient(
                colors: [Color.cyan.opacity(0.15), Color.cyan.opacity(0.05)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(12)
    }
}

