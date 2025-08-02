import React, { useState, useEffect } from 'react';
import { Star, Trophy, Target, Calendar, Clock, Award, Zap } from 'lucide-react';
import { API_BASE_URL } from '../config';
import './DailyChallenge.css';

function DailyChallenge({ onBack, saveWrongWords, setError}) {
  const [availableTasks, setAvailableTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [challengeState, setChallengeState] = useState('loading');
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [completedSentences, setCompletedSentences] = useState(0);
  const [totalAccuracy, setTotalAccuracy] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [challengeStartTime, setChallengeStartTime] = useState(null);
  const [earnedStars, setEarnedStars] = useState(0);
  const [allWrongWords, setAllWrongWords] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);
  
  // Level system state
  const [currentLevel, setCurrentLevel] = useState('L1');
  
  const [speechState, setSpeechState] = useState({
    words: [],
    currentWordIndex: 0,
    results: [],
    recognizing: false,
    canValidate: false,
    score: '',
    errorMessage: ''
  });

  // Level configuration
  const levels = {
    L1: { name: "Beginner", delay: 500, nextWordDelay: 80, timePerWord: 5000 },
    L2: { name: "Advance", delay: 300, nextWordDelay: 10, timePerWord: 3000 },
    L3: { name: "Expert", delay: 300, nextWordDelay: 1, fullSentence: true, timePerWord: 0 }
  };

  // Mobile detection
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Speech recognition variables - moved to component scope like dashboard
  let recognition = null;
  let autoRestartEnabled = false;
  let canValidate = false;
  let wordTimeout = null;

  // Fetch daily tasks on component mount
  useEffect(() => {
    fetchDailyTasks();
  }, []);

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

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (recognition) {
        recognition.stop();
      }
      if (wordTimeout) {
        clearTimeout(wordTimeout);
      }
    };
  }, []);

 const fetchDailyTasks = async () => {
  try {
    setChallengeState('loading');
    
    // Remove the hardcoded student_id parameter - let PHP get it from session
    const response = await fetch(`${API_BASE_URL}/get_daily_task_std.php`, {
      method: 'GET',
      credentials: 'include', // Important: This sends the session cookies
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      setAvailableTasks(data.tasks || []);
      
      // Set student info from the response
      if (data.student) {
        setStudentInfo(data.student);
      }
      
      setChallengeState('menu');
    } else {
      setError(data.error || 'Failed to load data');
      setChallengeState('menu');
    }
  } catch (error) {
    setError('Error fetching data: ' + error.message);
    setChallengeState('menu');
  }
};

  const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const isTodayCompleted = (taskId) => {
    const today = getTodayDateString();
    return localStorage.getItem(`dailyChallenge_${taskId}_${today}`) === 'true';
  };

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
    if (!task || !task.sentences || task.sentences.length === 0) {
      console.error('Invalid task data for speech recognition');
      return;
    }
    
    const currentSentence = task.sentences[currentSentenceIndex];
    if (!currentSentence) {
      console.error('No sentence found at index:', currentSentenceIndex);
      return;
    }

    const words = currentSentence.split(" ");
    const results = Array(words.length).fill(null);
    
    // Find first word longer than 2 letters (same as dashboard)
    let currentWordIndex = 0;
    if (currentLevel !== 'L3') {
      currentWordIndex = words.findIndex(word => word.length > 2);
      if (currentWordIndex === -1) {
        currentWordIndex = 0;
      }
    }
    
    setSpeechState({
      words,
      currentWordIndex,
      results,
      recognizing: false,
      canValidate: false,
      score: '',
      errorMessage: ''
    });

    setupSpeechRecognition();
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
          if (prevState.currentWordIndex < prevState.words.length && currentLevel !== 'L3') {
            startWordTimeout(prevState.currentWordIndex);
          }
          return { ...prevState, canValidate: true };
        });
      }, levels[currentLevel].delay);
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
                              currentLevel !== 'L3';
        
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

    // Create global functions like dashboard
    window.startChallengeRecognition = () => {
      if (!speechState.recognizing) {
        autoRestartEnabled = true;
        try {
          recognition.start();
        } catch (error) {
          console.log("Recognition start failed:", error);
        }
      }
    };

    window.stopChallengeRecognition = () => {
      autoRestartEnabled = false;
      if (recognition) {
        recognition.stop();
      }
      if (wordTimeout) {
        clearTimeout(wordTimeout);
        wordTimeout = null;
      }
      setSpeechState(prev => ({ ...prev, recognizing: false }));
    };
  };

  const validateWord = (spoken) => {
    if (wordTimeout) {
      clearTimeout(wordTimeout);
      wordTimeout = null;
    }
    
    setSpeechState(prevState => {
      const { words, currentWordIndex, results } = prevState;
      
      if (currentWordIndex >= words.length) return prevState;
      
      const newResults = [...results];
      let newWordIndex = currentWordIndex;
      let scoreMessage = "";
      
      if (currentLevel === 'L3') {
        // Expert level - validate entire sentence (same as dashboard)
        const spokenWords = spoken.toLowerCase().trim().split(/\s+/);
        
        words.forEach((word, index) => {
          if (word.length <= 2) {
            newResults[index] = "correct";
          } else {
            const wordLower = word.toLowerCase();
            const foundInSpoken = spokenWords.some(spokenWord => 
              spokenWord.includes(wordLower) || wordLower.includes(spokenWord)
            );
            newResults[index] = foundInSpoken ? "correct" : "wrong";
            
            if (!foundInSpoken) {
              setAllWrongWords(prev => [...prev, word]);
            }
          }
        });
        
        newWordIndex = words.length;
        
        const correctCount = newResults.filter(r => r === "correct").length;
        const totalWords = words.length;
        const accuracy = Math.round((correctCount / totalWords) * 100);
        
        scoreMessage = accuracy >= 70 ? 
          `🎉 Great! ${correctCount}/${totalWords} words correct (${accuracy}%)` :
          `❌ ${correctCount}/${totalWords} words correct (${accuracy}%). Try again!`;
        
      } else {
        // L1 and L2 - validate current word (same as dashboard)
        const expected = words[currentWordIndex].toLowerCase();
        const spokenLower = spoken.toLowerCase().trim();
        
        const matched = spokenLower.includes(expected) || expected.includes(spokenLower);
        newResults[currentWordIndex] = matched ? "correct" : "wrong";
        
        if (!matched && words[currentWordIndex].length > 2) {
          setAllWrongWords(prev => [...prev, words[currentWordIndex]]);
        }
        
        newWordIndex = currentWordIndex + 1;
        
        // Auto-mark two-letter words as correct (same as dashboard)
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
          finishSentence(newResults, words);
        }, currentLevel === 'L3' ? 3000 : 1000);
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
    if (currentLevel === 'L3') return;
    
    wordTimeout = setTimeout(() => {
      setSpeechState(prevState => {
        const { words, results, currentWordIndex } = prevState;
        
        if (wordIndex >= words.length || wordIndex !== currentWordIndex) {
          return prevState;
        }
        
        const newResults = [...results];
        newResults[wordIndex] = "wrong";
        
        // Add to wrong words (only if word is longer than 2 letters)
        if (words[wordIndex] && words[wordIndex].length > 2) {
          setAllWrongWords(prev => [...prev, words[wordIndex]]);
        }
        
        // Find next word longer than 2 letters (same as dashboard)
        let nextIndex = wordIndex + 1;
        while (nextIndex < words.length && words[nextIndex].length <= 2) {
          newResults[nextIndex] = "correct";
          nextIndex++;
        }
        
        if (nextIndex < words.length) {
          startWordTimeout(nextIndex);
        } else {
          // All words processed
          setTimeout(() => {
            finishSentence(newResults, words);
          }, 1000);
        }
        
        return {
          ...prevState,
          results: newResults,
          currentWordIndex: nextIndex,
          score: `⏰ Time's up! Expected "${words[wordIndex]}"`
        };
      });
    }, levels[currentLevel].timePerWord);
  };

  const finishSentence = (results, words) => {
    if (recognition) {
      recognition.stop();
    }
    
    const correctCount = results.filter(r => r === "correct").length;
    const accuracy = Math.round((correctCount / words.length) * 100);
    
    setSpeechState(prev => ({
      ...prev,
      recognizing: false,
      score: `🎉 Sentence Complete: ${correctCount}/${words.length} (${accuracy}%)`
    }));

    const newCompletedSentences = completedSentences + 1;
    const newTotalAccuracy = ((totalAccuracy * completedSentences) + accuracy) / newCompletedSentences;
    
    setCompletedSentences(newCompletedSentences);
    setTotalAccuracy(newTotalAccuracy);

    setTimeout(() => {
      if (newCompletedSentences >= selectedTask.sentences.length) {
        completeChallengeCheck(newTotalAccuracy, selectedTask);
      } else {
        setCurrentSentenceIndex(prev => prev + 1);
        setTimeout(() => initializeSpeechRecognition(selectedTask), 2000);
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
      if (finalAccuracy >= 90) stars += 5;
      if (timeSpent <= task.time_limit * 0.7) stars += 5;
    } else if (accuracyMet) {
      stars = Math.floor(task.stars_reward * 0.7);
    }

    setEarnedStars(stars);
    
    if (allWrongWords.length > 0 && saveWrongWords) {
      saveWrongWords(allWrongWords);
    }

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
      canValidate: false,
      score: '',
      errorMessage: ''
    });
    
    // Cleanup
    if (recognition) {
      recognition.stop();
    }
    if (wordTimeout) {
      clearTimeout(wordTimeout);
      wordTimeout = null;
    }
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
          <button className="back-btn" onClick={onBack}>← Back to Dashboard</button>
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
    const todayTasks = availableTasks.filter(task => task.due_date === today);

    return (
      <div className="daily-challenge-container">
        <div className="practice-header">
          <button className="back-btn" onClick={onBack}>← Back to Dashboard</button>
          <h2>🏆 Daily Challenge</h2>
        </div>

        <div className="challenge-intro">
          <div className="challenge-date">
            <Calendar className="calendar-icon" />
            <span>Today's Challenges - {new Date().toLocaleDateString()}</span>
          </div>
          {studentInfo && (
            <div className="student-info">
              <span>Welcome, {studentInfo.name}!</span>
              <span>Class: {studentInfo.class_name} - {studentInfo.section}</span>
            </div>
          )}
        </div>

        {/* Level Selector */}
        <div className="level-selector-container">
          <label htmlFor="levelSelect">Choose Reading Level:</label>
          <select 
            id="levelSelect" 
            value={currentLevel}
            onChange={(e) => setCurrentLevel(e.target.value)}
          >
            <option value="L1">Beginner (5s per word)</option>
            <option value="L2">Advance (3s per word)</option>
            <option value="L3">Expert (Full Sentence)</option>
          </select>
        </div>

        {isMobile && (
          <div className="mobile-instructions">
            📱 <strong>Mobile Users:</strong> For Expert level, speak all words continuously after clicking start!
          </div>
        )}

        <div className="challenges-section">
          <h3>Available Challenges:</h3>
          
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
                      <div className="selected-level">
                        <span>Selected Level: {levels[currentLevel].name}</span>
                      </div>
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
              <p>No challenges available for today. Check back later!</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Active Challenge View
  if (challengeState === 'active') {
    // Add null check for selectedTask
    if (!selectedTask || !selectedTask.sentences || selectedTask.sentences.length === 0) {
      return (
        <div className="daily-challenge-container">
          <div className="challenge-header">
            <button className="back-btn" onClick={() => setChallengeState('menu')}>← Back to Menu</button>
            <h2>🏆 Challenge Error</h2>
          </div>
          <div className="error-message">
            <p>Challenge data is not available. Please try again.</p>
          </div>
        </div>
      );
    }

    const progress = (completedSentences / selectedTask.sentences.length) * 100;
    
    return (
      <div className="daily-challenge-container">
        <div className="challenge-header">
          <button className="back-btn" onClick={() => setChallengeState('menu')}>← Back to Menu</button>
          <h2>🏆 {selectedTask.title}</h2>
        </div>

        <div className="level-info">
          <span>Level: {levels[currentLevel].name}</span>
          {currentLevel === 'L3' && <span className="expert-note">Speak entire sentence</span>}
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
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
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
          <div className="error-message">{speechState.errorMessage}</div>
        )}

        <div className="score-display">{speechState.score}</div>

        <div className="practice-controls">
          <button 
            className={`start-button ${speechState.recognizing ? 'stop-btn' : ''}`}
            onClick={() => {
              if (speechState.recognizing) {
                window.stopChallengeRecognition && window.stopChallengeRecognition();
              } else {
                window.startChallengeRecognition && window.startChallengeRecognition();
              }
            }}
          >
            {speechState.recognizing ? '🛑 Stop' : '🎤 Start Reading'}
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
            {success ? <Trophy className="trophy-large success" /> : <Target className="target-large" />}
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
            <div className="result-stat">
              <span className="stat-label">Level Used</span>
              <span className="stat-value">{levels[currentLevel].name}</span>
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
          <button className="back-btn" onClick={onBack}>🏠 Back to Dashboard</button>
          <button className="retry-btn" onClick={resetChallenge}>🔄 Try Again</button>
        </div>
      </div>
    );
  }
}

export default DailyChallenge;