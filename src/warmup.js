class WarmupHandler {
  constructor() {
    this.warmupWords = this.loadWarmupData();
    this.currentWarmupIndex = 0;
    this.isWarmupActive = false;
    this.warmupCallback = null;
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.currentWord = '';
    this.warmupAttempts = 0;
    this.maxAttempts = 3;
  }

  // Cookie helper functions
  setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${JSON.stringify(value)};expires=${expires.toUTCString()};path=/`;
  }

  getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        try {
          return JSON.parse(c.substring(nameEQ.length, c.length));
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  }

  // Load warm-up data from cookies
  loadWarmupData() {
    const data = this.getCookie('warmupWords');
    return data || {};
  }

  // Save warm-up data to cookies
  saveWarmupData() {
    this.setCookie('warmupWords', this.warmupWords, 30); // Keep for 30 days
  }

  // Add incorrect words to warm-up list
  addIncorrectWords(words) {
    const today = new Date().toDateString();
    
    words.forEach(word => {
      const cleanWord = word.toLowerCase().trim();
      if (!this.warmupWords[cleanWord]) {
        this.warmupWords[cleanWord] = {
          addedDate: today,
          correctDays: [],
          lastPracticed: null
        };
      }
    });
    
    this.saveWarmupData();
    console.log('Added words to warmup:', words);
  }

  // Check if warm-up is needed
  shouldShowWarmup() {
    const wordsToWarmup = this.getWordsNeedingWarmup();
    return wordsToWarmup.length > 0;
  }

  // Get words that need warm-up practice
  getWordsNeedingWarmup() {
    const words = [];
    const today = new Date().toDateString();
    
    Object.keys(this.warmupWords).forEach(word => {
      const wordData = this.warmupWords[word];
      
      // Check if word needs practice (not practiced today or needs more consecutive days)
      const needsPractice = !wordData.lastPracticed || 
                           wordData.lastPracticed !== today || 
                           wordData.correctDays.length < 5;
      
      if (needsPractice) {
        words.push(word);
      }
    });
    
    return words;
  }

  // Start warm-up session
  startWarmup(callback) {
    const wordsToWarmup = this.getWordsNeedingWarmup();
    
    if (wordsToWarmup.length === 0) {
      if (callback) callback();
      return false;
    }

    this.isWarmupActive = true;
    this.warmupCallback = callback;
    this.currentWarmupIndex = 0;
    this.wordsToWarmup = wordsToWarmup;
    
    this.showWarmupUI();
    this.startWordPractice();
    
    return true;
  }

  // Show warm-up UI
  showWarmupUI() {
    // Create warm-up overlay
    const overlay = document.createElement('div');
    overlay.id = 'warmup-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const warmupBox = document.createElement('div');
    warmupBox.id = 'warmup-box';
    warmupBox.style.cssText = `
      background: white;
      padding: 40px;
      border-radius: 10px;
      text-align: center;
      max-width: 500px;
      width: 90%;
      border: 3px solid #000;
    `;

    warmupBox.innerHTML = `
      <h2 style="color: #000; margin-bottom: 20px;">🏃‍♂️ Warm-Up Time!</h2>
      <p style="color: #666; margin-bottom: 30px;">
        Let's practice ${this.wordsToWarmup.length} words from your recent mistakes
      </p>
      <div id="warmup-word" style="font-size: 32px; font-weight: bold; color: #000; margin: 20px 0; min-height: 50px;"></div>
      <div id="warmup-status" style="color: #666; margin: 15px 0; min-height: 25px;"></div>
      <div id="warmup-progress" style="color: #666; margin: 10px 0;"></div>
      <div style="margin-top: 30px;">
        <button id="warmup-listen" style="padding: 12px 24px; margin: 5px; font-size: 16px; border: 2px solid #000; border-radius: 4px; background: #fff; color: #000; cursor: pointer; font-weight: bold;">🔊 Listen</button>
        <button id="warmup-speak" style="padding: 12px 24px; margin: 5px; font-size: 16px; border: 2px solid #000; border-radius: 4px; background: #000; color: #fff; cursor: pointer; font-weight: bold;">🎤 Speak</button>
        <button id="warmup-skip" style="padding: 12px 24px; margin: 5px; font-size: 16px; border: 2px solid #666; border-radius: 4px; background: #fff; color: #666; cursor: pointer;">Skip</button>
      </div>
    `;

    overlay.appendChild(warmupBox);
    document.body.appendChild(overlay);

    // Add event listeners
    document.getElementById('warmup-listen').onclick = () => this.speakWord();
    document.getElementById('warmup-speak').onclick = () => this.startListening();
    document.getElementById('warmup-skip').onclick = () => this.skipWord();
  }

  // Start practicing current word
  startWordPractice() {
    if (this.currentWarmupIndex >= this.wordsToWarmup.length) {
      this.finishWarmup();
      return;
    }

    this.currentWord = this.wordsToWarmup[this.currentWarmupIndex];
    this.warmupAttempts = 0;

    const wordEl = document.getElementById('warmup-word');
    const statusEl = document.getElementById('warmup-status');
    const progressEl = document.getElementById('warmup-progress');

    if (wordEl) wordEl.textContent = this.currentWord;
    if (statusEl) statusEl.textContent = 'Click Listen to hear the word, then Speak to practice';
    if (progressEl) {
      progressEl.textContent = `Word ${this.currentWarmupIndex + 1} of ${this.wordsToWarmup.length}`;
    }

    // Auto-play the word
    setTimeout(() => this.speakWord(), 500);
  }

  // Speak the current word using TTS
  speakWord() {
    if (!this.currentWord) return;

    const utterance = new SpeechSynthesisUtterance(this.currentWord);
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    this.synthesis.speak(utterance);
  }

  // Start listening for user's pronunciation
  startListening() {
    const statusEl = document.getElementById('warmup-status');
    if (statusEl) statusEl.textContent = '🎤 Listening... Say the word clearly';

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (statusEl) statusEl.textContent = 'Speech recognition not supported';
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'en-US';
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event) => {
      const spoken = event.results[0][0].transcript.toLowerCase().trim();
      this.validateWarmupWord(spoken);
    };

    this.recognition.onerror = (event) => {
      const statusEl = document.getElementById('warmup-status');
      if (statusEl) statusEl.textContent = 'Error listening. Try again.';
    };

    this.recognition.onend = () => {
      // Recognition ended
    };

    try {
      this.recognition.start();
    } catch (e) {
      console.log('Recognition start error:', e);
    }
  }

  // Validate the spoken word
  validateWarmupWord(spoken) {
    const statusEl = document.getElementById('warmup-status');
    const expected = this.currentWord.toLowerCase();
    
    // Simple validation - check if spoken word contains or matches expected
    const isCorrect = spoken === expected || 
                     spoken.includes(expected) || 
                     this.calculateSimilarity(spoken, expected) > 0.7;

    if (isCorrect) {
      this.markWordCorrect();
      if (statusEl) statusEl.textContent = '✅ Great! Moving to next word...';
      setTimeout(() => this.nextWord(), 1500);
    } else {
      this.warmupAttempts++;
      if (this.warmupAttempts >= this.maxAttempts) {
        if (statusEl) statusEl.textContent = `❌ Let's try this word again tomorrow. Moving on...`;
        setTimeout(() => this.nextWord(), 2000);
      } else {
        if (statusEl) statusEl.textContent = `❌ Try again (${this.warmupAttempts}/${this.maxAttempts}). Listen and repeat.`;
        setTimeout(() => this.speakWord(), 1000);
      }
    }
  }

  // Calculate similarity between two strings
  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  // Levenshtein distance calculation
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

  // Mark current word as correctly practiced
  markWordCorrect() {
    const today = new Date().toDateString();
    const wordData = this.warmupWords[this.currentWord];
    
    if (wordData) {
      wordData.lastPracticed = today;
      
      // Add today to correct days if not already added
      if (!wordData.correctDays.includes(today)) {
        wordData.correctDays.push(today);
      }
      
      // Keep only last 5 days of correct practice
      if (wordData.correctDays.length > 5) {
        wordData.correctDays = wordData.correctDays.slice(-5);
      }
      
      // Check if word has been correct for 5 consecutive days
      if (this.isWordMastered(wordData)) {
        delete this.warmupWords[this.currentWord];
        console.log(`Word '${this.currentWord}' mastered and removed from warmup`);
      }
      
      this.saveWarmupData();
    }
  }

  // Check if word has been correctly practiced for 5 consecutive days
  isWordMastered(wordData) {
    if (wordData.correctDays.length < 5) return false;
    
    const today = new Date();
    const last5Days = [];
    
    for (let i = 4; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      last5Days.push(date.toDateString());
    }
    
    // Check if all last 5 days are in correctDays
    return last5Days.every(day => wordData.correctDays.includes(day));
  }

  // Skip current word
  skipWord() {
    const statusEl = document.getElementById('warmup-status');
    if (statusEl) statusEl.textContent = 'Skipped. Moving to next word...';
    setTimeout(() => this.nextWord(), 1000);
  }

  // Move to next word
  nextWord() {
    this.currentWarmupIndex++;
    this.startWordPractice();
  }

  // Finish warm-up session
  finishWarmup() {
    this.isWarmupActive = false;
    
    // Remove warm-up UI
    const overlay = document.getElementById('warmup-overlay');
    if (overlay) overlay.remove();
    
    // Call completion callback
    if (this.warmupCallback) {
      this.warmupCallback();
    }
  }

  // Check if warm-up is currently active
  isActive() {
    return this.isWarmupActive;
  }

  // Get warm-up statistics
  getStats() {
    const totalWords = Object.keys(this.warmupWords).length;
    const masteredWords = Object.keys(this.warmupWords).filter(word => 
      this.isWordMastered(this.warmupWords[word])
    ).length;
    
    return {
      totalWords,
      masteredWords,
      pendingWords: totalWords - masteredWords
    };
  }

  // Clean up
  cleanup() {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {}
    }
    
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    
    const overlay = document.getElementById('warmup-overlay');
    if (overlay) overlay.remove();
  }
}

export default WarmupHandler;