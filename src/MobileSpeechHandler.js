// MobileSpeechHandler.js
class MobileSpeechHandler {
  constructor() {
    this.recognition = null;
    this.recognizing = false;
    this.onResultCallback = null;
    this.onErrorCallback = null;
    this.onStartCallback = null;
    this.onEndCallback = null;
    this.isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.finalTranscript = '';
    this.restartTimeout = null;
    this.isInitialized = false;
  }

  // Initialize speech recognition
  init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('Speech Recognition not supported');
      return false;
    }

    this.recognition = new SpeechRecognition();
    this.setupRecognition();
    this.isInitialized = true;
    return true;
  }

  // Setup recognition with mobile-optimized settings
  setupRecognition() {
    if (!this.recognition) return;

    // Mobile-optimized settings
    this.recognition.lang = "en-US";
    this.recognition.continuous = this.isMobile ? false : true; // Short sessions for mobile
    this.recognition.interimResults = this.isMobile ? false : true; // Disable interim for mobile
    this.recognition.maxAlternatives = this.isMobile ? 3 : 1; // More alternatives for mobile

    // Event handlers
    this.recognition.onstart = () => {
      console.log('Mobile Speech: Recognition started');
      this.recognizing = true;
      this.finalTranscript = '';
      if (this.onStartCallback) {
        this.onStartCallback();
      }
    };

    this.recognition.onresult = (event) => {
      console.log('Mobile Speech: Got result', event);
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript + ' ';
        }
      }
      
      // Process final results immediately
      if (finalTranscript.trim()) {
        this.finalTranscript = finalTranscript.trim();
        console.log('Mobile Speech: Final transcript:', this.finalTranscript);
        if (this.onResultCallback) {
          this.onResultCallback(this.finalTranscript);
        }
      }
      // Show interim results for feedback (desktop only)
      else if (interimTranscript.trim() && !this.isMobile) {
        console.log('Mobile Speech: Interim:', interimTranscript.trim());
        if (this.onResultCallback) {
          this.onResultCallback(interimTranscript.trim(), false); // false = interim
        }
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Mobile Speech: Error:', event.error);
      
      const errorMessages = {
        'no-speech': "No speech detected. Try speaking louder.",
        'audio-capture': "Microphone not accessible. Check permissions.",
        'not-allowed': "Microphone permission denied. Please allow and refresh.",
        'network': "Network error. Check your connection.",
        'service-not-allowed': "Speech service not allowed. Try again.",
        'bad-grammar': "Speech not recognized. Try again.",
        'language-not-supported': "Language not supported."
      };
      
      const message = errorMessages[event.error] || `Error: ${event.error}. Try again.`;
      
      if (this.onErrorCallback) {
        this.onErrorCallback(message, event.error);
      }
      
      this.recognizing = false;
    };

    this.recognition.onend = () => {
      console.log('Mobile Speech: Recognition ended');
      this.recognizing = false;
      
      if (this.onEndCallback) {
        this.onEndCallback();
      }
    };
  }

  // Start recognition
  start() {
    if (!this.isInitialized) {
      console.error('Mobile Speech: Not initialized');
      return false;
    }

    if (this.recognizing) {
      console.log('Mobile Speech: Already recognizing');
      return false;
    }

    try {
      console.log('Mobile Speech: Starting recognition...');
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Mobile Speech: Start error:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback('Failed to start: ' + error.message);
      }
      return false;
    }
  }

  // Stop recognition
  stop() {
    if (!this.recognizing || !this.recognition) {
      return false;
    }

    try {
      this.recognition.stop();
      this.recognizing = false;
      console.log('Mobile Speech: Stopped');
      return true;
    } catch (error) {
      console.error('Mobile Speech: Stop error:', error);
      return false;
    }
  }

  // Abort recognition
  abort() {
    if (!this.recognition) {
      return false;
    }

    try {
      this.recognition.abort();
      this.recognizing = false;
      console.log('Mobile Speech: Aborted');
      return true;
    } catch (error) {
      console.error('Mobile Speech: Abort error:', error);
      return false;
    }
  }

  // Check if currently recognizing
  isRecognizing() {
    return this.recognizing;
  }

  // Check if mobile device
  isMobileDevice() {
    return this.isMobile;
  }

  // Set callback for results
  onResult(callback) {
    this.onResultCallback = callback;
  }

  // Set callback for errors
  onError(callback) {
    this.onErrorCallback = callback;
  }

  // Set callback for start
  onStart(callback) {
    this.onStartCallback = callback;
  }

  // Set callback for end
  onEnd(callback) {
    this.onEndCallback = callback;
  }

  // Get last transcript
  getLastTranscript() {
    return this.finalTranscript;
  }

  // Check if speech recognition is supported
  static isSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  // Cleanup
  cleanup() {
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {
        console.log('Cleanup error:', e);
      }
    }
    
    this.recognizing = false;
    this.onResultCallback = null;
    this.onErrorCallback = null;
    this.onStartCallback = null;
    this.onEndCallback = null;
  }
}

export default MobileSpeechHandler;