//
//  VoiceInputManager.swift
//  initiate Watch App
//
//  Created by Kalash Shah on 08/10/25.
//

import Foundation
import AVFoundation

class VoiceInputManager: NSObject, ObservableObject {
    @Published var isRecording = false
    @Published var recognizedText = ""
    @Published var errorMessage = ""
    @Published var isTranscribing = false
    
    private var audioRecorder: AVAudioRecorder?
    private var recordingTimer: Timer?
    private var currentRecordingURL: URL?
    private var transcriptionTimeout: Timer?
    
    // Callback for when transcription is complete
    var onTranscriptionComplete: ((String) -> Void)?
    
    override init() {
        super.init()
        requestPermissions()
        setupNotificationObservers()
    }
    
    private func setupNotificationObservers() {
        // Set up notification observer for transcription completion
        NotificationCenter.default.addObserver(
            forName: NSNotification.Name("TranscriptionComplete"),
            object: nil,
            queue: .main
        ) { [weak self] notification in
            if let text = notification.userInfo?["text"] as? String {
                self?.setTranscriptionResult(text)
            }
        }
        
        // Set up notification observer for transcription failure
        NotificationCenter.default.addObserver(
            forName: NSNotification.Name("TranscriptionFailed"),
            object: nil,
            queue: .main
        ) { [weak self] notification in
            if let error = notification.userInfo?["error"] as? String {
                self?.setTranscriptionFailure(error)
            }
        }
    }
    
    func requestPermissions() {
        AVAudioSession.sharedInstance().requestRecordPermission { granted in
            DispatchQueue.main.async {
                if !granted {
                    self.errorMessage = "Microphone permission denied"
                }
            }
        }
    }
    
    func startRecording() {
        guard !isRecording else { return }
        
        // Configure audio session
        let audioSession = AVAudioSession.sharedInstance()
        do {
            try audioSession.setCategory(.record, mode: .default)
            try audioSession.setActive(true)
        } catch {
            errorMessage = "Audio session setup failed: \(error.localizedDescription)"
            return
        }
        
        // Set up recording URL
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let audioFilename = documentsPath.appendingPathComponent("recording_\(Date().timeIntervalSince1970).m4a")
        currentRecordingURL = audioFilename
        
        // Recording settings optimized for speech and API compatibility
        let settings = [
            AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
            AVSampleRateKey: 44100, // Standard sample rate for better compatibility
            AVNumberOfChannelsKey: 1, // Mono for speech
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue, // Higher quality
            AVEncoderBitRateKey: 192000 // Higher bitrate for better quality
        ]
        
        do {
            audioRecorder = try AVAudioRecorder(url: audioFilename, settings: settings)
            audioRecorder?.delegate = self
            audioRecorder?.isMeteringEnabled = true
            audioRecorder?.record()
            
            isRecording = true
            errorMessage = ""
            recognizedText = ""
            
        } catch {
            errorMessage = "Recording failed: \(error.localizedDescription)"
        }
    }
    
    func stopRecording() {
        guard isRecording else { return }
        
        audioRecorder?.stop()
        audioRecorder = nil
        recordingTimer?.invalidate()
        recordingTimer = nil
        
        isRecording = false
        
        // Validate the recording was successful
        if let audioURL = currentRecordingURL {
            do {
                let audioData = try Data(contentsOf: audioURL)
                print("🎤 Recording completed successfully:")
                print("   - File size: \(audioData.count) bytes")
                print("   - File path: \(audioURL.path)")
                
                if audioData.count < 1000 {
                    print("⚠️ Warning: Audio file is very small (\(audioData.count) bytes)")
                }
            } catch {
                print("❌ Failed to validate recording: \(error.localizedDescription)")
                errorMessage = "Recording validation failed"
            }
        }
    }
    
    func transcribeAudio(with apiService: APIService) {
        guard let audioURL = currentRecordingURL,
              FileManager.default.fileExists(atPath: audioURL.path) else {
            errorMessage = "No audio file to transcribe"
            return
        }
        
        // Convert audio to base64 for API transmission
        do {
            let audioData = try Data(contentsOf: audioURL)
            let base64Audio = audioData.base64EncodedString()
            
            // Debug logging
            print("🎤 Audio file details:")
            print("   - File path: \(audioURL.path)")
            print("   - File size: \(audioData.count) bytes")
            print("   - Base64 length: \(base64Audio.count) characters")
            print("   - First 50 chars of base64: \(String(base64Audio.prefix(50)))")
            
            // Check if audio data is valid
            if audioData.count == 0 {
                errorMessage = "Audio file is empty"
                isTranscribing = false
                return
            }
            
            // Call the transcription API through the service
            transcribeWithAPIService(apiService, base64Audio: base64Audio)
            
        } catch {
            errorMessage = "Failed to read audio file: \(error.localizedDescription)"
            isTranscribing = false
        }
    }
    
    private func transcribeAudioWithAPI(base64Audio: String) {
        // This will be called by the APIService
        // For now, we'll simulate the transcription process
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            self.isTranscribing = false
            
            // Simulate transcription result
            let simulatedText = "This is a simulated transcription of your voice input"
            self.recognizedText = simulatedText
            self.onTranscriptionComplete?(simulatedText)
        }
    }
    
    func transcribeWithAPIService(_ apiService: APIService, base64Audio: String) {
        isTranscribing = true
        errorMessage = ""
        
        // Set up timeout timer (30 seconds)
        transcriptionTimeout = Timer.scheduledTimer(withTimeInterval: 30.0, repeats: false) { _ in
            DispatchQueue.main.async {
                if self.isTranscribing {
                    self.setTranscriptionFailure("Transcription timeout - please try again")
                }
            }
        }
        
        // Call the API service
        apiService.transcribeAudio(base64Audio: base64Audio)
    }
    
    func setTranscriptionResult(_ text: String) {
        transcriptionTimeout?.invalidate()
        transcriptionTimeout = nil
        recognizedText = text
        isTranscribing = false
        onTranscriptionComplete?(text)
    }
    
    func setTranscriptionFailure(_ error: String) {
        transcriptionTimeout?.invalidate()
        transcriptionTimeout = nil
        errorMessage = error
        isTranscribing = false
        // Don't call onTranscriptionComplete for failures
    }
    
    func reset() {
        stopRecording()
        transcriptionTimeout?.invalidate()
        transcriptionTimeout = nil
        recognizedText = ""
        errorMessage = ""
        isTranscribing = false
        
        // Clean up audio file
        if let audioURL = currentRecordingURL {
            try? FileManager.default.removeItem(at: audioURL)
        }
        currentRecordingURL = nil
    }
}

// MARK: - AVAudioRecorderDelegate
extension VoiceInputManager: AVAudioRecorderDelegate {
    func audioRecorderDidFinishRecording(_ recorder: AVAudioRecorder, successfully flag: Bool) {
        if flag {
            // Recording completed successfully
            // Transcription will be triggered from ContentView
        } else {
            errorMessage = "Recording failed"
        }
    }
    
    func audioRecorderEncodeErrorDidOccur(_ recorder: AVAudioRecorder, error: Error?) {
        errorMessage = "Recording error: \(error?.localizedDescription ?? "Unknown error")"
    }
}
