import React, { useEffect, useState } from "react";
import { Star, Trophy, BookOpen, Mic, Calendar, Zap, Award, Target, Play, Volume2 } from "lucide-react";
import ImageUpload from './image.js';
import ReadMyBook from './readbook.js';
import Warmup from './warmup.js';
import IncorrectWordsHandler from './incorrect.js';
import DailyChallenge from './DailyChallenge.js'; // ADD THIS IMPORT
import '../App.css';

// Sentence bank - you can expand this or load from external file
const SENTENCE_BANK = [
  "children play cricket in an empty ground after finishing homework",
  "the cat sat on the mat and watched the birds fly away",
  "mother baked cookies for the school picnic tomorrow afternoon",
  "students read books quietly in the library every morning",
  "the dog ran across the park to fetch the red ball",
  "flowers bloom beautifully in the garden during spring season",
  "father drives the car carefully through the busy city streets",
  "birds sing sweet songs from the tall trees at dawn",
  "the teacher explained the lesson clearly to all students",
  "grandmother tells wonderful stories before bedtime every night",
  "friends played together happily in the playground after school",
  "the sun shines brightly on the green grass fields",
  "children learn new words from their favorite picture books",
  "the butterfly landed gently on the colorful garden flowers",
  "mother cooked delicious food for the family dinner tonight"
];

// Cookie helper functions
const getCookie = (name) => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
};

const setCookie = (name, value, days = 7) => {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
};

function DashboardAdd() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentStudent, setCurrentStudent] = useState(null);
  const [errorMessage, setErrorMessage] = useState(''); // Add error state
  const [userStats, setUserStats] = useState({
    level: 1,
    totalStars: 0,
    currentStreak: 0,
    accuracy: 0,
    totalDays: 0
  });

  // Add error handler function
  const handleError = (message) => {
    setErrorMessage(message);
    // Optionally, clear the error after a few seconds
    setTimeout(() => setErrorMessage(''), 5000);
  };

  const DailyChallengeView = () => (
    <DailyChallenge 
      onBack={handleBackToDashboard}
      saveWrongWords={(words) => saveWrongWordsToCookies(words, 'daily')}
      apiRequest={async (endpoint, options = {}) => {
        // Mock API request function - replace with your actual API call
        try {
          const response = await fetch(`/api/${endpoint}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            ...options
          });
          return await response.json();
        } catch (error) {
          throw new Error(`API request failed: ${error.message}`);
        }
      }}
      setError={handleError} // Pass the error handler
    />
  );

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
  const [correctionHandler] = useState(() => new IncorrectWordsHandler());

  // Load student data on component mount
  useEffect(() => {
    const loadStudentData = () => {
      try {
        const studentData = getCookie('selectedStudent');
        if (studentData) {
          const student = JSON.parse(studentData);
          setCurrentStudent(student);
          
          // Set user stats from student data
          setUserStats({
            level: extractLevel(student.level) || 1,
            totalStars: student.stars || 0,
            currentStreak: student.dayStreak || 0,
            accuracy: student.accuracy || 0,
            totalDays: student.totalDays || 0
          });
        }
      } catch (error) {
        console.error('Error loading student data:', error);
        handleError('Failed to load student data');
      }
    };

    loadStudentData();
  }, []);

  // Helper function to extract level number from level string
  const extractLevel = (levelString) => {
    if (!levelString) return 1;
    const match = levelString.match(/\d+/);
    return match ? parseInt(match[0]) : 1;
  };

  // Random sentence selection
  const getRandomSentence = () => {
    const randomIndex = Math.floor(Math.random() * SENTENCE_BANK.length);
    return SENTENCE_BANK[randomIndex];
  };

  // Cookie management functions for wrong words
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
      
      document.cookie = `wrongWords=${encodeURIComponent(JSON.stringify(sortedData))}; expires=${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString()}; path=/`;
      
      console.log('Wrong words saved to cookies:', wrongWords);
    } catch (error) {
      console.error('Error saving wrong words to cookies:', error);
      handleError('Failed to save practice words');
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
      handleError('Failed to remove word from practice list');
    }
  };

  // Update accuracy based on speech recognition results
  const updateAccuracy = (correctWords, totalWords) => {
    const newAccuracy = totalWords > 0 ? Math.round((correctWords / totalWords) * 100) : 0;
    setUserStats(prev => ({
      ...prev,
      accuracy: newAccuracy
    }));
  };

  const handleTextExtracted = (text) => {
    setExtractedText(text);
    setBookText(text);
    setCurrentView('readbook');
  };

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

  const initializeSpeechRecognition = () => {
    // Use random sentence instead of hardcoded
    const sentences = [getRandomSentence()];

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
      
      currentWordIndex = words.findIndex(word => word.length > 2);
      if (currentWordIndex === -1) {
        currentWordIndex = 0;
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
          
          // Update accuracy in state
          updateAccuracy(correctCount, totalWords);
          
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
        
        if (newWordIndex >= words.length) {
          setTimeout(() => {
            recognition?.stop();
            const score = newResults.filter(r => r === "correct").length;
            const wrongWords = words.filter((word, index) => newResults[index] === "wrong");
            
            // Update accuracy based on final results
            updateAccuracy(score, words.length);
            
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
              
              // Update accuracy based on final results
              updateAccuracy(score, words.length);
              
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
      if (!speechState.recognizing) {
        if (speechState.currentWordIndex === 0) {
          initWords();
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
    initWords();
  };

  const getWrongWordsCount = () => {
    return getWrongWordsFromCookies().length;
  };

  const DashboardView = () => {
    const wrongWordsCount = getWrongWordsCount();
    
    return (
      <div className="dashboard">
        {/* Display error message if exists */}
        {errorMessage && (
          <div className="error-banner" style={{
            backgroundColor: '#fee',
            color: '#c00',
            padding: '10px',
            borderRadius: '5px',
            marginBottom: '20px',
            border: '1px solid #fcc'
          }}>
            {errorMessage}
          </div>
        )}
        
        <div className="header">
          <div className="user-welcome">
            <div className="avatar">
              <span>{currentStudent?.avatar || '👧'}</span>
            </div>
            <div className="welcome-text">
              <h2>Welcome back, {currentStudent?.name || 'Student'}! 👋</h2>
              <p>{currentStudent?.class || 'Class'} • {currentStudent?.school || 'School'}</p>
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
              <Trophy className="activity-icon daily-icon" />
              <h3>Daily Challenge</h3>
            </div>
            <p>Complete today's reading challenge and earn bonus stars.</p>
            <div className="activity-meta">
              <span>3 Levels</span>
              <span>+10-20 Stars</span>
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

        <div className="practice-preview">
          <div className="preview-header">
          </div>
        </div>
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
          className="start-button"
          onClick={() => window.toggleRecognition && window.toggleRecognition()}
          disabled={speechState.recognizing}
        >
          {speechState.recognizing ? '🎤 Speaking...' : '🎤 Start'}
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