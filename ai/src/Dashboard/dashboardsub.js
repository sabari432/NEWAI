import React, { useEffect, useState } from "react";
import { Star, Trophy, BookOpen, Mic, Calendar, Zap, Award, Target, Play, Volume2 } from "lucide-react";
import ImageUpload from './image.js';
import ReadMyBook from './readbook.js';
import Warmup from './warmup.js';
import IncorrectWordsHandler from './incorrect.js'; // Import the correction handler
import '../App.css';

function DashboardAdd() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [userStats, setUserStats] = useState({
    level: 2,
    totalStars: 45,
    currentStreak: 5,
    accuracy: 85,
    totalDays: 12
  });

  // Speech recognition state
  const [speechState, setSpeechState] = useState({
    currentLevel: 'L1',
    sentenceIndex: 0,
    words: [],
    currentWordIndex: 0,
    results: [],
    recognizing: false,
    canValidate: false,
    score: '',
    errorMessage: ''
  });

const [bookText, setBookText] = useState('');
const [extractedText, setExtractedText] = useState('');

// Initialize correction handler
const [correctionHandler] = useState(() => new IncorrectWordsHandler());

// NEW: Cookie management functions for wrong words
const saveWrongWordsToCookies = (wrongWords, source = 'practice') => {
  try {
    const existingData = getWrongWordsFromCookies();
    const timestamp = new Date().toISOString();
    
    wrongWords.forEach(word => {
      if (!existingData.some(item => item.word.toLowerCase() === word.toLowerCase())) {
        existingData.push({
          word: word,
          timestamp: timestamp,
          source: source,
          attempts: 1,
          difficulty: 'medium' // Can be 'easy', 'medium', 'hard'
        });
      } else {
        // Update existing word attempts
        const existingWord = existingData.find(item => item.word.toLowerCase() === word.toLowerCase());
        if (existingWord) {
          existingWord.attempts += 1;
          existingWord.timestamp = timestamp;
          // Increase difficulty based on attempts
          if (existingWord.attempts >= 3) {
            existingWord.difficulty = 'hard';
          } else if (existingWord.attempts >= 2) {
            existingWord.difficulty = 'medium';
          }
        }
      }
    });
    
    // Keep only the last 50 wrong words to prevent cookie overflow
    const sortedData = existingData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 50);
    
    document.cookie = `wrongWords=${encodeURIComponent(JSON.stringify(sortedData))}; expires=${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString()}; path=/`;
    
    console.log('Wrong words saved to cookies:', wrongWords);
  } catch (error) {
    console.error('Error saving wrong words to cookies:', error);
  }
};

const getWrongWordsFromCookies = () => {
  try {
    const cookies = document.cookie.split(';');
    const wrongWordsCookie = cookies.find(cookie => cookie.trim().startsWith('wrongWords='));
    
    if (wrongWordsCookie) {
      const cookieValue = wrongWordsCookie.split('=')[1];
      return JSON.parse(decodeURIComponent(cookieValue));
    }
    return [];
  } catch (error) {
    console.error('Error reading wrong words from cookies:', error);
    return [];
  }
};

const removeWordFromCookies = (wordToRemove) => {
  try {
    const existingData = getWrongWordsFromCookies();
    const updatedData = existingData.filter(item => item.word.toLowerCase() !== wordToRemove.toLowerCase());
    
    document.cookie = `wrongWords=${encodeURIComponent(JSON.stringify(updatedData))}; expires=${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString()}; path=/`;
    
    console.log('Word removed from practice list:', wordToRemove);
  } catch (error) {
    console.error('Error removing word from cookies:', error);
  }
};

// Add this function to handle text extraction from ImageUpload
const handleTextExtracted = (text) => {
  setExtractedText(text);
  setBookText(text);
  setCurrentView('readbook');
};

// Add this function to handle back navigation
const handleBackToImageUpload = () => {
  setCurrentView('imageupload');
};

const handleBackToDashboard = () => {
  setCurrentView('dashboard');
};

  useEffect(() => {
    if (currentView === 'practice') {
      initializeSpeechRecognition();
    }
    // Cleanup correction handler on unmount
    return () => {
      correctionHandler.cleanup();
    };
  }, [currentView]);

  // Modified function to start correction flow
  const startCorrectionFlow = (wrongWords) => {
    if (wrongWords && wrongWords.length > 0) {
      // NEW: Save wrong words to cookies before starting correction
      saveWrongWordsToCookies(wrongWords, 'practice');
      
      correctionHandler.startCorrection(wrongWords, () => {
        // Callback after correction is complete
        console.log('Correction flow completed');
        // You can add any additional logic here after correction
      });
    }
  };

  const initializeSpeechRecognition = () => {
    const sentences = [
      "children play cricket in an empty ground after finishing homework",
    ];

    const levels = {
      L1: { name: "Beginner", delay: 500, nextWordDelay: 80 },
      L2: { name: "Advance", delay: 300, nextWordDelay: 10 },
      L3: { name: "Expert", delay: 300, nextWordDelay: 1, fullSentence: true }
    };

    let recognition = null;
    let autoRestartEnabled = false;
    let canValidate = false;
    let wordTimeout = null;
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

 // Modified initWords function - Remove the auto-marking of 2-letter words
const initWords = () => {
  const words = sentences[speechState.sentenceIndex].split(" ");
  const results = Array(words.length).fill(null); // Don't pre-mark any words
  let currentWordIndex = 0;
  
  // Find first word that needs to be spoken (length > 2)
  currentWordIndex = words.findIndex(word => word.length > 2);
  if (currentWordIndex === -1) {
    currentWordIndex = 0; // If no words > 2 letters, start from beginning
  }
  
  setSpeechState(prev => ({
    ...prev,
    words,
    results,
    currentWordIndex
  }));
};

const setupSpeechRecognition = () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    setSpeechState(prev => ({
      ...prev,
      errorMessage: "Speech recognition not supported in this browser."
    }));
    return;
  }

  recognition = new SR();
  recognition.lang = "en-US";
  recognition.continuous = true;
  recognition.interimResults = false;

  recognition.onstart = () => {
    setSpeechState(prev => ({
      ...prev,
      recognizing: true,
      errorMessage: ''
    }));
    setTimeout(() => {
      canValidate = true;
      // Start timeout for first word (only for non-expert modes)
      setSpeechState(prevState => {
        if (prevState.currentLevel !== 'L3' && prevState.currentWordIndex < prevState.words.length) {
          startWordTimeout(prevState.currentWordIndex);
        }
        return prevState;
      });
    }, levels[speechState.currentLevel].delay);
  };

  recognition.onstop = () => {
    if (wordTimeout) {
      clearTimeout(wordTimeout);
      wordTimeout = null;
    }
  };
recognition.onend = () => {
  if (wordTimeout) {
    clearTimeout(wordTimeout);
    wordTimeout = null;
  }
  
  setSpeechState(prevState => {
    const shouldContinue = autoRestartEnabled && 
                          prevState.currentWordIndex < prevState.words.length && 
                          prevState.currentLevel !== 'L3';
    
    if (shouldContinue) {
      // Small delay before restarting to avoid rapid restart loops
      setTimeout(() => {
        if (recognition && autoRestartEnabled) {
          try {
            recognition.start();
          } catch (e) {
            console.log("Recognition restart failed:", e);
            // Reset recognizing state if restart fails
            setSpeechState(prev => ({ ...prev, recognizing: false }));
          }
        }
      }, 100);
    }
    
    return { 
      ...prevState, 
      recognizing: shouldContinue 
    };
  });
};


  recognition.onerror = (e) => {
  console.log("Recognition error:", e.error);
  
  // Clear any existing timeout
  if (wordTimeout) {
    clearTimeout(wordTimeout);
    wordTimeout = null;
  }
  
  setSpeechState(prev => ({
    ...prev,
    recognizing: false,
    errorMessage: `Error: ${e.error}. Please try again.`
  }));
  
  // Try to restart on certain errors (but not on no-speech or aborted)
  if (autoRestartEnabled && !['no-speech', 'aborted', 'not-allowed'].includes(e.error)) {
    setTimeout(() => {
      if (recognition && autoRestartEnabled) {
        try {
          recognition.start();
          setSpeechState(prev => ({ ...prev, recognizing: true, errorMessage: '' }));
        } catch (error) {
          console.log("Error restart failed:", error);
          setSpeechState(prev => ({ ...prev, recognizing: false }));
        }
      }
    }, 500);
  }
};
  recognition.onresult = (e) => {
    if (!canValidate) return;
    
    let finalTranscript = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) {
        finalTranscript += e.results[i][0].transcript + " ";
      }
    }
    
    if (finalTranscript.trim()) {
      validateWord(finalTranscript.trim());
    }
  };
};

 // Modified validateWord function with enhanced wrong word storage
const validateWord = (spoken) => {
  if (wordTimeout) {
    clearTimeout(wordTimeout);
    wordTimeout = null;
  }
  
  setSpeechState(prevState => {
    const { words, currentWordIndex, results, currentLevel } = prevState;
    
    if (currentWordIndex >= words.length) return prevState;
    
    const newResults = [...results];
    let newWordIndex = currentWordIndex;
    let scoreMessage = "";
    
    if (currentLevel === 'L3') {
      const spokenWords = spoken.toLowerCase().trim().split(/\s+/);
      const targetWords = words.map(w => w.toLowerCase());
      
      words.forEach((word, index) => {
        if (word.length <= 2) {
          newResults[index] = "correct";
        } else {
          const wordLower = word.toLowerCase();
          const foundInSpoken = spokenWords.some(spokenWord => 
            spokenWord.includes(wordLower) || wordLower.includes(spokenWord)
          );
          newResults[index] = foundInSpoken ? "correct" : "wrong";
        }
      });
      
      newWordIndex = words.length;
      
      const correctCount = newResults.filter(r => r === "correct").length;
      const totalWords = words.length;
      const accuracy = Math.round((correctCount / totalWords) * 100);
      
      if (accuracy >= 70) {
        scoreMessage = `🎉 Great! ${correctCount}/${totalWords} words correct (${accuracy}%)`;
      } else {
        scoreMessage = `❌ ${correctCount}/${totalWords} words correct (${accuracy}%). Try again!`;
      }
      
    } else {
      const expected = words[currentWordIndex].toLowerCase();
      const spokenLower = spoken.toLowerCase().trim();
      
      const matched = spokenLower.includes(expected) || expected.includes(spokenLower);
      newResults[currentWordIndex] = matched ? "correct" : "wrong";
      
      if (!matched) {
        saveWrongWordsToCookies([words[currentWordIndex]], 'practice');
      }
      
      // Move to next word and auto-mark 2-letter words
      newWordIndex = currentWordIndex + 1;
      
      // AUTO-MARK 2-LETTER WORDS AND SKIP THEM
      while (newWordIndex < words.length && words[newWordIndex].length <= 2) {
        newResults[newWordIndex] = "correct";
        newWordIndex++;
      }
      
      if (matched) {
        scoreMessage = `✅ Correct! "${expected}"`;
      } else {
        scoreMessage = `❌ Said "${spokenLower}", expected "${expected}"`;
      }
    }
    
    if (newWordIndex < words.length && currentLevel !== 'L3') {
      startWordTimeout(newWordIndex);
    }
    
    if (newWordIndex >= words.length) {
      setTimeout(() => {
        recognition?.stop();
        const score = newResults.filter(r => r === "correct").length;
        const wrongWords = words.filter((word, index) => newResults[index] === "wrong");
        
        setSpeechState(prev => ({
          ...prev,
          recognizing: false,
          score: `🎉 Final Score: ${score}/${words.length}`
        }));
        
        if (wrongWords.length > 0) {
          saveWrongWordsToCookies(wrongWords, 'practice');
          
          setTimeout(() => {
            startCorrectionFlow(wrongWords);
          }, 2000);
        }
      }, 1000);
    }
    
    return {
      ...prevState,
      results: newResults,
      currentWordIndex: newWordIndex,
      score: scoreMessage
    };
  });
};

// Modified startWordTimeout function - Add auto-skip logic for 2-letter words
const startWordTimeout = (wordIndex) => {
  wordTimeout = setTimeout(() => {
    setSpeechState(prevState => {
      const { words, results } = prevState;
      
      if (wordIndex >= words.length || wordIndex !== prevState.currentWordIndex) {
        return prevState;
      }
      
      const newResults = [...results];
      newResults[wordIndex] = "wrong";
      
      saveWrongWordsToCookies([words[wordIndex]], 'timeout');
      
      // Move to next word and auto-mark 2-letter words
      let nextIndex = wordIndex + 1;
      
      // AUTO-MARK 2-LETTER WORDS AND SKIP THEM
      while (nextIndex < words.length && words[nextIndex].length <= 2) {
        newResults[nextIndex] = "correct";
        nextIndex++;
      }
      
      if (nextIndex < words.length) {
        startWordTimeout(nextIndex);
      }
      
      if (nextIndex >= words.length) {
        setTimeout(() => {
          recognition?.stop();
          const score = newResults.filter(r => r === "correct").length;
          const wrongWords = words.filter((word, index) => newResults[index] === "wrong");
          
          setSpeechState(prev => ({
            ...prev,
            recognizing: false,
            score: `🎉 Final Score: ${score}/${words.length}`
          }));
          
          if (wrongWords.length > 0) {
            saveWrongWordsToCookies(wrongWords, 'timeout');
            
            setTimeout(() => {
              startCorrectionFlow(wrongWords);
            }, 2000);
          }
        }, 1000);
      }
      
      return {
        ...prevState,
        results: newResults,
        currentWordIndex: nextIndex,
        score: `⏰ Time's up! Expected "${words[wordIndex]}"`
      };
    });
  }, 5000);
};
window.toggleRecognition = () => {
  if (speechState.recognizing) {
    // Stop recognition
    autoRestartEnabled = false;
    if (recognition) {
      recognition.stop();
    }
    if (wordTimeout) {
      clearTimeout(wordTimeout);
      wordTimeout = null;
    }
    setSpeechState(prev => ({ ...prev, recognizing: false }));
  } else {
    // Start recognition
    if (speechState.currentWordIndex === 0) {
      initWords();
    }
    autoRestartEnabled = true;
    
    // Check if recognition is already running before starting
    if (recognition && recognition.state !== 'running') {
      try {
        recognition.start();
      } catch (error) {
        console.log("Recognition start failed:", error);
        // If start fails, try to create a new recognition instance
        setupSpeechRecognition();
        setTimeout(() => {
          if (recognition) {
            recognition.start();
          }
        }, 100);
      }
    } else if (!recognition) {
      setupSpeechRecognition();
      setTimeout(() => {
        if (recognition) {
          recognition.start();
        }
      }, 100);
    }
  }
};
    setupSpeechRecognition();
    initWords();
  };

  // NEW: Function to get wrong words count for dashboard display
  const getWrongWordsCount = () => {
    return getWrongWordsFromCookies().length;
  };

  // Rest of your component code remains the same...
  const DashboardView = () => {
    const wrongWordsCount = getWrongWordsCount();
    
    return (
    <div className="dashboard">
      {/* Header */}
      <div className="header">
        <div className="user-welcome">
          <div className="avatar">
            <span>👧</span>
          </div>
          <div className="welcome-text">
            <h2>Welcome back, Emma Wilson! 👋</h2>
            <p>3rd Grade • Sunshine Elementary</p>
          </div>
        </div>
        <div className="stats-summary">
          <div className="stat-item">
            <Star className="stat-icon" />
            <span>{userStats.totalStars}</span>
          </div>
          <div className="stat-item">
            <span className="streak-number">{userStats.currentStreak}</span>
            <span className="streak-label">Total Stars - Day Streak</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card level-card">
          <BookOpen className="card-icon" />
          <div className="stat-content">
            <h3>Level {userStats.level}</h3>
            <p>Reading Level</p>
          </div>
        </div>
       <div className="activity-card warmup-practice" onClick={() => setCurrentView('warmup')}>
  <div className="activity-header">
    <Zap className="activity-icon warmup-icon" />
    <h3>Warmup Practice</h3>
    {wrongWordsCount > 0 && <span className="word-count-badge">{wrongWordsCount}</span>}
  </div>
  <p>Practice words you found difficult in previous sessions.</p>
  <div className="activity-meta">
    <span>Quick Review</span>
    <span>{wrongWordsCount > 0 ? `${wrongWordsCount} words to practice` : 'Build Confidence'}</span>
  </div>
</div>
        <div className="stat-card stars-card">
          <Star className="card-icon" />
          <div className="stat-content">
            <h3>{userStats.totalStars}</h3>
            <p>Total Stars</p>
          </div>
        </div>
        <div className="stat-card accuracy-card">
          <Target className="card-icon" />
          <div className="stat-content">
            <h3>{userStats.accuracy}%</h3>
            <p>Accuracy</p>
          </div>
        </div>
      </div>

      {/* Activity Cards */}
      <div className="activity-grid">
        <div className="activity-card reading-practice" onClick={() => setCurrentView('practice')}>
          <div className="activity-header">
            <Mic className="activity-icon" />
            <h3>Reading Practice</h3>
          </div>
          <p>Practice reading with speech recognition and get instant feedback.</p>
          <div className="activity-meta">
            <span>Level {userStats.level}</span>
            <span>~5 min</span>
          </div>
        </div>
        
        <div className="activity-card daily-challenge">
          <div className="activity-header">
            <Zap className="activity-icon daily-icon" />
            <h3>Daily Challenge</h3>
          </div>
          <p>Complete today's reading challenge and earn bonus stars.</p>
          <div className="activity-meta">
            <span>5 min</span>
            <span>+10 Stars</span>
          </div>
        </div>
        
       <div className="activity-card my-book" onClick={() => setCurrentView('imageupload')}>
  <div className="activity-header">
    <BookOpen className="activity-icon book-icon" />
    <h3>Read My Book</h3>
  </div>
  <p>Upload a photo of any book and practice reading it aloud.</p>
  <div className="activity-meta">
    <span>OCR Powered</span>
    <span>Any Book</span>
  </div>
</div>

      </div>

      {/* Recent Achievements */}
      <div className="achievements-section">
        <h3>Recent Achievements 🏆</h3>
        <div className="achievements-grid">
          <div className="achievement-card">
            <Trophy className="achievement-icon first-read" />
            <span>First Read</span>
          </div>
          <div className="achievement-card">
            <Zap className="achievement-icon speed-reader" />
            <span>Speed Reader</span>
          </div>
          <div className="achievement-card">
            <Award className="achievement-icon next-badge" />
            <span>Next Badge</span>
          </div>
        </div>
      </div>

      {/* Reading Practice Preview */}
      <div className="practice-preview">
        <div className="preview-header">
         
          
        </div>
      </div>
    </div>
  )};

  const PracticeView = () => (
    <div className="practice-view">
      <div className="practice-header">
        <button className="back-btn" onClick={() => setCurrentView('dashboard')}>
          ← Back to Dashboard
        </button>
        <h2>👧👦 Kids Speech Buddy 🎤</h2>
      </div>

      <div className="mobile-instructions">
        📱 <strong>Mobile Users:</strong> Click "Start" once - speak all words continuously!
      </div>
      
      <div className="level-selector-container">
        <label htmlFor="levelSelect">Choose Level:</label>
        <select 
          id="levelSelect" 
          value={speechState.currentLevel}
          onChange={(e) => setSpeechState(prev => ({ ...prev, currentLevel: e.target.value }))}
        >
          <option value="L1">Beginner (0.5s per word)</option>
          <option value="L2">Advance (0.3s per word)</option>
          <option value="L3">Expert (Full Sentence)</option>
        </select>
      </div>
      
      <div className="level-info">
        Level: {speechState.currentLevel === 'L1' ? 'Beginner (0.5s per word)' : 
                speechState.currentLevel === 'L2' ? 'Advance (0.3s per word)' : 
                'Expert (Full Sentence)'}
      </div>
      
      {speechState.errorMessage && (
        <div className="error-message">
          {speechState.errorMessage}
        </div>
      )}
      
      <div className="words-container">
        {speechState.words.map((word, i) => (
          <span
            key={i}
            className={`word ${
              speechState.results[i] === "correct" ? "correct" :
              speechState.results[i] === "wrong" ? "wrong" :
              i === speechState.currentWordIndex ? "highlight" : ""
            }`}
          >
            {word}
          </span>
        ))}
      </div>
      
      <div className="score-display">
        {speechState.score}
      </div>
      
      <div className="practice-controls">
        <button 
          className={`start-button ${speechState.recognizing ? 'stop-btn' : ''}`}
          onClick={() => window.toggleRecognition && window.toggleRecognition()}
        >
          {speechState.recognizing ? '🛑 Stop' : '🎤 Start'}
        </button>
      </div>
    </div>
  );

const ImageUploadView = () => (
  <ImageUpload 
    onTextExtracted={handleTextExtracted}
    onBack={handleBackToDashboard}
  />
);

const ReadBookView = () => (
  <ReadMyBook 
    bookText={bookText}
    onBack={handleBackToImageUpload}
    // NEW: Pass wrong word saving function to ReadMyBook
    onWrongWords={(wrongWords) => saveWrongWordsToCookies(wrongWords, 'book')}
  />
);

const WarmupView = () => (
  <Warmup 
    onBack={handleBackToDashboard}
    // NEW: Pass cookie functions to Warmup component
    getWrongWords={getWrongWordsFromCookies}
    removeWord={removeWordFromCookies}
    saveWrongWords={(words) => saveWrongWordsToCookies(words, 'warmup')}
  />
);

  return (
    <div className="app">
      <div className="app">
  {currentView === 'imageupload' && <ImageUploadView />}
  {currentView === 'dashboard' && <DashboardView />}
  {currentView === 'practice' && <PracticeView />}
  {currentView === 'readbook' && <ReadBookView />}
  {currentView === 'warmup' && <WarmupView />}

</div>     

</div>
  );
}

export default DashboardAdd;