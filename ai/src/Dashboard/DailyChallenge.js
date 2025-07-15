import React, { useState, useEffect } from 'react';
import { Star, Trophy, Target, Calendar, Clock, Award, Zap, Volume2 } from 'lucide-react';
import { API_BASE_URL } from '../config'; // Import API_BASE_URL
import './DailyChallenge.css';

function DailyChallenge({ onBack, saveWrongWords, setError }) {
  const [availableTasks, setAvailableTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [challengeState, setChallengeState] = useState('loading'); // loading, menu, active, completed
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [completedSentences, setCompletedSentences] = useState(0);
  const [totalAccuracy, setTotalAccuracy] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [challengeStartTime, setChallengeStartTime] = useState(null);
  const [earnedStars, setEarnedStars] = useState(0);
  const [allWrongWords, setAllWrongWords] = useState([]);
  
  // Speech recognition states
  const [speechState, setSpeechState] = useState({
    words: [],
    currentWordIndex: 0,
    results: [],
    recognizing: false,
    score: '',
    errorMessage: ''
  });

  // API request function
  const apiRequest = async (endpoint, options = {}) => {
    try {
      const url = `${API_BASE_URL}/${endpoint}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  };

  // Fetch available daily tasks on component mount
  useEffect(() => {
    fetchDailyTasks();
  }, []);

  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to normalize date string
  const normalizeDateString = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchDailyTasks = async () => {
    try {
      setChallengeState('loading');
      const response = await apiRequest('get_daily_task.php');
      
      console.log('API Response:', response); // Debug log
      
      if (response.success && response.tasks) {
        // Filter tasks for today and future dates
        const today = getTodayDateString();
        console.log('Today:', today); // Debug log
        
        const availableToday = response.tasks.filter(task => {
          const taskDate = normalizeDateString(task.due_date);
          console.log('Task date:', taskDate, 'Due date:', task.due_date); // Debug log
          return taskDate >= today;
        });
        
        console.log('Available tasks:', availableToday); // Debug log
        setAvailableTasks(availableToday);
        setChallengeState('menu');
      } else {
        console.error('API Error:', response); // Debug log
        setError('Failed to load daily tasks');
        setChallengeState('menu');
      }
    } catch (error) {
      console.error('Fetch Error:', error); // Debug log
      setError('Error fetching daily tasks: ' + error.message);
      setChallengeState('menu');
    }
  };

  // Timer effect
  useEffect(() => {
    if (challengeState === 'active' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setChallengeState('completed');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [challengeState, timeLeft]);

  // Check if today's challenge is completed for a specific task
  const isTodayCompleted = (taskId) => {
    const today = getTodayDateString();
    const completed = localStorage.getItem(`dailyChallenge_${taskId}_${today}`);
    return completed === 'true';
  };

  // Mark today's challenge as completed for a specific task
  const markTodayCompleted = (taskId) => {
    const today = getTodayDateString();
    localStorage.setItem(`dailyChallenge_${taskId}_${today}`, 'true');
  };

  const startChallenge = (task) => {
    setSelectedTask(task);
    setChallengeState('active');
    setTimeLeft(task.time_limit);
    setChallengeStartTime(Date.now());
    setCurrentSentenceIndex(0);
    setCompletedSentences(0);
    setTotalAccuracy(0);
    setEarnedStars(0);
    setAllWrongWords([]);
    initializeSpeechRecognition(task);
  };

  const initializeSpeechRecognition = (task) => {
    const currentSentence = task.sentences[currentSentenceIndex];
    
    if (!currentSentence) return;

    const words = currentSentence.split(" ");
    const results = Array(words.length).fill(null);
    
    setSpeechState({
      words,
      currentWordIndex: 0,
      results,
      recognizing: false,
      score: '',
      errorMessage: ''
    });

    setupSpeechRecognition(words, results);
  };

  const setupSpeechRecognition = (words, initialResults) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setSpeechState(prev => ({
        ...prev,
        errorMessage: "Speech recognition not supported in this browser."
      }));
      return;
    }

    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;

    let canValidate = false;

    recognition.onstart = () => {
      setSpeechState(prev => ({
        ...prev,
        recognizing: true,
        errorMessage: ''
      }));
      setTimeout(() => {
        canValidate = true;
      }, 500);
    };

    recognition.onend = () => {
      setSpeechState(prev => ({
        ...prev,
        recognizing: false
      }));
    };

    recognition.onerror = (e) => {
      setSpeechState(prev => ({
        ...prev,
        recognizing: false,
        errorMessage: `Error: ${e.error}. Please try again.`
      }));
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
        validateSentence(finalTranscript.trim(), words, initialResults);
      }
    };

    // Store recognition instance for starting
    window.startChallengeRecognition = () => {
      if (!speechState.recognizing) {
        try {
          recognition.start();
        } catch (error) {
          console.log("Recognition start failed:", error);
        }
      }
    };

    // Auto-stop after 15 seconds
    setTimeout(() => {
      if (recognition) {
        recognition.stop();
      }
    }, 15000);
  };

  const validateSentence = (spoken, words, initialResults) => {
    const spokenWords = spoken.toLowerCase().trim().split(/\s+/);
    const targetWords = words.map(w => w.toLowerCase());
    const newResults = [...initialResults];
    const wrongWords = [];
    
    words.forEach((word, index) => {
      if (word.length <= 2) {
        newResults[index] = "correct";
      } else {
        const wordLower = word.toLowerCase();
        const foundInSpoken = spokenWords.some(spokenWord => 
          spokenWord.includes(wordLower) || wordLower.includes(spokenWord)
        );
        
        if (foundInSpoken) {
          newResults[index] = "correct";
        } else {
          newResults[index] = "wrong";
          wrongWords.push(word);
        }
      }
    });

    const correctCount = newResults.filter(r => r === "correct").length;
    const accuracy = Math.round((correctCount / words.length) * 100);
    
    // Update speech state
    setSpeechState(prev => ({
      ...prev,
      results: newResults,
      currentWordIndex: words.length,
      score: `${correctCount}/${words.length} words correct (${accuracy}%)`
    }));

    // Add wrong words to collection
    if (wrongWords.length > 0) {
      setAllWrongWords(prev => [...prev, ...wrongWords]);
    }

    // Update challenge progress
    const newCompletedSentences = completedSentences + 1;
    const newTotalAccuracy = ((totalAccuracy * completedSentences) + accuracy) / newCompletedSentences;
    
    setCompletedSentences(newCompletedSentences);
    setTotalAccuracy(newTotalAccuracy);

    // Check if challenge is completed
    setTimeout(() => {
      if (newCompletedSentences >= selectedTask.sentences.length) {
        completeChallengeCheck(newTotalAccuracy, selectedTask);
      } else {
        // Move to next sentence
        setCurrentSentenceIndex(prev => prev + 1);
        setTimeout(() => {
          initializeSpeechRecognition(selectedTask);
        }, 2000);
      }
    }, 3000);
  };

  const completeChallengeCheck = (finalAccuracy, task) => {
    const timeSpent = (Date.now() - challengeStartTime) / 1000;
    const withinTimeLimit = timeSpent <= task.time_limit;
    const accuracyMet = finalAccuracy >= task.target_accuracy;
    
    let stars = 0;
    if (withinTimeLimit && accuracyMet) {
      stars = task.stars_reward;
      if (finalAccuracy >= 90) stars += 5; // Bonus for high accuracy
      if (timeSpent <= task.time_limit * 0.7) stars += 5; // Bonus for speed
    } else if (accuracyMet) {
      stars = Math.floor(task.stars_reward * 0.7); // Partial credit
    }

    setEarnedStars(stars);
    
    // Save wrong words
    if (allWrongWords.length > 0 && saveWrongWords) {
      saveWrongWords(allWrongWords);
    }

    // Mark as completed if successful
    if (stars > 0) {
      markTodayCompleted(task.id);
    }

    setChallengeState('completed');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const resetChallenge = () => {
    setChallengeState('menu');
    setSelectedTask(null);
    setCurrentSentenceIndex(0);
    setCompletedSentences(0);
    setTotalAccuracy(0);
    setTimeLeft(0);
    setEarnedStars(0);
    setAllWrongWords([]);
    setSpeechState({
      words: [],
      currentWordIndex: 0,
      results: [],
      recognizing: false,
      score: '',
      errorMessage: ''
    });
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#4CAF50';
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'beginner': return '🌱';
      case 'intermediate': return '🔥';
      case 'advanced': return '🏆';
      default: return '🌱';
    }
  };

  // Loading View
  if (challengeState === 'loading') {
    return (
      <div className="daily-challenge-container">
        <div className="practice-header">
          <button className="back-btn" onClick={onBack}>
            ← Back to Dashboard
          </button>
          <h2>🏆 Daily Challenge</h2>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading daily challenges...</p>
        </div>
      </div>
    );
  }

  // Menu View
    if (challengeState === 'menu') {
    const today = getTodayDateString();
    console.log('Menu view - Today:', today);
    console.log('Menu view - Available tasks:', availableTasks);
    
    // Show tasks for today AND future tasks (so students can see what's coming)
    const todayTasks = availableTasks.filter(task => {
      const taskDate = normalizeDateString(task.due_date);
      console.log('Menu filter - Task date:', taskDate, 'Today:', today);
      return taskDate === today;
    });
    
    const futureTasks = availableTasks.filter(task => {
      const taskDate = normalizeDateString(task.due_date);
      return taskDate > today;
    });
    
    console.log('Today tasks:', todayTasks);
    console.log('Future tasks:', futureTasks);

    return (
      <div className="daily-challenge-container">
        <div className="practice-header">
          <button className="back-btn" onClick={onBack}>
            ← Back to Dashboard
          </button>
          <h2>🏆 Daily Challenge</h2>
        </div>

        <div className="challenge-intro">
          <div className="challenge-date">
            <Calendar className="calendar-icon" />
            <span>Today's Challenges - {new Date().toLocaleDateString()}</span>
          </div>
          {/* Debug info - remove in production */}
          <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
            Debug: Total tasks: {availableTasks.length}, Today: {todayTasks.length}, Future: {futureTasks.length}
          </div>
        </div>

        <div className="challenges-section">
          <h3>Today's Challenges:</h3>
          
          {todayTasks.length > 0 ? (
            <div className="challenges-grid">
              {todayTasks.map(task => {
                const isCompleted = isTodayCompleted(task.id);
                
                return (
                  <div key={task.id} className="challenge-card">
                    <div className="challenge-header">
                      <div className="challenge-title">
                        <h4>{getLevelIcon(task.level)} {task.title}</h4>
                        <span 
                          className="challenge-level"
                          style={{ 
                            backgroundColor: getLevelColor(task.level),
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px'
                          }}
                        >
                          {task.level}
                        </span>
                      </div>
                      {isCompleted && (
                        <div className="completed-badge">
                          <Trophy className="trophy-icon" />
                          <span>Completed!</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="challenge-description">{task.description}</p>
                    
                    <div className="challenge-stats">
                      <div className="challenge-stat">
                        <Target className="stat-icon" />
                        <span>{task.target_accuracy}% accuracy</span>
                      </div>
                      <div className="challenge-stat">
                        <Clock className="stat-icon" />
                        <span>{formatTime(task.time_limit)}</span>
                      </div>
                      <div className="challenge-stat">
                        <Star className="stat-icon" />
                        <span>{task.stars_reward} stars</span>
                      </div>
                    </div>

                    <div className="challenge-meta">
                      <div className="challenge-sentences">
                        <span>{task.sentences?.length || 0} sentences to read</span>
                      </div>
                      {task.teacher_name && (
                        <div className="challenge-teacher">
                          <span>By: {task.teacher_name}</span>
                        </div>
                      )}
                    </div>

                    <div className="challenge-actions">
                      <button 
                        className="start-challenge-btn"
                        onClick={() => startChallenge(task)}
                        disabled={isCompleted}
                      >
                        {isCompleted ? '✅ Completed Today' : '🚀 Start Challenge'}
                      </button>
                      
                      {isCompleted && (
                        <button 
                          className="practice-btn"
                          onClick={() => startChallenge(task)}
                        >
                          🎯 Practice Again
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-challenges">
              <p>No challenges available for today.</p>
            </div>
          )}

          {futureTasks.length > 0 && (
            <>
              <h3 style={{ marginTop: '30px' }}>Upcoming Challenges:</h3>
              <div className="challenges-grid">
                {futureTasks.map(task => (
                  <div key={task.id} className="challenge-card upcoming">
                    <div className="challenge-header">
                      <div className="challenge-title">
                        <h4>{getLevelIcon(task.level)} {task.title}</h4>
                        <span 
                          className="challenge-level"
                          style={{ 
                            backgroundColor: getLevelColor(task.level),
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px'
                          }}
                        >
                          {task.level}
                        </span>
                      </div>
                      <div className="upcoming-badge">
                        <Calendar className="calendar-icon" />
                        <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <p className="challenge-description">{task.description}</p>
                    
                    <div className="challenge-stats">
                      <div className="challenge-stat">
                        <Target className="stat-icon" />
                        <span>{task.target_accuracy}% accuracy</span>
                      </div>
                      <div className="challenge-stat">
                        <Clock className="stat-icon" />
                        <span>{formatTime(task.time_limit)}</span>
                      </div>
                      <div className="challenge-stat">
                        <Star className="stat-icon" />
                        <span>{task.stars_reward} stars</span>
                      </div>
                    </div>

                    <div className="challenge-meta">
                      <div className="challenge-sentences">
                        <span>{task.sentences?.length || 0} sentences to read</span>
                      </div>
                      {task.teacher_name && (
                        <div className="challenge-teacher">
                          <span>By: {task.teacher_name}</span>
                        </div>
                      )}
                    </div>

                    <div className="challenge-actions">
                      <button 
                        className="start-challenge-btn"
                        disabled={true}
                        style={{ opacity: 0.6 }}
                      >
                        🗓️ Available on {new Date(task.due_date).toLocaleDateString()}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Active Challenge View
  if (challengeState === 'active') {
    const progress = (completedSentences / selectedTask.sentences.length) * 100;
    
    return (
      <div className="daily-challenge-container">
        <div className="challenge-header">
          <button className="back-btn" onClick={() => setChallengeState('menu')}>
            ← Back to Menu
          </button>
          <h2>🏆 {selectedTask.title}</h2>
        </div>

        <div className="challenge-progress">
          <div className="progress-stats">
            <div className="stat">
              <span className="stat-label">Progress</span>
              <span className="stat-value">{completedSentences}/{selectedTask.sentences.length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Time Left</span>
              <span className="stat-value">{formatTime(timeLeft)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Accuracy</span>
              <span className="stat-value">{Math.round(totalAccuracy)}%</span>
            </div>
          </div>
          
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="sentence-counter">
          <h3>Sentence {currentSentenceIndex + 1} of {selectedTask.sentences.length}</h3>
        </div>

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

        {speechState.errorMessage && (
          <div className="error-message">
            {speechState.errorMessage}
          </div>
        )}

        <div className="score-display">
          {speechState.score}
        </div>

        <div className="practice-controls">
          <button 
            className="start-button"
            onClick={() => window.startChallengeRecognition && window.startChallengeRecognition()}
            disabled={speechState.recognizing}
          >
            {speechState.recognizing ? '🎤 Listening...' : '🎤 Start Reading'}
          </button>
        </div>
      </div>
    );
  }

  // Completed Challenge View
  if (challengeState === 'completed') {
    const success = earnedStars > 0;
    
    return (
      <div className="daily-challenge-container">
        <div className="challenge-header">
          <h2>🏆 Challenge {success ? 'Completed!' : 'Finished'}</h2>
        </div>

        <div className="challenge-results">
          <div className="result-icon">
            {success ? (
              <Trophy className="trophy-large success" />
            ) : (
              <Target className="target-large" />
            )}
          </div>

          <div className="result-stats">
            <div className="result-stat">
              <span className="stat-label">Sentences Completed</span>
              <span className="stat-value">{completedSentences}/{selectedTask.sentences.length}</span>
            </div>
            <div className="result-stat">
              <span className="stat-label">Final Accuracy</span>
              <span className="stat-value">{Math.round(totalAccuracy)}%</span>
            </div>
            <div className="result-stat">
              <span className="stat-label">Stars Earned</span>
              <span className="stat-value">
                <Star className="star-icon" />
                {earnedStars}
              </span>
            </div>
          </div>

          {success ? (
            <div className="success-message">
              <h3>🎉 Congratulations!</h3>
              <p>You've completed the challenge successfully!</p>
            </div>
          ) : (
            <div className="retry-message">
              <h3>💪 Keep Practicing!</h3>
              <p>You can try again to improve your score.</p>
            </div>
          )}

          {allWrongWords.length > 0 && (
            <div className="wrong-words-summary">
              <h4>Words to Practice:</h4>
              <div className="wrong-words-list">
                {allWrongWords.map((word, index) => (
                  <span key={index} className="wrong-word-tag">{word}</span>
                ))}
              </div>
              <p>These words have been added to your warmup practice.</p>
            </div>
          )}
        </div>

        <div className="challenge-actions">
          <button className="back-btn" onClick={onBack}>
            🏠 Back to Dashboard
          </button>
          <button className="retry-btn" onClick={resetChallenge}>
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }
}

export default DailyChallenge;