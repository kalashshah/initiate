//
//  ContentView.swift
//  initiate Watch App
//
//  Created by Kalash Shah on 08/10/25.
//

import SwiftUI

struct ContentView: View {
    @StateObject private var voiceManager = VoiceInputManager()
    @StateObject private var apiService = APIService()
    @State private var currentView: AppView = .voice
    
    enum AppView {
        case voice, results
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 12) {
                // Header
                HStack {
                    Text("Voice Assistant")
                        .font(.headline)
                        .fontWeight(.bold)
                    Spacer()
                    Button(action: { currentView = currentView == .voice ? .results : .voice }) {
                        Image(systemName: currentView == .voice ? "list.bullet" : "mic")
                            .font(.title3)
                    }
                }
                .padding(.horizontal)
                
                if currentView == .voice {
                    VoiceInputView(voiceManager: voiceManager, apiService: apiService)
                } else {
                    ResultDisplayView(response: apiService.lastResponse)
                }
            }
            .navigationTitle("")
            .navigationBarHidden(true)
        }
        .onChange(of: apiService.lastResponse) { response in
            // Switch to results view when response is received
            if response != nil {
                currentView = .results
            }
        }
    }
}

struct VoiceInputView: View {
    @ObservedObject var voiceManager: VoiceInputManager
    @ObservedObject var apiService: APIService
    
    var body: some View {
        VStack(spacing: 16) {
            // Status indicators
            VStack(spacing: 8) {
                if voiceManager.isRecording {
                    HStack {
                        Circle()
                            .fill(Color.red)
                            .frame(width: 8, height: 8)
                            .opacity(voiceManager.isRecording ? 1 : 0)
                            .animation(.easeInOut(duration: 0.5).repeatForever(), value: voiceManager.isRecording)
                        Text("Recording...")
                            .font(.caption)
                            .foregroundColor(.red)
                    }
                } else if voiceManager.isTranscribing {
                    HStack {
                        ProgressView()
                            .scaleEffect(0.8)
                        Text("Transcribing...")
                            .font(.caption)
                            .foregroundColor(.orange)
                    }
                } else if apiService.isLoading {
                    HStack {
                        ProgressView()
                            .scaleEffect(0.8)
                        Text("Processing...")
                            .font(.caption)
                            .foregroundColor(.blue)
                    }
                } else {
                    Text("Tap to speak")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            // Voice input button
            Button(action: {
                if voiceManager.isRecording {
                    voiceManager.stopRecording()
                    // Start transcription after recording stops
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                        voiceManager.transcribeAudio(with: apiService)
                    }
                } else {
                    voiceManager.startRecording()
                }
            }) {
                ZStack {
                    Circle()
                        .fill(voiceManager.isRecording ? Color.red : Color.blue)
                        .frame(width: 60, height: 60)
                    
                    Image(systemName: voiceManager.isRecording ? "stop.fill" : "mic.fill")
                        .font(.title2)
                        .foregroundColor(.white)
                }
            }
            .disabled(apiService.isLoading || voiceManager.isTranscribing)
            
            // Recognized text
            if !voiceManager.recognizedText.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    Text("You said:")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Text(voiceManager.recognizedText)
                        .font(.body)
                        .multilineTextAlignment(.leading)
                        .padding(8)
                        .background(Color.gray.opacity(0.1))
                        .cornerRadius(8)
                }
            }
            
            // Error messages
            if !voiceManager.errorMessage.isEmpty {
                Text(voiceManager.errorMessage)
                    .font(.caption)
                    .foregroundColor(.red)
                    .multilineTextAlignment(.center)
            }
            
            if !apiService.errorMessage.isEmpty {
                Text(apiService.errorMessage)
                    .font(.caption)
                    .foregroundColor(.red)
                    .multilineTextAlignment(.center)
            }
            
            // Reset button
            if !voiceManager.recognizedText.isEmpty || !voiceManager.errorMessage.isEmpty {
                Button("Reset") {
                    voiceManager.reset()
                    apiService.errorMessage = ""
                }
                .font(.caption)
                .foregroundColor(.blue)
            }
            
            Spacer()
        }
        .padding()
    }
}

#Preview {
    ContentView()
}
