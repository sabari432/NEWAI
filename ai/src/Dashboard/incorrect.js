// Enhanced Incorrect Words Handler with confirmation round and updated UI
export default class IncorrectWordsHandler {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.recognition = null;
    this.currentWordIndex = 0;
    this.incorrectWords = [];
    this.isActive = false;
    this.onComplete = null;
    this.modal = null;
    this.isListening = false;
    this.isMobile = this.detectMobile();
    this.warmupWords = this.loadWarmupWords();
    this.silenceTimeout = null;
    this.silenceDelay = 6000;
    this.currentStep = 'initial';
    this.currentAttempt = 0;
    this.maxAttempts = 2;
    this.needsConfirmation = false; // New flag for confirmation round
  }

  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  loadWarmupWords() {
    try {
      const stored = JSON.parse('{}'); // Using empty object instead of localStorage
      return stored || {};
    } catch (e) {
      return {};
    }
  }

  saveWarmupWords() {
    // Store in memory only
    console.log('Warmup words saved to memory');
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
    this.currentAttempt = 0;
    this.needsConfirmation = false;
    this.isActive = true;
    this.currentStep = 'initial';

    if (this.incorrectWords.length === 0) {
      if (callback) callback();
      return;
    }

    this.createModal();
    this.initSpeechRecognition();
  }

  // Add this method for compatibility
  showConfirmationDialog(words, callback) {
    this.startCorrection(words, callback);
  }
createModal() {
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
    background: linear-gradient(135deg, #ff6b6b 0%, #ffa8a8 100%);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  `;

  const content = document.createElement('div');
  content.style.cssText = `
    background: white;
    padding: ${this.isMobile ? '25px' : '40px'};
    border-radius: 25px;
    max-width: ${this.isMobile ? '95%' : '450px'};
    width: ${this.isMobile ? '95%' : 'auto'};
    text-align: center;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    position: relative;
  `;

  content.innerHTML = `
    <button id="close-btn" style="
      position: absolute;
      top: 15px;
      right: 15px;
      background: none;
      border: none;
      font-size: 24px;
      color: #999;
      cursor: pointer;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.3s ease;
    " onmouseover="this.style.background='#f0f0f0'; this.style.color='#666'"
       onmouseout="this.style.background='none'; this.style.color='#999'">
      ×
    </button>
    
    <div id="modal-content">
      <div style="margin-bottom: 20px;">
        <div style="
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #ff6b6b, #ff8787);
          border-radius: 50%;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 30px rgba(255, 107, 107, 0.3);
        ">
          <span style="font-size: 36px;">🎯</span>
        </div>
        
        <h2 style="
          color: #333;
          margin-bottom: 15px;
          font-size: ${this.isMobile ? '24px' : '28px'};
          font-weight: 700;
        ">
          Let's Fix Those Words!
        </h2>
        
        <p style="
          color: #666;
          margin-bottom: 30px;
          font-size: ${this.isMobile ? '16px' : '18px'};
          line-height: 1.5;
        ">
          Want to fix wrong words? I will read once, you repeat after me!
        </p>
        
        <div style="margin-bottom: 25px;">
          <h3 style="
            color: #333;
            font-size: ${this.isMobile ? '18px' : '20px'};
            margin-bottom: 15px;
            font-weight: 600;
          ">
            Listen and Repeat:
          </h3>
          <div style="
            background: #f8f9fa;
            padding: 20px;
            border-radius: 15px;
            margin-bottom: 20px;
          ">
            <div style="
              font-size: ${this.isMobile ? '28px' : '36px'};
              font-weight: bold;
              color: #2196F3;
            " id="current-word-display">
             
            </div>
          </div>
        </div>
        
        <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
          <button id="start-correction" style="
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            border: none;
            padding: ${this.isMobile ? '15px 30px' : '18px 35px'};
            font-size: ${this.isMobile ? '16px' : '18px'};
            border-radius: 25px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
            box-shadow: 0 8px 25px rgba(76, 175, 80, 0.3);
          " onmouseover="this.style.transform='translateY(-2px)'"
             onmouseout="this.style.transform='translateY(0)'">
            Start Practice
          </button>
          <button id="skip-correction" style="
            background: #f5f5f5;
            color: #666;
            border: 2px solid #ddd;
            padding: ${this.isMobile ? '15px 30px' : '18px 35px'};
            font-size: ${this.isMobile ? '16px' : '18px'};
            border-radius: 25px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
          " onmouseover="this.style.background='#eeeeee'"
             onmouseout="this.style.background='#f5f5f5'">
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  `;

  this.modal.appendChild(content);
  document.body.appendChild(this.modal);

  document.getElementById('start-correction').onclick = () => this.startAutomatedCorrection();
  document.getElementById('skip-correction').onclick = () => this.closeModal();
  document.getElementById('close-btn').onclick = () => this.closeModal();

    // Immediately speak the message when popup opens (only once)
  if (!this.hasSpokenWelcome) {
    this.speak("Want to fix wrong words? I will read once, you repeat after me!");
    this.hasSpokenWelcome = true;
  }

}

startAutomatedCorrection() {
  this.currentWordIndex = 0;
  this.currentAttempt = 0;
  this.needsConfirmation = false;
  this.currentStep = 'intro';
  
  this.showWordInterface();
  // Remove the duplicate speak call - just start the word flow directly
  setTimeout(() => this.startWordFlow(), 1000);
}
  showWordInterface() {
    const word = this.incorrectWords[this.currentWordIndex];
    const content = document.getElementById('modal-content');
    
    content.innerHTML = `
      <div>
        <div style="
          color: #333;
          font-size: ${this.isMobile ? '18px' : '22px'};
          font-weight: 600;
          margin-bottom: 25px;
        ">
          Word ${this.currentWordIndex + 1} of ${this.incorrectWords.length}
          ${this.needsConfirmation ? ' - Confirmation Round' : ''}
        </div>
        
        <div style="
          background: #f8f9fa;
          padding: ${this.isMobile ? '25px' : '35px'};
          border-radius: 20px;
          margin-bottom: 25px;
          border: 3px solid ${this.needsConfirmation ? '#4CAF50' : '#e3f2fd'};
          position: relative;
        ">
          <div style="
            font-size: ${this.isMobile ? '32px' : '48px'};
            font-weight: 800;
            color: ${this.needsConfirmation ? '#4CAF50' : '#2196F3'};
            margin-bottom: 15px;
          ">
            ${word}
          </div>
          
          <div style="
            display: flex;
            justify-content: center;
            margin-bottom: 20px;
          ">
            <div id="sound-waves" style="
              display: flex;
              align-items: center;
              gap: 4px;
            ">
              ${Array.from({length: 5}, (_, i) => `
                <div style="
                  width: 4px;
                  height: 20px;
                  background: ${this.needsConfirmation ? '#4CAF50' : '#2196F3'};
                  border-radius: 2px;
                  animation: wave 1s infinite;
                  animation-delay: ${i * 0.1}s;
                "></div>
              `).join('')}
            </div>
          </div>
          
          <style>
            @keyframes wave {
              0%, 100% { height: 20px; }
              50% { height: 40px; }
            }
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 0.7; }
              50% { transform: scale(1.1); opacity: 1; }
            }
          </style>
        </div>

        <div id="correction-status" style="
          min-height: 60px;
          margin-bottom: 25px;
          font-size: ${this.isMobile ? '18px' : '22px'};
          font-weight: 600;
          color: #2196F3;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e3f2fd;
          border-radius: 15px;
          padding: 20px;
        ">
          🎧 Get ready to listen...
        </div>
        
        <div id="listening-indicator" style="height: 40px; margin-bottom: 15px; display: flex; justify-content: center; align-items: center;"></div>
        
        <div style="
          display: flex;
          justify-content: center;
          gap: 10px;
          margin: 20px 0;
        ">
          ${Array.from({length: this.maxAttempts}, (_, i) => `
            <div id="attempt-${i}" style="
              width: 40px;
              height: 40px;
              border-radius: 50%;
              background: ${i < this.currentAttempt ? '#ff6b6b' : i === this.currentAttempt ? '#ffd93d' : '#e0e0e0'};
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              color: white;
              font-size: 16px;
              transition: all 0.3s ease;
            ">
              ${i + 1}
            </div>
          `).join('')}
          
          ${this.needsConfirmation ? `
            <div style="
              width: 40px;
              height: 40px;
              border-radius: 50%;
              background: #4CAF50;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              color: white;
              font-size: 12px;
              margin-left: 10px;
            ">
              ✓+
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  startWordFlow() {
    const word = this.incorrectWords[this.currentWordIndex];
    this.currentStep = 'playing';
    this.updateStatus("🔊 Listen carefully...");
    
    this.speak(word, () => {
      this.currentStep = 'waiting_for_repeat';
      
      if (this.needsConfirmation) {
        this.updateStatus(`🎤 Say "${word}" `);
      } else {
        this.updateStatus(`🎤 Now you say: "${word}"`);
      }
      
      setTimeout(() => this.startListening(), 800);
    });
  }

  startListening() {
    if (this.isListening) return;

    this.isListening = true;
    this.currentStep = 'listening';
    this.updateStatus("🎤 I'm listening... Speak now!");
    this.showListeningAnimation();
    
    this.silenceTimeout = setTimeout(() => {
      if (this.isListening) {
        this.handleSilence();
      }
    }, this.silenceDelay);

    try {
      this.recognition.start();
    } catch (e) {
      console.log('Recognition start error:', e);
      this.handleRecognitionError();
    }
  }

  showListeningAnimation() {
    const indicator = document.getElementById('listening-indicator');
    if (indicator) {
      indicator.innerHTML = `
        <div style="
          width: 60px;
          height: 60px;
          border: 4px solid #4CAF50;
          border-radius: 50%;
          border-top: 4px solid transparent;
          animation: pulse 1.5s ease-in-out infinite;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="font-size: 24px;">🎤</span>
        </div>
      `;
    }
  }

  clearListeningAnimation() {
    const indicator = document.getElementById('listening-indicator');
    if (indicator) {
      indicator.innerHTML = '';
    }
  }

  clearSilenceTimeout() {
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
  }

  handleSilence() {
    this.isListening = false;
    this.clearSilenceTimeout();
    this.clearListeningAnimation();
    
    try {
      this.recognition.abort();
    } catch (e) {
      console.log('Recognition abort error:', e);
    }
    
    this.handleIncorrectAnswer("(no response)");
  }

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.updateStatus("❌ Speech recognition not supported");
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'en-US';
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 3;

    this.recognition.onresult = (event) => {
      this.clearSilenceTimeout();
      this.clearListeningAnimation();
      const result = event.results[0][0].transcript.toLowerCase().trim();
      this.handleRecognitionResult(result);
    };

    this.recognition.onerror = (event) => {
      console.log('Recognition error:', event.error);
      this.clearSilenceTimeout();
      this.clearListeningAnimation();
      this.handleRecognitionError();
    };

    this.recognition.onend = () => {
      if (this.isListening && this.isMobile) {
        setTimeout(() => {
          if (this.isListening) {
            try {
              this.recognition.start();
            } catch (e) {
              this.handleRecognitionError();
            }
          }
        }, 100);
      }
    };
  }

  handleRecognitionResult(spokenWord) {
    this.isListening = false;
    this.clearSilenceTimeout();
    const expectedWord = this.incorrectWords[this.currentWordIndex].toLowerCase();
    
    if (this.isWordCorrect(spokenWord, expectedWord)) {
      this.handleCorrectAnswer();
    } else {
      this.handleIncorrectAnswer(spokenWord);
    }
  }

  isWordCorrect(spoken, expected) {
    const cleanSpoken = spoken.replace(/[^\w]/g, '').toLowerCase();
    const cleanExpected = expected.replace(/[^\w]/g, '').toLowerCase();
    
    if (cleanSpoken === cleanExpected) return true;
    if (cleanSpoken.includes(cleanExpected) || cleanExpected.includes(cleanSpoken)) return true;
    
    const distance = this.levenshteinDistance(cleanSpoken, cleanExpected);
    const threshold = cleanExpected.length <= 4 ? 1 : 2;
    return distance <= threshold;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) matrix[i] = [i];
    for (let j = 0; j <= str1.length; j++) matrix[0][j] = j;
    
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
    this.currentStep = 'correct';
    this.updateAttemptIndicator(this.currentAttempt, 'success');
    
    if (!this.needsConfirmation && this.currentAttempt === 0) {
      // First time correct - MUST ask for confirmation
      this.needsConfirmation = true;
      this.updateStatus("🎉 Excellent! Perfect on first try!");
      
      this.speak("Congratulations! Perfect on the first try! Now say it one more time", () => {
        // Update the interface to show confirmation mode
        this.showWordInterface();
        setTimeout(() => this.startWordFlow(), 1000);
      });
    } else {
      // Either second attempt correct OR confirmation round complete
      this.updateStatus("🎉 Perfect! Well done!");
      
      if (this.needsConfirmation) {
        this.speak("Perfect confirmation! Excellent work!", () => {
          setTimeout(() => this.nextWord(), 1500);
        });
      } else {
        this.speak("Excellent!", () => {
          setTimeout(() => this.nextWord(), 1500);
        });
      }
    }
  }

  handleIncorrectAnswer(spokenWord) {
    const expectedWord = this.incorrectWords[this.currentWordIndex];
    this.updateAttemptIndicator(this.currentAttempt, 'failed');
    this.currentAttempt++;
    
    if (this.currentAttempt >= this.maxAttempts) {
      this.currentStep = 'failed';
      this.updateStatus(`❌ The correct word is "${expectedWord}"`);
      this.speak(`The correct word is ${expectedWord}. Let's move to the next word!`, () => {
        setTimeout(() => this.nextWord(), 2000);
      });
    } else {
      this.currentStep = 'retry';
      this.needsConfirmation = false; // Reset confirmation flag if they got it wrong
      this.updateStatus(`❌ Try again! Listen carefully...`);
      this.speak(`Try again! Listen carefully: ${expectedWord}`, () => {
        this.showWordInterface(); // Refresh interface without confirmation mode
        setTimeout(() => this.startWordFlow(), 1000);
      });
    }
  }

  updateAttemptIndicator(attemptIndex, status) {
    const indicator = document.getElementById(`attempt-${attemptIndex}`);
    if (indicator) {
      if (status === 'success') {
        indicator.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
        indicator.innerHTML = '✓';
      } else if (status === 'failed') {
        indicator.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a52)';
        indicator.innerHTML = '✗';
      }
    }
  }

  handleRecognitionError() {
    this.isListening = false;
    this.clearSilenceTimeout();
    this.clearListeningAnimation();
    this.handleIncorrectAnswer("(could not hear)");
  }

  nextWord() {
    this.clearSilenceTimeout();
    this.addToWarmup(this.incorrectWords[this.currentWordIndex]);
    
    this.currentWordIndex++;
    this.currentAttempt = 0;
    this.needsConfirmation = false; // Reset for next word
    this.currentStep = 'next_word';
    
    if (this.currentWordIndex >= this.incorrectWords.length) {
      this.showCompletionMessage();
    } else {
      this.showWordInterface();
      setTimeout(() => this.startWordFlow(), 800);
    }
  }

  showCompletionMessage() {
    const content = document.getElementById('modal-content');
    content.innerHTML = `
      <div>
        <div style="
          width: 100px;
          height: 100px;
          background: linear-gradient(135deg, #4CAF50, #45a049);
          border-radius: 50%;
          margin: 0 auto 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 15px 40px rgba(76, 175, 80, 0.3);
        ">
          <span style="font-size: 48px;">🎉</span>
        </div>
        
        <h2 style="
          color: #4CAF50;
          margin-bottom: 25px;
          font-size: ${this.isMobile ? '28px' : '32px'};
          font-weight: 800;
        ">
          Outstanding Work!
        </h2>
        
        <div style="
          background: #e8f5e8;
          padding: ${this.isMobile ? '25px' : '30px'};
          border-radius: 20px;
          margin-bottom: 25px;
          border: 2px solid rgba(76, 175, 80, 0.3);
        ">
          <p style="
            color: #2e7d32;
            font-size: ${this.isMobile ? '18px' : '20px'};
            line-height: 1.6;
            margin-bottom: 15px;
            font-weight: 600;
          ">
            🎯 All words completed successfully!
          </p>
          <p style="
            color: #388e3c;
            font-size: ${this.isMobile ? '16px' : '18px'};
            line-height: 1.6;
            margin: 0;
            font-weight: 500;
          ">
            Great job practicing those challenging words!
          </p>
        </div>
        
        <div style="
          color: #666;
          font-size: ${this.isMobile ? '14px' : '16px'};
          margin-top: 20px;
          font-style: italic;
        ">
          Closing automatically...
        </div>
      </div>
    `;

    this.speak("Amazing work! You've completed all the words perfectly!", () => {
      setTimeout(() => this.closeModal(), 3000);
    });
  }

  updateStatus(message) {
    const statusElement = document.getElementById('correction-status');
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.style.background = message.includes('❌') ? '#ffebee' : 
                                     message.includes('🎉') || message.includes('Perfect') || message.includes('Excellent') ? '#e8f5e8' : 
                                     message.includes('🎤') ? '#fff3e0' : 
                                     '#e3f2fd';
    }
  }

  speak(text, callback) {
    if (!this.synthesis) {
      if (callback) callback();
      return;
    }

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

    setTimeout(() => {
      this.synthesis.speak(utterance);
    }, 100);
  }

  closeModal() {
    this.isActive = false;
    this.isListening = false;
    this.clearSilenceTimeout();
    
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
    this.clearSilenceTimeout();
    this.closeModal();
  }

  getWarmupWords() {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));
    
    return Object.values(this.warmupWords).filter(item => {
      const addedDate = new Date(item.dateAdded);
      return addedDate >= threeDaysAgo;
    });
  }
}

if (typeof window !== 'undefined') {
  window.IncorrectWordsHandler = IncorrectWordsHandler;
}