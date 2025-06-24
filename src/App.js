import React, { useEffect, useState } from "react";
import { Star, Trophy, BookOpen, Mic, Calendar, Zap, Award, Target, Play, Volume2 } from "lucide-react";
import ImageUpload from './image.js';
import ReadMyBook from './readbook.js';
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
          <h3>Reading Practice</h3>
          <select className="level-selector">
            <option>The Happy Cat (Level 1)</option>
            <option>Adventure Story (Level 2)</option>
            <option>Science Facts (Level 3)</option>
          </select>
        </div>
        <div className="preview-content">
          <div className="preview-text">
            <span className="highlight-word">The</span> cat sat on the mat. The cat was very happy. It liked to play with a ball. The ball was red and round.
          </div>
          <div className="preview-actions">
            <button className="start-reading-btn" onClick={() => setCurrentView('practice')}>
              <Play className="btn-icon" />
              Start Reading
            </button>
            <button className="listen-btn">
              <Volume2 className="btn-icon" />
              Listen
            </button>
          </div>
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

      <style jsx>{`
        .app {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 20px;
        }

        .dashboard {
          max-width: 1200px;
          margin: 0 auto;
          color: white;
        }

        /* Header Styles */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .user-welcome {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(45deg, #ff6b6b, #feca57);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .welcome-text h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }

        .welcome-text p {
          margin: 5px 0 0 0;
          opacity: 0.8;
          font-size: 14px;
        }

        .stats-summary {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .stat-icon {
          width: 24px;
          height: 24px;
          color: #feca57;
        }

        .streak-number {
          font-size: 32px;
          font-weight: bold;
          color: #feca57;
        }

        .streak-label {
          font-size: 12px;
          opacity: 0.8;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: transform 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-5px);
        }

        .card-icon {
          width: 32px;
          height: 32px;
          color: #feca57;
        }

        .stat-content h3 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
        }

        .stat-content p {
          margin: 5px 0 0 0;
          opacity: 0.8;
          font-size: 14px;
        }

        /* Activity Grid */
        .activity-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .activity-card {
          background: rgba(255, 255, 255, 0.95);
          color: #333;
          border-radius: 20px;
          padding: 25px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .activity-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        .reading-practice {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
        }

        .daily-challenge {
          background: linear-gradient(135deg, #48c6ef, #6f86d6);
          color: white;
        }

        .my-book {
          background: linear-gradient(135deg, #ff6b6b, #feca57);
          color: white;
        }

        .activity-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 15px;
        }

        .activity-icon {
          width: 28px;
          height: 28px;
        }

        .activity-header h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
        }

        .activity-card p {
          margin: 0 0 15px 0;
          opacity: 0.9;
          line-height: 1.5;
        }

        .activity-meta {
          display: flex;
          gap: 15px;
          font-size: 14px;
          opacity: 0.8;
        }

        /* Achievements */
        .achievements-section {
          margin-bottom: 30px;
        }

        .achievements-section h3 {
          margin-bottom: 20px;
          font-size: 22px;
          font-weight: 600;
        }

        .achievements-grid {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }

        .achievement-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          min-width: 120px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .achievement-icon {
          width: 40px;
          height: 40px;
          color: #feca57;
        }

        /* Practice Preview */
        .practice-preview {
          background: rgba(255, 255, 255, 0.95);
          color: #333;
          border-radius: 20px;
          padding: 25px;
          margin-bottom: 20px;
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .preview-header h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
        }

        .level-selector {
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid #ddd;
          background: white;
        }

        .preview-text {
          font-size: 18px;
          line-height: 1.6;
          margin-bottom: 20px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 12px;
        }

        .highlight-word {
          background: #fff3cd;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: bold;
        }

        .preview-actions {
          display: flex;
          gap: 15px;
        }

        .start-reading-btn, .listen-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .start-reading-btn {
          background: #28a745;
          color: white;
        }

        .listen-btn {
          background: #6c757d;
          color: white;
        }

        .btn-icon {
          width: 16px;
          height: 16px;
        }

        /* Practice View Styles */
        .practice-view {
          max-width: 800px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 20px;
          padding: 30px;
          color: #333;
        }

        .practice-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 20px;
        }

        .back-btn {
          background: #6c757d;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
        }

        .practice-header h2 {
          margin: 0;
          color: #333;
          text-align: center;
          flex: 1;
        }

        .mobile-instructions {
          text-align: center;
          margin-bottom: 15px;
          padding: 10px;
          background: #e8f5e8;
          border-radius: 8px;
          font-size: 14px;
        }

        .level-selector-container {
          text-align: center;
          margin-bottom: 20px;
        }

        .level-selector-container label {
          margin-right: 10px;
          font-weight: bold;
        }

        .level-selector-container select {
          padding: 8px 12px;
          font-size: 16px;
          border-radius: 6px;
          border: 1px solid #ddd;
        }

        .level-info {
          text-align: center;
          margin-bottom: 15px;
          font-weight: bold;
          color: #007bff;
        }

        .error-message {
          text-align: center;
          margin-bottom: 15px;
          padding: 10px;
          background: #ffe6e6;
          border-radius: 8px;
          color: #cc0000;
        }

        .words-container {
          text-align: center;
          margin-bottom: 20px;
          font-size: 24px;
          line-height: 1.5;
        }

        .word {
          display: inline-block;
          margin: 5px;
          padding: 8px 12px;
          border-radius: 6px;
          background: #f8f9fa;
          border: 2px solid #dee2e6;
          transition: all 0.3s ease;
        }

        .word.highlight {
          background: #fff3cd;
          border-color: #ffc107;
          transform: scale(1.1);
          font-weight: bold;
        }

        .word.correct {
          background: #d4edda;
          border-color: #28a745;
          color: #155724;
        }

        .word.wrong {
          background: #f8d7da;
          border-color: #dc3545;
          color: #721c24;
        }

        .score-display {
          text-align: center;
          margin-bottom: 20px;
          font-size: 18px;
          font-weight: bold;
          min-height: 25px;
        }

        .practice-controls {
          text-align: center;
        }

        .start-button {
          padding: 15px 30px;
          font-size: 18px;
          border: none;
          border-radius: 10px;
          background: #007bff;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .start-button.stop-btn {
          background: #dc3545;
        }

        .start-button:hover {
          opacity: 0.9;
        }

        .start-button:active {
          transform: scale(0.98);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .app {
            padding: 10px;
          }

          .header {
            flex-direction: column;
            gap: 20px;
            text-align: center;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .activity-grid {
            grid-template-columns: 1fr;
          }

          .achievements-grid {
            justify-content: center;
          }

          .preview-header {
            flex-direction: column;
            gap: 15px;
          }

          .preview-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

export default App;