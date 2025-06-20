// warmup.js - Module for daily word practice and tracking

class WarmupHandler {
  constructor() {
    this.warmupWords = this.loadWarmupWords();
    this.dailyAttempts = this.loadDailyAttempts();
    this.maxDailyAttempts = 2;
    this.requiredCorrectDays = 5;
  }

  // Load warmup words from localStorage
  loadWarmupWords() {
    try {
      const saved = localStorage.getItem('warmupWords');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Error loading warmup words:', error);
      return {};
    }
  }

  // Save warmup words to localStorage
  saveWarmupWords() {
    try {
      localStorage.setItem('warmupWords', JSON.stringify(this.warmupWords));
    } catch (error) {
      console.error('Error saving warmup words:', error);
    }
  }

  // Load daily attempts from localStorage
  loadDailyAttempts() {
    try {
      const saved = localStorage.getItem('dailyAttempts');
      const attempts = saved ? JSON.parse(saved) : {};
      
      // Reset attempts if it's a new day
      const today = this.getTodayString();
      if (!attempts[today]) {
        attempts[today] = 0;
      }
      
      return attempts;
    } catch (error) {
      console.error('Error loading daily attempts:', error);
      return { [this.getTodayString()]: 0 };
    }
  }

  // Save daily attempts to localStorage
  saveDailyAttempts() {
    try {
      localStorage.setItem('dailyAttempts', JSON.stringify(this.dailyAttempts));
    } catch (error) {
      console.error('Error saving daily attempts:', error);
    }
  }

  // Get today's date as string (YYYY-MM-DD)
  getTodayString() {
    return new Date().toISOString().split('T')[0];
  }

  // Add incorrect word to warmup list
  addIncorrectWord(word) {
    const today = this.getTodayString();
    const wordLower = word.toLowerCase();
    
    if (!this.warmupWords[wordLower]) {
      this.warmupWords[wordLower] = {
        word: word, // Keep original case
        addedDate: today,
        correctDays: [],
        totalAttempts: 0,
        correctAttempts: 0
      };
      
      console.log(`Added "${word}" to warmup list`);
      this.saveWarmupWords();
    }
  }

  // Check if user can practice today
  canPracticeToday() {
    const today = this.getTodayString();
    const todayAttempts = this.dailyAttempts[today] || 0;
    return todayAttempts < this.maxDailyAttempts;
  }

  // Get remaining attempts for today
  getRemainingAttempts() {
    const today = this.getTodayString();
    const todayAttempts = this.dailyAttempts[today] || 0;
    return Math.max(0, this.maxDailyAttempts - todayAttempts);
  }

  // Record practice attempt
  recordAttempt(word, isCorrect) {
    const today = this.getTodayString();
    const wordLower = word.toLowerCase();
    
    // Update daily attempts
    if (!this.dailyAttempts[today]) {
      this.dailyAttempts[today] = 0;
    }
    this.dailyAttempts[today]++;
    this.saveDailyAttempts();
    
    // Update word statistics
    if (this.warmupWords[wordLower]) {
      this.warmupWords[wordLower].totalAttempts++;
      
      if (isCorrect) {
        this.warmupWords[wordLower].correctAttempts++;
        
        // Add today to correct days if not already added
        if (!this.warmupWords[wordLower].correctDays.includes(today)) {
          this.warmupWords[wordLower].correctDays.push(today);
        }
        
        // Check if word should be removed (5 consecutive correct days)
        if (this.hasConsecutiveCorrectDays(wordLower)) {
          console.log(`"${word}" completed 5 consecutive correct days - removing from warmup`);
          delete this.warmupWords[wordLower];
        }
      }
      
      this.saveWarmupWords();
    }
  }

  // Check if word has 5 consecutive correct days
  hasConsecutiveCorrectDays(wordLower) {
    const wordData = this.warmupWords[wordLower];
    if (!wordData || wordData.correctDays.length < this.requiredCorrectDays) {
      return false;
    }
    
    // Sort dates
    const sortedDates = wordData.correctDays.sort();
    const today = this.getTodayString();
    
    // Check for consecutive days ending with today
    let consecutiveCount = 0;
    let checkDate = new Date(today);
    
    for (let i = 0; i < this.requiredCorrectDays; i++) {
      const dateString = checkDate.toISOString().split('T')[0];
      
      if (sortedDates.includes(dateString)) {
        consecutiveCount++;
      } else {
        break;
      }
      
      // Go back one day
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    return consecutiveCount >= this.requiredCorrectDays;
  }

  // Get all warmup words
  getWarmupWords() {
    return Object.keys(this.warmupWords).map(key => this.warmupWords[key].word);
  }

  // Get warmup word details
  getWarmupWordDetails(word) {
    const wordLower = word.toLowerCase();
    return this.warmupWords[wordLower] || null;
  }

  // Get warmup statistics
  getWarmupStats() {
    const words = Object.values(this.warmupWords);
    const today = this.getTodayString();
    
    return {
      totalWords: words.length,
      wordsNeedingPractice: words.length,
      todayAttempts: this.dailyAttempts[today] || 0,
      remainingAttempts: this.getRemainingAttempts(),
      canPractice: this.canPracticeToday()
    };
  }

  // Clear old daily attempts (keep only last 30 days)
  cleanupOldAttempts() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];
    
    Object.keys(this.dailyAttempts).forEach(date => {
      if (date < cutoffDate) {
        delete this.dailyAttempts[date];
      }
    });
    
    this.saveDailyAttempts();
  }

  // Clear all warmup data
  clearAllWarmupData() {
    this.warmupWords = {};
    this.dailyAttempts = { [this.getTodayString()]: 0 };
    this.saveWarmupWords();
    this.saveDailyAttempts();
    console.log('All warmup data cleared');
  }

  // Export warmup data for backup
  exportWarmupData() {
    return {
      warmupWords: this.warmupWords,
      dailyAttempts: this.dailyAttempts,
      exportDate: new Date().toISOString()
    };
  }

  // Import warmup data from backup
  importWarmupData(data) {
    try {
      if (data.warmupWords) {
        this.warmupWords = data.warmupWords;
        this.saveWarmupWords();
      }
      
      if (data.dailyAttempts) {
        this.dailyAttempts = data.dailyAttempts;
        this.saveDailyAttempts();
      }
      
      console.log('Warmup data imported successfully');
      return true;
    } catch (error) {
      console.error('Error importing warmup data:', error);
      return false;
    }
  }
}

// Export for module usage
export default WarmupHandler;