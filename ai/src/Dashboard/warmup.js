import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Volume2, RotateCcw, Star, Trophy, Target, Calendar, CheckCircle, XCircle } from 'lucide-react';

const Warmup = ({ onBack, getWrongWords, removeWord, saveWrongWords }) => {
  const [wrongWords, setWrongWords] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [sessionComplete, setSessionComplete] = useState(false);
  const [wordResults, setWordResults] = useState([]);
  const [practiceMode, setPracticeMode] = useState('cards'); // 'cards' or 'session'
  const [selectedCard, setSelectedCard] = useState(null);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [todaysPractice, setTodaysPractice] = useState({});

  useEffect(() => {
    loadWrongWords();
    initializeSpeechRecognition();
    loadTodaysPractice();
    
    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);

  const loadWrongWords = () => {
    if (getWrongWords) {
      const words = getWrongWords();
      console.log('Loading wrong words from cookies:', words);
      setWrongWords(words.map(word => ({
        ...word,
        practiceData: word.practiceData || {
          daysCompleted: 0,
          totalDays: 5,
          dailyAttempts: {},
          createdDate: new Date().toDateString()
        }
      })));
      setWordResults(Array(words.length).fill(null));
    }
  };

  const loadTodaysPractice = () => {
    const today = new Date().toDateString();
    const savedPractice = localStorage.getItem(`practice_${today}`);
    if (savedPractice) {
      setTodaysPractice(JSON.parse(savedPractice));
    }
  };

  const saveTodaysPractice = (wordData) => {
    const today = new Date().toDateString();
    const updatedPractice = { ...todaysPractice, ...wordData };
    setTodaysPractice(updatedPractice);
    localStorage.setItem(`practice_${today}`, JSON.stringify(updatedPractice));
  };

  const initializeSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setFeedback('Speech recognition not supported in this browser.');
      return;
    }

    const newRecognition = new SpeechRecognition();
    newRecognition.continuous = false;
    newRecognition.interimResults = false;
    newRecognition.lang = 'en-US';

    newRecognition.onstart = () => {
      setIsListening(true);
      setFeedback('🎤 Listening... Please say the word clearly');
    };

    newRecognition.onresult = (event) => {
      const spokenWord = event.results[0][0].transcript.toLowerCase().trim();
      handleWordValidation(spokenWord);
    };

    newRecognition.onerror = (event) => {
      setIsListening(false);
      setFeedback(`Error: ${event.error}. Please try again.`);
    };

    newRecognition.onend = () => {
      setIsListening(false);
    };

    setRecognition(newRecognition);
  };

  const handleWordValidation = (spokenWord) => {
    if (practiceMode === 'cards' && selectedCard !== null) {
      handleCardPractice(spokenWord);
    } else if (currentWordIndex < wrongWords.length) {
      handleSessionPractice(spokenWord);
    }
  };

  const handleCardPractice = (spokenWord) => {
    const currentWord = wrongWords[selectedCard];
    const expectedWord = currentWord.word.toLowerCase();
    const today = new Date().toDateString();
    
    const isCorrect = spokenWord.includes(expectedWord) || expectedWord.includes(spokenWord);
    
    // Update today's practice data
    const wordKey = currentWord.word;
    const todaysData = todaysPractice[wordKey] || { attempts: 0, correct: 0 };
    
    todaysData.attempts += 1;
    if (isCorrect) {
      todaysData.correct += 1;
    }

    saveTodaysPractice({ [wordKey]: todaysData });

    if (isCorrect) {
      setFeedback(`✅ Excellent! You said "${spokenWord}" correctly! (${todaysData.correct}/2 today)`);
    } else {
      setFeedback(`❌ You said "${spokenWord}", but the word is "${expectedWord}". Try again! (${todaysData.attempts}/2 attempts today)`);
    }

    // Update word practice data
    const updatedWords = [...wrongWords];
    const wordData = updatedWords[selectedCard];
    
    if (!wordData.practiceData.dailyAttempts[today]) {
      wordData.practiceData.dailyAttempts[today] = { attempts: 0, correct: 0 };
    }
    
    wordData.practiceData.dailyAttempts[today] = todaysData;

    // Check if word should be completed for today
    if (todaysData.correct >= 2) {
      const completedDays = Object.keys(wordData.practiceData.dailyAttempts).filter(
        date => wordData.practiceData.dailyAttempts[date].correct >= 2
      ).length;
      
      wordData.practiceData.daysCompleted = completedDays;

      // Remove word if completed 5 days
      if (completedDays >= 5) {
        setFeedback(`🎉 Amazing! You've mastered "${currentWord.word}" over 5 days! Word removed from practice.`);
        if (removeWord) {
          removeWord(currentWord.word);
        }
        setTimeout(() => {
          loadWrongWords();
          setSelectedCard(null);
        }, 2000);
        return;
      } else {
        setFeedback(`🎯 Great! You've completed today's practice for "${currentWord.word}". ${5 - completedDays} more days to master it!`);
      }
    }

    // Check if reached daily limit
    if (todaysData.attempts >= 2) {
      setFeedback(prev => prev + ` You've used both attempts for today. Come back tomorrow!`);
    }

    setWrongWords(updatedWords);
    
    // Update cookies
    if (saveWrongWords) {
      const wordsToSave = updatedWords.map(w => ({
        word: w.word,
        difficulty: w.difficulty,
        source: w.source,
        attempts: w.attempts,
        practiceData: w.practiceData
      }));
      // This would need to be handled by the parent component
      // saveWrongWords(wordsToSave);
    }
  };

  const handleSessionPractice = (spokenWord) => {
    if (currentWordIndex >= wrongWords.length) return;

    const currentWord = wrongWords[currentWordIndex];
    const expectedWord = currentWord.word.toLowerCase();
    
    const isCorrect = spokenWord.includes(expectedWord) || expectedWord.includes(spokenWord);
    
    const newResults = [...wordResults];
    newResults[currentWordIndex] = isCorrect ? 'correct' : 'wrong';
    setWordResults(newResults);

    if (isCorrect) {
      setFeedback(`✅ Excellent! You said "${spokenWord}" correctly!`);
      setScore(prev => ({ ...prev, correct: prev.correct + 1, total: prev.total + 1 }));
    } else {
      setFeedback(`❌ You said "${spokenWord}", but the word is "${expectedWord}". Try again!`);
      setScore(prev => ({ ...prev, total: prev.total + 1 }));
    }

    setTimeout(() => {
      if (currentWordIndex + 1 >= wrongWords.length) {
        completeSession();
      } else {
        setCurrentWordIndex(currentWordIndex + 1);
        setFeedback('Ready for the next word!');
      }
    }, 2000);
  };

  const completeSession = () => {
    setSessionComplete(true);
    const accuracy = wrongWords.length > 0 ? Math.round((score.correct / wrongWords.length) * 100) : 0;
    
    if (accuracy >= 80) {
      setFeedback(`🎉 Amazing work! You got ${accuracy}% accuracy!`);
    } else if (accuracy >= 60) {
      setFeedback(`👍 Good job! ${accuracy}% accuracy. Keep practicing!`);
    } else {
      setFeedback(`💪 Keep practicing! ${accuracy}% accuracy. You'll get better!`);
    }
  };

  const startListening = () => {
    if (recognition && !isListening) {
      recognition.start();
    }
  };

  const playWordAudio = (word) => {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = 0.8;
    utterance.pitch = 1.2;
    window.speechSynthesis.speak(utterance);
  };

  const restartSession = () => {
    setCurrentWordIndex(0);
    setScore({ correct: 0, total: 0 });
    setSessionComplete(false);
    setFeedback('');
    setWordResults(Array(wrongWords.length).fill(null));
    loadWrongWords();
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'easy': return '#4ade80';
      case 'medium': return '#fbbf24';
      case 'hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getDifficultyLabel = (difficulty) => {
    switch(difficulty) {
      case 'easy': return 'Easy';
      case 'medium': return 'Medium';
      case 'hard': return 'Hard';
      default: return 'Medium';
    }
  };

  const getTodaysProgress = (word) => {
    const today = new Date().toDateString();
    return todaysPractice[word] || { attempts: 0, correct: 0 };
  };

  const canPracticeToday = (word) => {
    const progress = getTodaysProgress(word);
    return progress.attempts < 2;
  };

  const isCompletedToday = (word) => {
    const progress = getTodaysProgress(word);
    return progress.correct >= 2;
  };

  if (wrongWords.length === 0) {
    return (
      <div style={{ padding: '20px', fontFamily: 'system-ui', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button 
            onClick={onBack}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '10px 15px', 
              background: '#f3f4f6', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer' 
            }}
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          <h2 style={{ margin: 0, color: '#1f2937' }}>🔥 Warmup Practice</h2>
        </div>
        
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f9fafb', borderRadius: '12px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎉</div>
          <h3 style={{ color: '#1f2937', marginBottom: '10px' }}>Great news!</h3>
          <p style={{ color: '#6b7280', marginBottom: '5px' }}>You don't have any words to practice right now.</p>
          <p style={{ color: '#6b7280', marginBottom: '30px' }}>Complete some reading exercises to build your practice list!</p>
          <button 
            onClick={onBack}
            style={{ 
              padding: '12px 24px', 
              background: '#3b82f6', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Start Reading Practice
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button 
            onClick={onBack}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '10px 15px', 
              background: '#f3f4f6', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer' 
            }}
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          <h2 style={{ margin: 0, color: '#1f2937' }}>🔥 Warmup Practice</h2>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setPracticeMode('cards')}
            style={{
              padding: '8px 16px',
              background: practiceMode === 'cards' ? '#3b82f6' : '#f3f4f6',
              color: practiceMode === 'cards' ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Card Practice
          </button>
          <button
            onClick={() => setPracticeMode('session')}
            style={{
              padding: '8px 16px',
              background: practiceMode === 'session' ? '#3b82f6' : '#f3f4f6',
              color: practiceMode === 'session' ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Full Session
          </button>
        </div>
      </div>

      {practiceMode === 'cards' ? (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            {wrongWords.map((wordData, index) => {
              const todaysProgress = getTodaysProgress(wordData.word);
              const completed = isCompletedToday(wordData.word);
              const canPractice = canPracticeToday(wordData.word);
              
              return (
                <div
                  key={index}
                  onClick={() => {
                    if (canPractice && !completed) {
                      setSelectedCard(index);
                      setCurrentAttempt(0);
                      setFeedback('');
                    }
                  }}
                  style={{
                    background: selectedCard === index ? '#dbeafe' : completed ? '#dcfce7' : '#ffffff',
                    border: `2px solid ${selectedCard === index ? '#3b82f6' : completed ? '#22c55e' : '#e5e7eb'}`,
                    borderRadius: '12px',
                    padding: '20px',
                    cursor: (canPractice && !completed) ? 'pointer' : 'default',
                    opacity: (!canPractice && !completed) ? 0.6 : 1,
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0, fontSize: '24px', color: '#1f2937' }}>{wordData.word}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {completed && <CheckCircle size={20} color="#22c55e" />}
                      {!canPractice && !completed && <XCircle size={20} color="#ef4444" />}
                      <div
                        style={{
                          background: getDifficultyColor(wordData.difficulty),
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      >
                        {getDifficultyLabel(wordData.difficulty)}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: '#6b7280' }}>5-Day Progress</span>
                      <span style={{ color: '#1f2937', fontWeight: 'bold' }}>
                        {wordData.practiceData?.daysCompleted || 0}/5 days
                      </span>
                    </div>
                    <div style={{ background: '#f3f4f6', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                      <div
                        style={{
                          background: '#3b82f6',
                          height: '100%',
                          width: `${((wordData.practiceData?.daysCompleted || 0) / 5) * 100}%`,
                          transition: 'width 0.3s'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ color: '#6b7280' }}>Today's Practice</span>
                      <span style={{ color: '#1f2937' }}>
                        {todaysProgress.correct}/2 correct ({todaysProgress.attempts}/2 attempts)
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playWordAudio(wordData.word);
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        background: '#f3f4f6',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px'
                      }}
                    >
                      <Volume2 size={16} />
                      Hear
                    </button>
                    
                    {selectedCard === index && canPractice && !completed && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startListening();
                        }}
                        disabled={isListening}
                        style={{
                          flex: 2,
                          padding: '8px 12px',
                          background: isListening ? '#fbbf24' : '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: isListening ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px'
                        }}
                      >
                        <Play size={16} />
                        {isListening ? 'Listening...' : 'Speak Now'}
                      </button>
                    )}
                  </div>

                  {completed && (
                    <div style={{ 
                      position: 'absolute', 
                      top: '10px', 
                      right: '10px', 
                      background: '#22c55e', 
                      color: 'white', 
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      ✅ Completed Today
                    </div>
                  )}

                  {!canPractice && !completed && (
                    <div style={{ 
                      position: 'absolute', 
                      top: '10px', 
                      right: '10px', 
                      background: '#ef4444', 
                      color: 'white', 
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      ⏰ Try Tomorrow
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {feedback && (
            <div style={{
              padding: '15px',
              borderRadius: '8px',
              background: feedback.includes('✅') ? '#dcfce7' : feedback.includes('❌') ? '#fee2e2' : '#dbeafe',
              color: feedback.includes('✅') ? '#166534' : feedback.includes('❌') ? '#dc2626' : '#1e40af',
              marginBottom: '20px',
              textAlign: 'center',
              fontSize: '16px'
            }}>
              {feedback}
            </div>
          )}
        </div>
      ) : (
        // Original session mode code here
        <div>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', padding: '15px', background: '#f9fafb', borderRadius: '8px', minWidth: '100px' }}>
              <Star size={20} style={{ color: '#fbbf24', marginBottom: '5px' }} />
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>{score.correct}/{wrongWords.length}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Correct</div>
            </div>
            <div style={{ textAlign: 'center', padding: '15px', background: '#f9fafb', borderRadius: '8px', minWidth: '100px' }}>
              <Target size={20} style={{ color: '#3b82f6', marginBottom: '5px' }} />
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
                {wrongWords.length > 0 ? Math.round((score.correct / wrongWords.length) * 100) : 0}%
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Accuracy</div>
            </div>
            <div style={{ textAlign: 'center', padding: '15px', background: '#f9fafb', borderRadius: '8px', minWidth: '100px' }}>
              <Trophy size={20} style={{ color: '#10b981', marginBottom: '5px' }} />
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>{currentWordIndex + 1}/{wrongWords.length}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Progress</div>
            </div>
          </div>

          {!sessionComplete ? (
            <div>
              <div style={{ background: '#ffffff', border: '2px solid #e5e7eb', borderRadius: '12px', padding: '30px', marginBottom: '20px', textAlign: 'center' }}>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '32px', margin: '0 0 10px 0', color: '#1f2937' }}>{wrongWords[currentWordIndex]?.word}</h3>
                  <div
                    style={{
                      display: 'inline-block',
                      background: getDifficultyColor(wrongWords[currentWordIndex]?.difficulty),
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      marginBottom: '15px'
                    }}
                  >
                    {getDifficultyLabel(wrongWords[currentWordIndex]?.difficulty)}
                  </div>
                  <div style={{ color: '#6b7280', marginBottom: '20px' }}>
                    Attempts: {wrongWords[currentWordIndex]?.attempts || 1} | Source: {wrongWords[currentWordIndex]?.source || 'practice'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                  <button
                    onClick={() => playWordAudio(wrongWords[currentWordIndex]?.word)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 20px',
                      background: '#f3f4f6',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    <Volume2 size={20} />
                    Hear Word
                  </button>
                  
                  <button
                    onClick={startListening}
                    disabled={isListening}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 20px',
                      background: isListening ? '#fbbf24' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: isListening ? 'not-allowed' : 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    <Play size={20} />
                    {isListening ? 'Listening...' : 'Start Speaking'}
                  </button>
                </div>
              </div>

              {feedback && (
                <div style={{
                  padding: '15px',
                  borderRadius: '8px',
                  background: feedback.includes('✅') ? '#dcfce7' : feedback.includes('❌') ? '#fee2e2' : '#dbeafe',
                  color: feedback.includes('✅') ? '#166534' : feedback.includes('❌') ? '#dc2626' : '#1e40af',
                  marginBottom: '20px',
                  textAlign: 'center',
                  fontSize: '16px'
                }}>
                  {feedback}
                </div>
              )}

              <div style={{ background: '#f3f4f6', borderRadius: '4px', height: '8px', overflow: 'hidden', marginBottom: '20px' }}>
                <div
                  style={{
                    background: '#3b82f6',
                    height: '100%',
                    width: `${((currentWordIndex + 1) / wrongWords.length) * 100}%`,
                    transition: 'width 0.3s'
                  }}
                />
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', background: '#f9fafb', borderRadius: '12px' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>
                {score.correct === wrongWords.length ? '🏆' : score.correct >= wrongWords.length * 0.8 ? '🎉' : '💪'}
              </div>
              <h3 style={{ color: '#1f2937', marginBottom: '20px' }}>Session Complete!</h3>
              <div style={{ display: 'flex', gap: '40px', justifyContent: 'center', marginBottom: '30px' }}>
                <div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>{score.correct}</div>
                  <div style={{ color: '#6b7280' }}>Words Mastered</div>
                </div>
                <div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>{Math.round((score.correct / wrongWords.length) * 100)}%</div>
                  <div style={{ color: '#6b7280' }}>Accuracy</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                <button
                  onClick={restartSession}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  <RotateCcw size={20} />
                  Practice Again
                </button>
                <button
                  onClick={onBack}
                  style={{
                    padding: '12px 20px',
                    background: '#f3f4f6',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          )}

          <div style={{ marginTop: '30px' }}>
            <h4 style={{ color: '#1f2937', marginBottom: '15px' }}>Words in this session:</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {wrongWords.map((wordData, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '20px',
                    border: '1px solid #e5e7eb',
                    background: 
                      wordResults[index] === 'correct' ? '#dcfce7' : 
                      wordResults[index] === 'wrong' ? '#fee2e2' : 
                      index === currentWordIndex ? '#dbeafe' : '#f9fafb'
                  }}
                >
                  <span style={{ color: '#1f2937' }}>{wordData.word}</span>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: getDifficultyColor(wordData.difficulty)
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Warmup;