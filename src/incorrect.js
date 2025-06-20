// incorrect.js - Complete Module for handling incorrect word retry functionality for kids

class IncorrectWordHandler {
  constructor() {
    this.incorrectWords = [];
    this.currentRetryIndex = 0;
    this.retryAttempts = 0;
    this.maxRetryAttempts = 2;
    this.isRetryMode = false;
    this.retryRecognition = null;
    this.onComplete = null;
    this.speechSynthesis = window.speechSynthesis;
    this.warmupWords = [];
    this.allWarmupWords = [];
    this.hasReadAllWords = false;
    this.awaitingSecondRepeat = false;

  }

  init(incorrectWords, onCompleteCallback) {
    this.incorrectWords = [...incorrectWords];
    this.currentRetryIndex = 0;
    this.retryAttempts = 0;
    this.isRetryMode = true;
    this.onComplete = onCompleteCallback;
    this.warmupWords = [];
    this.hasReadAllWords = false;
    this.loadWarmupWords();
    this.createRetryUI();
    this.showRetryPrompt();
  }

  loadWarmupWords() {
    try {
      const stored = JSON.parse(sessionStorage.getItem('warmupWords') || '[]');
      this.allWarmupWords = stored;
    } catch (e) {
      this.allWarmupWords = [];
    }
  }

  saveWarmupWords() {
    try {
      sessionStorage.setItem('warmupWords', JSON.stringify(this.allWarmupWords));
    } catch (e) {
      console.warn('Could not save warmup words to storage');
    }
  }

  addToWarmup(words) {
    words.forEach(word => {
      if (!this.allWarmupWords.includes(word)) {
        this.allWarmupWords.push(word);
      }
    });
    this.saveWarmupWords();
  }

  getAllWarmupWords() {
    return [...this.allWarmupWords];
  }

  clearAllWarmupWords() {
    this.allWarmupWords = [];
    this.saveWarmupWords();
  }

  createRetryUI() {
    if (document.getElementById('retryContainer')) {
      return;
    }

    const retryContainer = document.createElement('div');
    retryContainer.id = 'retryContainer';
    retryContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.9);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      backdrop-filter: blur(5px);
    `;

    const retryModal = document.createElement('div');
    retryModal.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 20px;
      text-align: center;
      max-width: 550px;
      width: 90%;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
      border: 2px solid rgba(255, 255, 255, 0.1);
    `;

    retryModal.innerHTML = `
      <h2 style="color: #fff; margin-bottom: 20px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">🌟 Let's Practice Together!</h2>
      <p style="font-size: 16px; margin-bottom: 20px; color: #e8f4fd;">
        Want to practice <strong style="color: #ffd700;">${this.incorrectWords.length}</strong> word(s) with me?
      </p>
      <div style="margin-bottom: 25px; background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px;">
        <strong style="color: #ffd700;">Words to practice:</strong><br>
        <span style="color: #ff6b6b; font-size: 18px; font-weight: bold;">${this.incorrectWords.join(', ')}</span>
      </div>
      <div id="initialButtons">
        <button id="retryYesBtn" style="
          background: linear-gradient(45deg, #28a745, #20c997);
          color: white;
          border: none;
          padding: 15px 30px;
          margin: 0 10px;
          border-radius: 25px;
          font-size: 16px;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(40, 167, 69, 0.4);
          transition: all 0.3s ease;
        ">✨ Yes, Let's Practice!</button>
        <button id="retryNoBtn" style="
          background: linear-gradient(45deg, #6c757d, #5a6268);
          color: white;
          border: none;
          padding: 15px 30px;
          margin: 0 10px;
          border-radius: 25px;
          font-size: 16px;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(108, 117, 125, 0.4);
          transition: all 0.3s ease;
        ">🚀 Maybe Later</button>
      </div>
      
      <div id="retryPracticeArea" style="display: none; margin-top: 30px;">
        <div id="retryWordDisplay" style="
          font-size: 36px;
          font-weight: bold;
          color: #ffd700;
          margin: 25px 0;
          padding: 20px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
          border: 2px solid rgba(255, 215, 0, 0.3);
        "></div>
        <div id="retryInstructions" style="
          font-size: 18px;
          margin: 20px 0;
          color: #e8f4fd;
        "></div>
        <div style="margin: 20px 0;">
          <button id="retryStartReadingBtn" style="
            background: linear-gradient(45deg, #17a2b8, #138496);
            color: white;
            border: none;
            padding: 12px 25px;
            margin: 0 10px;
            border-radius: 20px;
            font-size: 16px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(23, 162, 184, 0.4);
            transition: all 0.3s ease;
          ">🔊 Start Reading All Words</button>
          <button id="retryStartBtn" style="
            background: linear-gradient(45deg, #007bff, #0056b3);
            color: white;
            border: none;
            padding: 12px 25px;
            margin: 0 10px;
            border-radius: 20px;
            font-size: 16px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0, 123, 255, 0.4);
            transition: all 0.3s ease;
            display: none;
          ">🎤 Now You Say It</button>
          <button id="skipWordBtn" style="
            background: linear-gradient(45deg, #ffc107, #e0a800);
            color: white;
            border: none;
            padding: 12px 25px;
            margin: 0 10px;
            border-radius: 20px;
            font-size: 16px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(255, 193, 7, 0.4);
            transition: all 0.3s ease;
            display: none;
          ">⏭️ Skip This Word</button>
          <button id="repeatWordBtn" style="
  background: linear-gradient(45deg, #6f42c1, #563d7c);
  color: white;
  border: none;
  padding: 12px 25px;
  margin: 10px 10px 0 10px;
  border-radius: 20px;
  font-size: 16px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(111, 66, 193, 0.4);
  transition: all 0.3s ease;
  display: none;
">🔁 Repeat Word</button>

        </div>
        <div id="retryStatus" style="
          margin-top: 20px;
          font-size: 16px;
          font-weight: bold;
          min-height: 30px;
          padding: 10px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        "></div>
      </div>
    `;

    retryContainer.appendChild(retryModal);
    document.body.appendChild(retryContainer);
    this.addButtonHoverEffects();
    this.setupRetryEventListeners();
  }

  addButtonHoverEffects() {
    const buttons = document.querySelectorAll('#retryContainer button');
    buttons.forEach(button => {
      button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-2px) scale(1.05)';
      });
      button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0) scale(1)';
      });
    });
  }

  showRetryPrompt() {
    const retryContainer = document.getElementById('retryContainer');
    if (retryContainer) {
      retryContainer.style.display = 'flex';
    }
  }

  setupRetryEventListeners() {
    const yesBtn = document.getElementById('retryYesBtn');
    const noBtn = document.getElementById('retryNoBtn');
    const startReadingBtn = document.getElementById('retryStartReadingBtn');
    const startBtn = document.getElementById('retryStartBtn');
    const skipWordBtn = document.getElementById('skipWordBtn');
    const repeatWordBtn = document.getElementById('repeatWordBtn');
    
    
    if (repeatWordBtn) repeatWordBtn.onclick = () => this.repeatCurrentWord();
    if (yesBtn) yesBtn.onclick = () => this.startRetryPractice();
    if (noBtn) noBtn.onclick = () => this.skipRetry();
    if (startReadingBtn) startReadingBtn.onclick = () => this.startReadingAllWords();
    if (startBtn) startBtn.onclick = () => this.startRetryRecognition();
    if (skipWordBtn) skipWordBtn.onclick = () => this.skipCurrentWord();
  }

  startRetryPractice() {
  const practiceArea = document.getElementById('retryPracticeArea');
  const initialButtons = document.getElementById('initialButtons');
  
  if (initialButtons) initialButtons.style.display = 'none';
  if (practiceArea) practiceArea.style.display = 'block';

  // Immediately start with the first word
  this.currentRetryIndex = 0;
  this.retryAttempts = 0;
  this.showCurrentRetryWord();
}

  showReadingInstructions() {
    const wordDisplay = document.getElementById('retryWordDisplay');
    const instructions = document.getElementById('retryInstructions');
    const status = document.getElementById('retryStatus');

    if (wordDisplay) wordDisplay.textContent = "Ready to Listen?";
    if (instructions) {
      instructions.innerHTML = `
        <strong>I will read all ${this.incorrectWords.length} words once, then you repeat after me!</strong><br>
        Click the button when you're ready to hear all the words!
      `;
    }
    if (status) status.textContent = 'Click "Start Reading All Words" when ready! 😊';
  }

  async startReadingAllWords() {
    const status = document.getElementById('retryStatus');
    const startReadingBtn = document.getElementById('retryStartReadingBtn');
    
    if (startReadingBtn) startReadingBtn.style.display = 'none';
    
    if (status) status.textContent = '🔊 Listen carefully to all the words...';
    
    // Voice instruction first
    await this.speakText("I will read all the words once, then you repeat after me!");
    await this.delay(1000);
    
    // Read all words with pauses
    for (let i = 0; i < this.incorrectWords.length; i++) {
      const word = this.incorrectWords[i];
      const wordDisplay = document.getElementById('retryWordDisplay');
      
      if (wordDisplay) wordDisplay.textContent = word;
      if (status) status.innerHTML = `🔊 Word ${i + 1}: <span style="color: #ffd700;">"${word}"</span>`;
      
      await this.speakText(word);
      await this.delay(1500); // Pause between words
    }
    
    // After reading all words, start the practice
    this.hasReadAllWords = true;
    this.currentRetryIndex = 0;
    await this.speakText("Now you repeat each word after me!");
    this.showCurrentRetryWord();
  }

  async speakText(text) {
    return new Promise((resolve) => {
      if (!this.speechSynthesis) {
        resolve();
        return;
      }

      this.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      utterance.rate = 0.7;
      utterance.volume = 1;
      utterance.pitch = 1;
      
      const voices = this.speechSynthesis.getVoices();
      const englishVoice = voices.find(voice => 
        voice.lang.startsWith('en') && 
        (voice.name.includes('Google') || voice.name.includes('Microsoft'))
      ) || voices.find(voice => voice.lang.startsWith('en'));
      
      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      
      this.speechSynthesis.speak(utterance);
    });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async showCurrentRetryWord() {
  if (this.currentRetryIndex >= this.incorrectWords.length) {
    this.showFinalMessage();
    return;
  }

  const currentWord = this.incorrectWords[this.currentRetryIndex];
  const wordDisplay = document.getElementById('retryWordDisplay');
  const instructions = document.getElementById('retryInstructions');
  const status = document.getElementById('retryStatus');
  const startBtn = document.getElementById('retryStartBtn');
  const skipBtn = document.getElementById('skipWordBtn');
  const readingBtn = document.getElementById('retryStartReadingBtn');

  if (readingBtn) readingBtn.style.display = 'none'; // Hide "Start Reading All Words" button

  if (wordDisplay) wordDisplay.textContent = currentWord;
  if (instructions) {
    instructions.innerHTML = `
      <strong>Word ${this.currentRetryIndex + 1} of ${this.incorrectWords.length}</strong><br>
      Listen carefully and then say: <span style="color: #ffd700;">"${currentWord}"</span>
    `;
  }
  if (status) status.textContent = '🔊 Listening...';
  if (startBtn) startBtn.style.display = 'none';
  if (skipBtn) skipBtn.style.display = 'none';

  await this.speakText(currentWord);
  await this.delay(500);

  if (status) status.textContent = '🎤 Now it’s your turn to say it!';
  if (startBtn) startBtn.style.display = 'inline-block';
  if (skipBtn) skipBtn.style.display = 'inline-block';
  const repeatBtn = document.getElementById('repeatWordBtn');
  if (repeatBtn) repeatBtn.style.display = 'inline-block';

  this.retryAttempts = 0;
}


  // Super lenient word matching for kids - especially for short words
  isWordCorrect(spoken, expected) {
    const spokenClean = spoken.toLowerCase().trim();
    const expectedClean = expected.toLowerCase().trim();
    
    // Exact match
    if (spokenClean === expectedClean) return true;
    
    // For single letters and 2-letter words, be SUPER lenient
    if (expectedClean.length <= 2) {
      // If they said anything that contains the word, it's correct
      if (spokenClean.includes(expectedClean)) return true;
      if (expectedClean.includes(spokenClean)) return true;
      
      // Special cases for common kid pronunciations
      const kidFriendlyMap = {
        'a': ['ay', 'eh', 'aye', 'ah', 'hey'],
        'b': ['be', 'bee', 'bi', 'buh'],
        'c': ['see', 'sea', 'si', 'cuh'],
        'd': ['dee', 'di', 'duh'],
        'e': ['ee', 'eh', 'ay'],
        'f': ['ef', 'eff', 'fuh'],
        'g': ['gee', 'jee', 'guh'],
        'h': ['aych', 'ach', 'huh'],
        'i': ['eye', 'aye', 'ee', 'ih'],
        'j': ['jay', 'jey', 'juh'],
        'k': ['kay', 'key', 'kuh'],
        'l': ['el', 'ell', 'luh'],
        'm': ['em', 'muh'],
        'n': ['en', 'nuh'],
        'o': ['oh', 'owe', 'oo'],
        'p': ['pee', 'pe', 'puh'],
        'q': ['cue', 'queue', 'que', 'kuh'],
        'r': ['are', 'arr', 'ruh'],
        's': ['es', 'ess', 'suh'],
        't': ['tee', 'tea', 'tuh'],
        'u': ['you', 'yu', 'oo'],
        'v': ['vee', 've', 'vuh'],
        'w': ['double you', 'double u', 'wuh'],
        'x': ['ex', 'ecks', 'eks'],
        'y': ['why', 'wy', 'yuh'],
        'z': ['zee', 'zed', 'zuh'],
        // Common 2-letter words
        'am': ['em', 'im'],
        'an': ['en', 'un'],
        'as': ['es', 'az'],
        'at': ['et', 'it'],
        'be': ['bee', 'bi'],
        'by': ['buy', 'bye', 'bi'],
        'do': ['doo', 'du'],
        'go': ['goo', 'gu'],
        'he': ['hee', 'hi'],
        'if': ['iff', 'ef'],
        'in': ['en', 'un'],
        'is': ['iz', 'ez'],
        'it': ['et', 'ut'],
        'me': ['mee', 'mi'],
        'my': ['mai', 'mi'],
        'no': ['noo', 'nu'],
        'of': ['ov', 'uf'],
        'on': ['un', 'ahn'],
        'or': ['ore', 'ar'],
        'so': ['soo', 'su'],
        'to': ['too', 'tu', 'two'],
        'up': ['upp', 'oop'],
        'we': ['wee', 'wi']
      };
      
      // Check if it's a valid kid pronunciation
      if (kidFriendlyMap[expectedClean]) {
        for (const variant of kidFriendlyMap[expectedClean]) {
          if (spokenClean.includes(variant) || variant.includes(spokenClean)) {
            return true;
          }
        }
      }
      
      // If they said any single sound for a single letter, accept it
      if (expectedClean.length === 1 && spokenClean.length <= 3) {
        return true;
      }
    }
    
    // For 3-letter words, also be very lenient
    if (expectedClean.length === 3) {
      // If they got most of it right, accept it
      if (spokenClean.includes(expectedClean.substring(0, 2))) return true;
      if (spokenClean.includes(expectedClean.substring(1))) return true;
    }
    
    // Check if spoken words contain expected word
    const spokenWords = spokenClean.split(/\s+/);
    if (spokenWords.some(word => word.includes(expectedClean) || expectedClean.includes(word))) {
      return true;
    }
    
    // Super lenient similarity for kids - accept almost anything that sounds close
    const similarity = this.calculateSimilarity(spokenClean, expectedClean);
    const threshold = expectedClean.length <= 3 ? 0.3 : 0.4; // Extra lenient for short words
    
    console.log(`Kids word check: "${spokenClean}" vs "${expectedClean}", similarity: ${similarity}, threshold: ${threshold}`);
    
    return similarity >= threshold;
  }

 async startRetryRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    alert('Speech recognition not supported in this browser');
    return;
  }

  if (this.retryRecognition && this.retryRecognition.recognizing) {
    this.retryRecognition.stop();
    return;
  }

  this.retryRecognition = new SR();
  this.retryRecognition.lang = 'en-US';
  this.retryRecognition.continuous = false;
  this.retryRecognition.interimResults = false;
  this.retryRecognition.maxAlternatives = 3;

  const status = document.getElementById('retryStatus');
  const startBtn = document.getElementById('retryStartBtn');
  const currentWord = this.incorrectWords[this.currentRetryIndex];

  this.retryRecognition.onstart = () => {
    if (startBtn) {
      startBtn.textContent = '🛑 Stop';
      startBtn.style.background = 'linear-gradient(45deg, #dc3545, #c82333)';
    }
    if (status) {
      status.innerHTML = `🎤 Say: <span style="color: #ffd700;">"${currentWord}"</span>`;
    }
  };

  this.retryRecognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript.trim();
    const expected = currentWord;
    const isCorrect = this.isWordCorrect(transcript, expected);
    this.retryAttempts++;

    if (isCorrect) {
      if (!this.awaitingSecondRepeat) {
        this.awaitingSecondRepeat = true;
        if (status) {
          status.innerHTML = `✨ <span style="color: #28a745;">Great job!</span> <br>🔁 Can you say it one more time?`;
        }
        await this.speakText("Great job! Can you say it one more time?");
      } else {
        if (status) {
          status.innerHTML = `🎉 <span style="color: #28a745;">Awesome! Let's go to the next word!</span>`;
        }
        this.awaitingSecondRepeat = false;
        setTimeout(() => this.nextRetryWord(), 2000);
      }
    } else {
      if (this.retryAttempts >= this.maxRetryAttempts) {
        this.warmupWords.push(currentWord);
        if (status) {
          status.innerHTML = `<span style="color: #ffc107;">Good try!</span>`;
        }
        await this.speakText("That's okay! Let's try another word.");
        this.awaitingSecondRepeat = false;
        setTimeout(() => this.nextRetryWord(), 2000);
      } else {
        if (status) {
          status.innerHTML = `💪 <span style="color: #17a2b8;">Try again!</span>`;
        }
        await this.speakText("No worries! Try again.");
      }
    }

    this.resetRetryButton();
  };

  this.retryRecognition.onerror = () => {
    if (status) {
      status.innerHTML = `<span style="color: #17a2b8;">Let's try again!</span>`;
    }
    this.resetRetryButton();
  };

  this.retryRecognition.onend = () => {
    this.resetRetryButton();
  };

  try {
    this.retryRecognition.start();
  } catch (error) {
    if (status) {
      status.innerHTML = `<span style="color: #17a2b8;">Click the button to try again!</span>`;
    }
    this.resetRetryButton();
  }
}


  skipCurrentWord() {
    this.warmupWords.push(this.incorrectWords[this.currentRetryIndex]);
    const status = document.getElementById('retryStatus');
    if (status) {
      status.innerHTML = `⏭️ <span style="color: #ffc107;">That's okay! We'll practice this later.</span>`;
    }
    setTimeout(() => {
      this.nextRetryWord();
    }, 1500);
  }

  resetRetryButton() {
    const startBtn = document.getElementById('retryStartBtn');
    if (startBtn) {
      startBtn.textContent = '🎤 Now You Say It';
      startBtn.style.background = 'linear-gradient(45deg, #007bff, #0056b3)';
    }
  }

  async nextRetryWord() {
    this.currentRetryIndex++;
    
    if (this.currentRetryIndex < this.incorrectWords.length) {
      await this.speakText("OK, now let's move on to the next word");
      await this.delay(500);
    }
    
    this.showCurrentRetryWord();
  }

  async showFinalMessage() {
    // Add all attempted words to warmup
    if (this.warmupWords.length > 0) {
      this.addToWarmup(this.warmupWords);
    }
    
    // Show completion message
    const practiceArea = document.getElementById('retryPracticeArea');
    if (practiceArea) practiceArea.style.display = 'none';
    
    const retryContainer = document.getElementById('retryContainer');
    if (retryContainer) {
      const modal = retryContainer.querySelector('div');
      modal.innerHTML = `
        <h2 style="color: #fff; margin-bottom: 25px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">🌟 Wonderful Job!</h2>
        <p style="font-size: 18px; margin-bottom: 25px; line-height: 1.5; color: #e8f4fd;">
          Good that you tried to correct the wrong words!<br><br>
          <strong style="color: #ffd700;">I will add these words to your warm-up list and remind you for 3 days until you get comfortable with them!</strong>
        </p>
        ${this.warmupWords.length > 0 ? `
        <div style="background: rgba(255, 193, 7, 0.2); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
          <strong style="color: #ffd700;">Words added to warm-up:</strong><br>
          <span style="color: #ff6b6b; font-size: 16px;">${this.warmupWords.join(', ')}</span>
        </div>
        ` : ''}
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: linear-gradient(45deg, #28a745, #20c997);
          color: white;
          border: none;
          padding: 15px 30px;
          border-radius: 25px;
          font-size: 16px;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(40, 167, 69, 0.4);
          transition: all 0.3s ease;
        ">🚀 Continue Learning</button>
      `;
    }
    
    // Voice feedback for completion
    await this.speakText("Good that you tried to correct the wrong words! I will add those to the warm up list and remind you for 3 days till you get comfortable with those words.");
    
    setTimeout(() => {
      if (retryContainer) {
        retryContainer.remove();
      }
      if (this.onComplete) {
        this.onComplete();
      }
    }, 5000);
  }

  skipRetry() {
    const retryContainer = document.getElementById('retryContainer');
    if (retryContainer) {
      retryContainer.remove();
    }
    if (this.onComplete) {
      this.onComplete();
    }
  }

  calculateSimilarity(str1, str2) {
    if (str1 === str2) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0.0;

    const matchDistance = Math.floor(Math.max(str1.length, str2.length) / 2) - 1;
    const str1Matches = new Array(str1.length).fill(false);
    const str2Matches = new Array(str2.length).fill(false);

    let matches = 0;
    let transpositions = 0;

    for (let i = 0; i < str1.length; i++) {
      const start = Math.max(0, i - matchDistance);
      const end = Math.min(i + matchDistance + 1, str2.length);

      for (let j = start; j < end; j++) {
        if (str2Matches[j] || str1[i] !== str2[j]) continue;
        str1Matches[i] = true;
        str2Matches[j] = true;
        matches++;
        break;
      }
    }

    if (matches === 0) return 0.0;

    let k = 0;
    for (let i = 0; i < str1.length; i++) {
      if (!str1Matches[i]) continue;
      while (!str2Matches[k]) k++;
      if (str1[i] !== str2[k]) transpositions++;
      k++;
    }

    const jaro = (matches / str1.length + matches / str2.length + (matches - transpositions / 2) / matches) / 3;

    let prefix = 0;
    for (let i = 0; i < Math.min(str1.length, str2.length, 4); i++) {
      if (str1[i] === str2[i]) prefix++;
      else break;
    }

    return jaro + (0.1 * prefix * (1 - jaro));
  }

  cleanup() {
    if (this.retryRecognition) {
      try {
        this.retryRecognition.abort();
      } catch (e) {}
    }
    
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
    }
    
    const retryContainer = document.getElementById('retryContainer');
    if (retryContainer) {
      retryContainer.remove();
    }
    
    this.isRetryMode = false;
  }
  repeatCurrentWord() {
  const currentWord = this.incorrectWords[this.currentRetryIndex];
  const status = document.getElementById('retryStatus');

  if (status) {
    status.textContent = `🔁 Repeating: "${currentWord}"`;
  }

  this.speakText(currentWord);
}

}

export default IncorrectWordHandler;