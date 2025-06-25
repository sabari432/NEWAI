import React, { useEffect, useState } from "react";
import { Star, Trophy, BookOpen, Mic, Calendar, Zap, Award, Target, Play, Volume2 } from "lucide-react";
import ImageUpload from './image.js';
import ReadMyBook from './readbook.js';
import './App.css';
// Mock IncorrectWordHandler for demo
const IncorrectWordHandler = class {
  init(words, callback) {
    setTimeout(() => {
      console.log("Incorrect words:", words);
      callback();
    }, 1000);
  }
  cleanup() {}
};

function App() {
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
  }, [currentView]);

  const initializeSpeechRecognition = () => {
    const sentences = [
      "children play cricket in an empty ground after finishing homework",
      ,
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

   const initWords = () => {
  const words = sentences[speechState.sentenceIndex].split(" ");
  const results = Array(words.length).fill(null);
  let currentWordIndex = 0;
  
  // Mark words with 2 or fewer letters as correct and find first word > 2 letters
  words.forEach((word, index) => {
    if (word.length <= 2) {
      results[index] = "correct";
    }
  });
  
  // Find first word that needs to be spoken (length > 2 and not marked correct)
  currentWordIndex = words.findIndex((word, index) => word.length > 2 && results[index] === null);
  if (currentWordIndex === -1) {
    currentWordIndex = words.length; // All words are short, set to end
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
    
    // Auto-restart recognition if we're still in the middle of the exercise
    // and autoRestartEnabled is true (set when user clicks start)
    setSpeechState(prevState => {
      if (autoRestartEnabled && prevState.currentWordIndex < prevState.words.length && prevState.currentLevel !== 'L3') {
        // Small delay before restarting to avoid rapid restart loops
        setTimeout(() => {
          if (recognition && autoRestartEnabled) {
            try {
              recognition.start();
            } catch (e) {
              console.log("Recognition restart failed:", e);
            }
          }
        }, 100);
      }
      return { ...prevState, recognizing: autoRestartEnabled && prevState.currentWordIndex < prevState.words.length };
    });
  };

  recognition.onerror = (e) => {
    console.log("Recognition error:", e.error);
    setSpeechState(prev => ({
      ...prev,
      recognizing: false,
      errorMessage: `Error: ${e.error}. Please try again.`
    }));
    
    // Try to restart on certain errors (but not on no-speech or aborted)
    if (autoRestartEnabled && !['no-speech', 'aborted'].includes(e.error)) {
      setTimeout(() => {
        if (recognition && autoRestartEnabled) {
          try {
            recognition.start();
          } catch (error) {
            console.log("Error restart failed:", error);
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

 // Fixed validateWord function with proper Expert mode validation
const validateWord = (spoken) => {
  // Clear any existing timeout
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
      // Expert mode - validate each word individually in the spoken sentence
      const spokenWords = spoken.toLowerCase().trim().split(/\s+/);
      const targetWords = words.map(w => w.toLowerCase());
      
      // Mark each word as correct or wrong based on individual word matching
      words.forEach((word, index) => {
        if (word.length <= 2) {
          newResults[index] = "correct"; // Auto-correct short words
        } else {
          const wordLower = word.toLowerCase();
          // Check if this word appears in the spoken sentence
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
      // Regular mode (L1, L2) - word by word, ALWAYS move to next
      const expected = words[currentWordIndex].toLowerCase();
      const spokenLower = spoken.toLowerCase().trim();
      
      const matched = spokenLower.includes(expected) || expected.includes(spokenLower);
      newResults[currentWordIndex] = matched ? "correct" : "wrong";
      
      // ALWAYS move to next word regardless of correct/wrong
      let nextIndex = currentWordIndex + 1;
      while (nextIndex < words.length && words[nextIndex].length <= 2) {
        newResults[nextIndex] = "correct"; // Auto-mark short words
        nextIndex++;
      }
      newWordIndex = nextIndex;
      
      if (matched) {
        scoreMessage = `✅ Correct! "${expected}"`;
      } else {
        scoreMessage = `❌ Said "${spokenLower}", expected "${expected}"`;
      }
    }
    
    // Start timeout for next word if not finished (only for L1/L2)
    if (newWordIndex < words.length && currentLevel !== 'L3') {
      startWordTimeout(newWordIndex);
    }
    
    // Check if all words are completed
    if (newWordIndex >= words.length) {
      setTimeout(() => {
        recognition?.stop();
        const score = newResults.filter(r => r === "correct").length;
        setSpeechState(prev => ({
          ...prev,
          recognizing: false,
          score: `🎉 Final Score: ${score}/${words.length}`
        }));
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

const startWordTimeout = (wordIndex) => {
  wordTimeout = setTimeout(() => {
    setSpeechState(prevState => {
      const { words, results } = prevState;
      
      if (wordIndex >= words.length || wordIndex !== prevState.currentWordIndex) {
        return prevState; // Word already processed or finished
      }
      
      const newResults = [...results];
      newResults[wordIndex] = "wrong"; // Mark as wrong due to timeout
      
      // Move to next word
      let nextIndex = wordIndex + 1;
      while (nextIndex < words.length && words[nextIndex].length <= 2) {
        newResults[nextIndex] = "correct"; // Auto-mark short words
        nextIndex++;
      }
      
      // Start timeout for next word if not finished
      if (nextIndex < words.length) {
        startWordTimeout(nextIndex);
      }
      
      // Check if all words are completed
      if (nextIndex >= words.length) {
        setTimeout(() => {
          recognition?.stop();
          const score = newResults.filter(r => r === "correct").length;
          setSpeechState(prev => ({
            ...prev,
            recognizing: false,
            score: `🎉 Final Score: ${score}/${words.length}`
          }));
        }, 1000);
      }
      
      return {
        ...prevState,
        results: newResults,
        currentWordIndex: nextIndex,
        score: `⏰ Time's up! Expected "${words[wordIndex]}"`
      };
    });
  }, 5000); // 5 second timeout
};


   window.toggleRecognition = () => {
  if (speechState.recognizing) {
    recognition?.stop();
    autoRestartEnabled = false;
    setSpeechState(prev => ({ ...prev, recognizing: false }));
  } else {
    if (speechState.currentWordIndex === 0) {
      initWords();
    }
    autoRestartEnabled = true; // Enable auto-restart
    recognition?.start();
  }
};
    setupSpeechRecognition();
    initWords();
  };

  const DashboardView = () => (
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
        <div className="stat-card streak-card">
          <Calendar className="card-icon" />
          <div className="stat-content">
            <h3>{userStats.currentStreak} days</h3>
            <p>Current Streak</p>
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
  );

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
  />
);


  return (
    <div className="app">
      <div className="app">
  {currentView === 'imageupload' && <ImageUploadView />}
  {currentView === 'dashboard' && <DashboardView />}
  {currentView === 'practice' && <PracticeView />}
  {currentView === 'readbook' && <ReadBookView />}
</div>     
    </div>
  );
}

export default App;