// incorrect.js - Module for handling incorrect word corrections with voice feedback

export default class IncorrectWordsHandler {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.recognition = null;
    this.currentWordIndex = 0;
    this.incorrectWords = [];
    this.isActive = false;
    this.onComplete = null;
    this.modal = null;
    this.currentAttempt = 0;
    this.maxAttempts = 3;
    this.isListening = false;
    this.isMobile = this.detectMobile();
    this.warmupWords = this.loadWarmupWords();
  }

  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  loadWarmupWords() {
    try {
      const stored = localStorage.getItem('warmupWords');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  }

  saveWarmupWords() {
    try {
      localStorage.setItem('warmupWords', JSON.stringify(this.warmupWords));
    } catch (e) {
      console.log('Could not save warmup words');
    }
  }

  addToWarmup(word) {
    const today = new Date().toDateString();
    this.warmupWords[word.toLowerCase()] = {
      word: word,
      dateAdded: today,
      practiceCount: 0
    };
    this.saveWarmupWords();
  }

  startCorrection(words, callback) {
    if (!words || words.length === 0) {
      if (callback) callback();
      return;
    }

    this.incorrectWords = words.filter(word => word && word.trim());
    this.onComplete = callback;
    this.currentWordIndex = 0;
    this.isActive = true;

    if (this.incorrectWords.length === 0) {
      if (callback) callback();
      return;
    }

    this.createModal();
    this.initSpeechRecognition();
    this.showConfirmationDialog();
  }

  createModal() {
    // Remove existing modal if any
    if (this.modal) {
      document.body.removeChild(this.modal);
    }

    this.modal = document.createElement('div');
    this.modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: Arial, sans-serif;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      padding: ${this.isMobile ? '20px' : '30px'};
      border-radius: 12px;
      max-width: ${this.isMobile ? '90%' : '500px'};
      width: ${this.isMobile ? '90%' : 'auto'};
      text-align: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      border: 3px solid #333;
    `;

    content.innerHTML = `
      <div id="modal-content">
        <h2 style="color: #333; margin-bottom: 20px; font-size: ${this.isMobile ? '20px' : '24px'};">
          🎯 Want to fix wrong words?
        </h2>
        <p style="color: #666; margin-bottom: 25px; font-size: ${this.isMobile ? '14px' : '16px'}; line-height: 1.5;">
          I will read once, you repeat after me!
        </p>
        <div style="margin-bottom: 20px;">
          <button id="start-correction" style="
            background: #4CAF50;
            color: white;
            border: none;
            padding: ${this.isMobile ? '12px 25px' : '15px 30px'};
            font-size: ${this.isMobile ? '14px' : '16px'};
            border-radius: 6px;
            cursor: pointer;
            margin-right: 10px;
            font-weight: bold;
          ">✅ Yes, Let's Fix Them</button>
          <button id="skip-correction" style="
            background: #f44336;
            color: white;
            border: none;
            padding: ${this.isMobile ? '12px 25px' : '15px 30px'};
            font-size: ${this.isMobile ? '14px' : '16px'};
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
          ">❌ Skip</button>
        </div>
      </div>
    `;

    this.modal.appendChild(content);
    document.body.appendChild(this.modal);

    // Add event listeners
    document.getElementById('start-correction').onclick = () => this.startWordCorrection();
    document.getElementById('skip-correction').onclick = () => this.closeModal();
  }

  showConfirmationDialog() {
    // Already handled in createModal
  }

  startWordCorrection() {
    if (this.currentWordIndex >= this.incorrectWords.length) {
      this.showCompletionMessage();
      return;
    }

    this.currentAttempt = 0;
    this.showCurrentWord();
  }

  showCurrentWord() {
    const word = this.incorrectWords[this.currentWordIndex];
    const content = document.getElementById('modal-content');
    
    content.innerHTML = `
      <h2 style="color: #333; margin-bottom: 20px; font-size: ${this.isMobile ? '18px' : '22px'};">
        🎤 Word ${this.currentWordIndex + 1} of ${this.incorrectWords.length}
      </h2>
      <div style="
        background: #f5f5f5;
        padding: ${this.isMobile ? '15px' : '20px'};
        border-radius: 8px;
        margin-bottom: 20px;
        border: 2px solid #ddd;
      ">
        <div style="font-size: ${this.isMobile ? '24px' : '32px'}; font-weight: bold; color: #333; margin-bottom: 10px;">
          "${word}"
        </div>
        <div style="color: #666; font-size: ${this.isMobile ? '12px' : '14px'};">
          Listen carefully, then repeat after me
        </div>
      </div>
      <div id="correction-status" style="
        min-height: 40px;
        margin-bottom: 20px;
        font-size: ${this.isMobile ? '14px' : '16px'};
        font-weight: bold;
      "></div>
      <div id="correction-buttons">
        <button id="play-word" style="
          background: #2196F3;
          color: white;
          border: none;
          padding: ${this.isMobile ? '10px 20px' : '12px 25px'};
          font-size: ${this.isMobile ? '14px' : '16px'};
          border-radius: 6px;
          cursor: pointer;
          margin: 5px;
          font-weight: bold;
        ">🔊 Play Word</button>
        <button id="start-repeat" style="
          background: #FF9800;
          color: white;
          border: none;
          padding: ${this.isMobile ? '10px 20px' : '12px 25px'};
          font-size: ${this.isMobile ? '14px' : '16px'};
          border-radius: 6px;
          cursor: pointer;
          margin: 5px;
          font-weight: bold;
        ">🎤 Now You Repeat</button>
        <button id="skip-word" style="
          background: #757575;
          color: white;
          border: none;
          padding: ${this.isMobile ? '8px 15px' : '10px 20px'};
          font-size: ${this.isMobile ? '12px' : '14px'};
          border-radius: 6px;
          cursor: pointer;
          margin: 5px;
        ">Skip This Word</button>
      </div>
    `;

    // Add event listeners
    document.getElementById('play-word').onclick = () => this.playCurrentWord();
    document.getElementById('start-repeat').onclick = () => this.startListening();
    document.getElementById('skip-word').onclick = () => this.nextWord();

    // Auto-play the word
    setTimeout(() => this.playCurrentWord(), 500);
  }

  playCurrentWord() {
    const word = this.incorrectWords[this.currentWordIndex];
    this.speak(word, () => {
      this.updateStatus("🎤 Now click 'Now You Repeat' and say the word!");
    });
  }

  startListening() {
    if (this.isListening) return;

    this.isListening = true;
    this.updateStatus("🎤 Listening... Say the word now!");
    
    const buttons = document.getElementById('correction-buttons');
    buttons.innerHTML = `
      <button id="stop-listening" style="
        background: #f44336;
        color: white;
        border: none;
        padding: ${this.isMobile ? '12px 25px' : '15px 30px'};
        font-size: ${this.isMobile ? '14px' : '16px'};
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
      ">🛑 Stop Listening</button>
    `;

    document.getElementById('stop-listening').onclick = () => this.stopListening();

    try {
      this.recognition.start();
    } catch (e) {
      console.log('Recognition start error:', e);
      this.handleRecognitionError();
    }
  }

  stopListening() {
    this.isListening = false;
    try {
      this.recognition.abort();
    } catch (e) {
      console.log('Recognition stop error:', e);
    }
    this.showCurrentWord();
  }

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.updateStatus("❌ Speech recognition not supported in this browser");
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'en-US';
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 3;

    this.recognition.onresult = (event) => {
      const result = event.results[0][0].transcript.toLowerCase().trim();
      this.handleRecognitionResult(result);
    };

    this.recognition.onerror = (event) => {
      console.log('Recognition error:', event.error);
      this.handleRecognitionError();
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        // Recognition ended unexpectedly, try to restart if mobile
        if (this.isMobile) {
          setTimeout(() => {
            if (this.isListening) {
              try {
                this.recognition.start();
              } catch (e) {
                this.handleRecognitionError();
              }
            }
          }, 100);
        } else {
          this.handleRecognitionError();
        }
      }
    };
  }

  handleRecognitionResult(spokenWord) {
    this.isListening = false;
    const expectedWord = this.incorrectWords[this.currentWordIndex].toLowerCase();
    
    if (this.isWordCorrect(spokenWord, expectedWord)) {
      this.handleCorrectAnswer();
    } else {
      this.handleIncorrectAnswer(spokenWord);
    }
  }

  isWordCorrect(spoken, expected) {
    // Clean both words
    const cleanSpoken = spoken.replace(/[^\w]/g, '').toLowerCase();
    const cleanExpected = expected.replace(/[^\w]/g, '').toLowerCase();
    
    // Exact match
    if (cleanSpoken === cleanExpected) return true;
    
    // Check if spoken contains expected or vice versa
    if (cleanSpoken.includes(cleanExpected) || cleanExpected.includes(cleanSpoken)) {
      return true;
    }
    
    // Levenshtein distance for similar words
    const distance = this.levenshteinDistance(cleanSpoken, cleanExpected);
    const threshold = cleanExpected.length <= 4 ? 1 : 2;
    
    return distance <= threshold;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  handleCorrectAnswer() {
    this.currentAttempt++;
    this.updateStatus("🎉 Great job!");
    
    this.speak("Great job!", () => {
      if (this.currentAttempt < 2) {
        this.updateStatus("👏 Now say it one more time!");
        this.speak("Now say it one more time!", () => {
          setTimeout(() => this.startListening(), 500);
        });
      } else {
        this.updateStatus("✅ Perfect! Let's move on to the next word.");
        this.speak("Perfect! Let's move on to the next word.", () => {
          setTimeout(() => this.nextWord(), 1000);
        });
      }
    });
  }

  handleIncorrectAnswer(spokenWord) {
    const expectedWord = this.incorrectWords[this.currentWordIndex];
    this.updateStatus(`❌ You said "${spokenWord}". Try again!`);
    
    this.speak(`You said ${spokenWord}. Let me say it again.`, () => {
      setTimeout(() => {
        this.speak(expectedWord, () => {
          this.updateStatus("🎤 Now try again - click 'Now You Repeat'");
          this.showCurrentWord();
        });
      }, 500);
    });
  }

  handleRecognitionError() {
    this.isListening = false;
    this.updateStatus("❌ Could not hear you clearly. Try again!");
    setTimeout(() => this.showCurrentWord(), 1000);
  }

  nextWord() {
    // Add current word to warmup list
    this.addToWarmup(this.incorrectWords[this.currentWordIndex]);
    
    this.currentWordIndex++;
    this.currentAttempt = 0;
    
    if (this.currentWordIndex >= this.incorrectWords.length) {
      this.showCompletionMessage();
    } else {
      this.startWordCorrection();
    }
  }

  showCompletionMessage() {
    const content = document.getElementById('modal-content');
    content.innerHTML = `
      <h2 style="color: #4CAF50; margin-bottom: 20px; font-size: ${this.isMobile ? '18px' : '22px'};">
        🎉 Excellent Work!
      </h2>
      <div style="
        background: #e8f5e8;
        padding: ${this.isMobile ? '15px' : '20px'};
        border-radius: 8px;
        margin-bottom: 20px;
        border: 2px solid #4CAF50;
      ">
        <p style="color: #333; font-size: ${this.isMobile ? '14px' : '16px'}; line-height: 1.6; margin-bottom: 15px;">
          Good that you tried to correct the wrong words!
        </p>
        <p style="color: #333; font-size: ${this.isMobile ? '14px' : '16px'}; line-height: 1.6; margin-bottom: 0;">
          I will add those words to the warm-up list and remind you for 3 days until you get comfortable with them.
        </p>
      </div>
      <button id="finish-correction" style="
        background: #4CAF50;
        color: white;
        border: none;
        padding: ${this.isMobile ? '12px 25px' : '15px 30px'};
        font-size: ${this.isMobile ? '14px' : '16px'};
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
      ">✅ Continue</button>
    `;

    document.getElementById('finish-correction').onclick = () => this.closeModal();

    // Auto-close after reading the message
    this.speak("Good that you tried to correct the wrong words! I will add those words to the warm-up list and remind you for 3 days until you get comfortable with them.", () => {
      // Don't auto-close, let user click continue
    });
  }

  updateStatus(message) {
    const statusElement = document.getElementById('correction-status');
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.style.color = message.includes('❌') ? '#f44336' : 
                                 message.includes('🎉') || message.includes('✅') ? '#4CAF50' : '#333';
    }
  }

  speak(text, callback) {
    if (!this.synthesis) {
      if (callback) callback();
      return;
    }

    // Cancel any ongoing speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      if (callback) callback();
    };

    utterance.onerror = () => {
      console.log('Speech synthesis error');
      if (callback) callback();
    };

    // Small delay to ensure cancel took effect
    setTimeout(() => {
      this.synthesis.speak(utterance);
    }, 100);
  }

  closeModal() {
    this.isActive = false;
    this.isListening = false;
    
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {
        console.log('Recognition cleanup error:', e);
      }
    }

    if (this.synthesis) {
      this.synthesis.cancel();
    }

    if (this.modal && document.body.contains(this.modal)) {
      document.body.removeChild(this.modal);
      this.modal = null;
    }

    if (this.onComplete) {
      this.onComplete();
    }
  }

  cleanup() {
    this.closeModal();
  }

  // Method to get warmup words for practice
  getWarmupWords() {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));
    
    return Object.values(this.warmupWords).filter(item => {
      const addedDate = new Date(item.dateAdded);
      return addedDate >= threeDaysAgo;
    });
  }
}

// Also make available globally for direct script inclusion
if (typeof window !== 'undefined') {
  window.IncorrectWordsHandler = IncorrectWordsHandler;
}