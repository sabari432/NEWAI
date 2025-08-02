import React, { useEffect, useState } from "react";
import { Star, Trophy, BookOpen, Mic, Calendar, Zap, Award, Target, Play, Volume2 } from "lucide-react";
import ImageUpload from './image.js';
import ReadMyBook from './readbook.js';
import Warmup from './warmup.js';
import IncorrectWordsHandler from './incorrect.js';
import DailyChallenge from './DailyChallenge';

import '../App.css';

function DashboardAdd() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [userInfo, setUserInfo] = useState({
    id: null,
    name: null,
    type: null
  });
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

  // Get user info from localStorage on component mount
  useEffect(() => {
    const studentId = localStorage.getItem('student_id');
    const studentName = localStorage.getItem('student_name');
    const teacherId = localStorage.getItem('teacher_id');
    const teacherName = localStorage.getItem('teacher_name');

    if (studentId) {
      setUserInfo({
        id: studentId,
        name: studentName || 'Student',
        type: 'student'
      });
      // Load user-specific stats from localStorage
      loadUserStats(studentId);
    } else if (teacherId) {
      setUserInfo({
        id: teacherId,
        name: teacherName || 'Teacher',
        type: 'teacher'
      });
      loadUserStats(teacherId);
    }
  }, []);

  // Load user-specific stats from localStorage
  const loadUserStats = (userId) => {
    const savedStats = localStorage.getItem(`userStats_${userId}`);
    if (savedStats) {
      try {
        const parsedStats = JSON.parse(savedStats);
        setUserStats(parsedStats);
      } catch (error) {
        console.error('Error loading user stats:', error);
      }
    }
  };

  // Save user stats to localStorage
  const saveUserStats = (stats) => {
    if (userInfo.id) {
      localStorage.setItem(`userStats_${userInfo.id}`, JSON.stringify(stats));
    }
  };

  // USER-SPECIFIC Cookie management functions for wrong words
  const saveWrongWordsToCookies = (wrongWords, source = 'practice') => {
    if (!userInfo.id) return;
    
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
            difficulty: 'medium'
          });
        } else {
          const existingWord = existingData.find(item => item.word.toLowerCase() === word.toLowerCase());
          if (existingWord) {
            existingWord.attempts += 1;
            existingWord.timestamp = timestamp;
            if (existingWord.attempts >= 3) {
              existingWord.difficulty = 'hard';
            } else if (existingWord.attempts >= 2) {
              existingWord.difficulty = 'medium';
            }
          }
        }
      });
      
      const sortedData = existingData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 50);
      
      // Use user-specific cookie name
      const cookieName = `wrongWords_${userInfo.id}`;
      document.cookie = `${cookieName}=${encodeURIComponent(JSON.stringify(sortedData))}; expires=${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString()}; path=/`;
      
      console.log('Wrong words saved to cookies for user:', userInfo.id, wrongWords);
    } catch (error) {
      console.error('Error saving wrong words to cookies:', error);
    }
  };

  const getWrongWordsFromCookies = () => {
    if (!userInfo.id) return [];
    
    try {
      const cookies = document.cookie.split(';');
      const cookieName = `wrongWords_${userInfo.id}`;
      const wrongWordsCookie = cookies.find(cookie => cookie.trim().startsWith(`${cookieName}=`));
      
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
    if (!userInfo.id) return;
    
    try {
      const existingData = getWrongWordsFromCookies();
      const updatedData = existingData.filter(item => item.word.toLowerCase() !== wordToRemove.toLowerCase());
      
      const cookieName = `wrongWords_${userInfo.id}`;
      document.cookie = `${cookieName}=${encodeURIComponent(JSON.stringify(updatedData))}; expires=${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString()}; path=/`;
      
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
    return () => {
      correctionHandler.cleanup();
    };
  }, [currentView]);

  const startCorrectionFlow = (wrongWords) => {
    if (wrongWords && wrongWords.length > 0) {
      saveWrongWordsToCookies(wrongWords, 'practice');
      
      correctionHandler.startCorrection(wrongWords, () => {
        console.log('Correction flow completed');
      });
    }
  };

 const initializeSpeechRecognition = async () => {
  let allSentences = []; // Store all sentences from S3
  let currentSentenceIndex = 0; // Track current sentence

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

  // Fetch all sentences from S3
  try {
    const response = await fetch("https://speakread.s3.ap-south-1.amazonaws.com/speakread.txt");
    const text = await response.text();
    // Split by newlines or periods to get individual sentences
    allSentences = text.split(/\n|\./).filter(sentence => sentence.trim().length > 0);
    
    // Initialize with first sentence
    initCurrentSentence();
  } catch (error) {
    console.error("Failed to fetch sentences from S3:", error);
  }

  const initCurrentSentence = () => {
    if (allSentences.length === 0) return;

    const currentSentence = allSentences[currentSentenceIndex];
    const words = currentSentence.split(" ");
    const results = Array(words.length).fill(null);
    let currentWordIndex = 0;

    // Find first word with length > 2
    currentWordIndex = words.findIndex(word => word.length > 2);
    if (currentWordIndex === -1) {
      currentWordIndex = 0;
    }

    setSpeechState(prev => ({
      ...prev,
      words,
      results,
      currentWordIndex,
      sentenceIndex: currentSentenceIndex,
      canValidate: false,
      score: '',
      recognizing: false
    }));
  };

  // Add function to go to next sentence
  window.goToNextSentence = () => {
    if (currentSentenceIndex < allSentences.length - 1) {
      currentSentenceIndex++;
      initCurrentSentence();
    } else {
      // All sentences completed
      setSpeechState(prev => ({
        ...prev,
        score: '🎉 All sentences completed! Great job!'
      }));
    }
  };

  // Add function to go to previous sentence
  window.goToPreviousSentence = () => {
    if (currentSentenceIndex > 0) {
      currentSentenceIndex--;
      initCurrentSentence();
    }
  };

  // Rest of your speech recognition code remains the same...
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
          setTimeout(() => {
            if (recognition && autoRestartEnabled) {
              try {
                recognition.start();
              } catch (e) {
                console.log("Recognition restart failed:", e);
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
      
      if (wordTimeout) {
        clearTimeout(wordTimeout);
        wordTimeout = null;
      }
      
      setSpeechState(prev => ({
        ...prev,
        recognizing: false,
        errorMessage: `Error: ${e.error}. Please try again.`
      }));
      
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
        
        newWordIndex = currentWordIndex + 1;
        
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
      
      // When sentence is completed
      if (newWordIndex >= words.length) {
        setTimeout(() => {
          recognition?.stop();
          const score = newResults.filter(r => r === "correct").length;
          const wrongWords = words.filter((word, index) => newResults[index] === "wrong");
          
          // Update user stats
          const newStats = {
            ...userStats,
            totalStars: userStats.totalStars + score,
            accuracy: Math.round((score / words.length) * 100),
            currentStreak: userStats.currentStreak + (score === words.length ? 1 : 0)
          };
          setUserStats(newStats);
          saveUserStats(newStats);
          
          setSpeechState(prev => ({
            ...prev,
            recognizing: false,
            score: `🎉 Sentence Complete! Score: ${score}/${words.length}`,
            canValidate: true // Enable next button
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
        
        let nextIndex = wordIndex + 1;
        
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
              score: `🎉 Sentence Complete! Score: ${score}/${words.length}`,
              canValidate: true
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
      if (speechState.currentWordIndex === 0) {
        initCurrentSentence();
      }
      autoRestartEnabled = true;
      
      if (recognition && recognition.state !== 'running') {
        try {
          recognition.start();
        } catch (error) {
          console.log("Recognition start failed:", error);
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
  // Don't auto-initialize - wait for user to start
};

  const getWrongWordsCount = () => {
    return getWrongWordsFromCookies().length;
  };

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
              <h2>Welcome back, {userInfo.name}! 👋</h2>
              <p>{userInfo.type === 'student' ? 'Student Dashboard' : 'Teacher Dashboard'}</p>
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
          
          <div className="activity-card daily-challenge" onClick={() => setCurrentView('dailychallenge')}>
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

        {/* User Info Debug (Remove in production) */}
        {userInfo.id && (
          <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
            <small>User ID: {userInfo.id} | Name: {userInfo.name} | Type: {userInfo.type}</small>
          </div>
        )}
      </div>
    );
  };

  const PracticeView = () => (
  <div className="practice-view">
    <div className="practice-header">
      <button className="back-btn" onClick={() => setCurrentView('dashboard')}>
        ← Back to Dashboard
      </button>
      <h2>👧👦 Kids Speech Buddy 🎤</h2>
    </div>

    <div className="sentence-info">
      <h3>Sentence {speechState.sentenceIndex + 1}</h3>
      <p>Read the sentence below and speak it clearly</p>
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
      
      {/* Navigation buttons */}
      <div className="sentence-navigation">
        <button 
          className="nav-button prev-btn"
          onClick={() => window.goToPreviousSentence && window.goToPreviousSentence()}
          disabled={speechState.sentenceIndex === 0}
        >
          ← Previous
        </button>
        
        <button 
          className="nav-button next-btn"
          onClick={() => window.goToNextSentence && window.goToNextSentence()}
          disabled={speechState.recognizing || speechState.currentWordIndex < speechState.words.length}
        >
          Next →
        </button>
      </div>
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
      onWrongWords={(wrongWords) => saveWrongWordsToCookies(wrongWords, 'book')}
    />
  );

  const WarmupView = () => (
    <Warmup 
      onBack={handleBackToDashboard}
      getWrongWords={getWrongWordsFromCookies}
      removeWord={removeWordFromCookies}
      saveWrongWords={(words) => saveWrongWordsToCookies(words, 'warmup')}
    />
  );
const DailyChallengeView = () => (
  <DailyChallenge 
    onBack={handleBackToDashboard}
    saveWrongWords={(words) => saveWrongWordsToCookies(words, 'dailychallenge')}
    setError={(error) => console.error('Daily Challenge Error:', error)}
    studentId={userInfo.id}
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
        {currentView === 'dailychallenge' && <DailyChallengeView />}
      </div>     
    </div>
  );
}

export default DashboardAdd;