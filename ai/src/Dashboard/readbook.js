import React, { useState, useEffect } from 'react';
import { Play, Volume2, RotateCcw, Home } from 'lucide-react';

const ReadMyBook = ({ bookText, onBack }) => {
  const [speechState, setSpeechState] = useState({
    words: [],
    currentWordIndex: 0,
    results: [],
    recognizing: false,
    canValidate: false,
    score: '',
    errorMessage: '',
    isComplete: false
  });

  const [currentLevel, setCurrentLevel] = useState('L1');
  const [recognition, setRecognition] = useState(null);
  const [autoRestartEnabled, setAutoRestartEnabled] = useState(false);
  const [wordTimeout, setWordTimeoutState] = useState(null);

  // Initialize words from book text
  useEffect(() => {
    if (bookText) {
      initializeWords();
    }
  }, [bookText]);

  // Initialize speech recognition
  useEffect(() => {
    setupSpeechRecognition();
    return () => {
      if (recognition) {
        recognition.stop();
      }
      if (wordTimeout) {
        clearTimeout(wordTimeout);
      }
    };
  }, [currentLevel]);

  const initializeWords = () => {
    if (!bookText) return;
    
    const words = bookText.split(/\s+/).filter(word => word.trim());
    const results = Array(words.length).fill(null);
    
    // Mark words with 2 or fewer letters as correct
    words.forEach((word, index) => {
      if (word.length <= 2) {
        results[index] = "correct";
      }
    });
    
    // Find first word that needs to be spoken
    const firstWordIndex = words.findIndex((word, index) => 
      word.length > 2 && results[index] === null
    );
    
    setSpeechState(prev => ({
      ...prev,
      words,
      results,
      currentWordIndex: firstWordIndex === -1 ? words.length : firstWordIndex,
      isComplete: false,
      score: '',
      errorMessage: ''
    }));
  };

  const setupSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setSpeechState(prev => ({
        ...prev,
        errorMessage: "Speech recognition not supported in this browser."
      }));
      return;
    }

    const newRecognition = new SpeechRecognition();
    newRecognition.lang = "en-US";
    newRecognition.continuous = true;
    newRecognition.interimResults = false;

    const levels = {
      L1: { name: "Beginner", delay: 500 },
      L2: { name: "Advance", delay: 300 },
      L3: { name: "Expert", delay: 300, fullSentence: true }
    };

    newRecognition.onstart = () => {
      setSpeechState(prev => ({
        ...prev,
        recognizing: true,
        errorMessage: '',
        canValidate: false
      }));
      
      setTimeout(() => {
        setSpeechState(prev => ({ ...prev, canValidate: true }));
        
        // Start timeout for first word (not for expert mode)
        if (currentLevel !== 'L3') {
          setSpeechState(prevState => {
            if (prevState.currentWordIndex < prevState.words.length) {
              startWordTimeout(prevState.currentWordIndex);
            }
            return prevState;
          });
        }
      }, levels[currentLevel].delay);
    };

    newRecognition.onend = () => {
      if (wordTimeout) {
        clearTimeout(wordTimeout);
        setWordTimeoutState(null);
      }
      
      setSpeechState(prevState => {
        if (autoRestartEnabled && 
            prevState.currentWordIndex < prevState.words.length && 
            currentLevel !== 'L3' && 
            !prevState.isComplete) {
          
          setTimeout(() => {
            if (newRecognition && autoRestartEnabled) {
              try {
                newRecognition.start();
              } catch (e) {
                console.log("Recognition restart failed:", e);
              }
            }
          }, 100);
          
          return { ...prevState, recognizing: autoRestartEnabled };
        }
        return { ...prevState, recognizing: false };
      });
    };

    newRecognition.onerror = (e) => {
      console.log("Recognition error:", e.error);
      setSpeechState(prev => ({
        ...prev,
        recognizing: false,
        errorMessage: `Error: ${e.error}. Please try again.`
      }));
      
      if (autoRestartEnabled && !['no-speech', 'aborted'].includes(e.error)) {
        setTimeout(() => {
          if (newRecognition && autoRestartEnabled) {
            try {
              newRecognition.start();
            } catch (error) {
              console.log("Error restart failed:", error);
            }
          }
        }, 500);
      }
    };

    newRecognition.onresult = (e) => {
      setSpeechState(prevState => {
        if (!prevState.canValidate) return prevState;
        
        let finalTranscript = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) {
            finalTranscript += e.results[i][0].transcript + " ";
          }
        }
        
        if (finalTranscript.trim()) {
          validateWord(finalTranscript.trim());
        }
        
        return prevState;
      });
    };

    setRecognition(newRecognition);
  };

  const startWordTimeout = (wordIndex) => {
    const timeout = setTimeout(() => {
      setSpeechState(prevState => {
        if (wordIndex !== prevState.currentWordIndex || 
            wordIndex >= prevState.words.length) {
          return prevState;
        }
        
        const newResults = [...prevState.results];
        newResults[wordIndex] = "wrong";
        
        // Move to next word
        let nextIndex = wordIndex + 1;
        while (nextIndex < prevState.words.length && 
               prevState.words[nextIndex].length <= 2) {
          newResults[nextIndex] = "correct";
          nextIndex++;
        }
        
        // Check if completed
        if (nextIndex >= prevState.words.length) {
          const finalScore = newResults.filter(r => r === "correct").length;
          setTimeout(() => {
            recognition?.stop();
            setAutoRestartEnabled(false);
            setSpeechState(prev => ({
              ...prev,
              recognizing: false,
              isComplete: true,
              score: `🎉 Final Score: ${finalScore}/${prevState.words.length}`
            }));
          }, 1000);
        } else {
          startWordTimeout(nextIndex);
        }
        
        return {
          ...prevState,
          results: newResults,
          currentWordIndex: nextIndex,
          score: `⏰ Time's up! Expected "${prevState.words[wordIndex]}"`
        };
      });
    }, 5000);
    
    setWordTimeoutState(timeout);
  };

  const validateWord = (spoken) => {
    if (wordTimeout) {
      clearTimeout(wordTimeout);
      setWordTimeoutState(null);
    }
    
    setSpeechState(prevState => {
      const { words, currentWordIndex, results } = prevState;
      
      if (currentWordIndex >= words.length) return prevState;
      
      const newResults = [...results];
      let newWordIndex = currentWordIndex;
      let scoreMessage = "";
      
      if (currentLevel === 'L3') {
        // Expert mode - validate full sentence
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
        const accuracy = Math.round((correctCount / words.length) * 100);
        
        scoreMessage = accuracy >= 70 
          ? `🎉 Great! ${correctCount}/${words.length} words correct (${accuracy}%)`
          : `❌ ${correctCount}/${words.length} words correct (${accuracy}%). Try again!`;
          
      } else {
        // Regular mode - word by word
        const expected = words[currentWordIndex].toLowerCase();
        const spokenLower = spoken.toLowerCase().trim();
        
        const matched = spokenLower.includes(expected) || expected.includes(spokenLower);
        newResults[currentWordIndex] = matched ? "correct" : "wrong";
        
        // Move to next word
        let nextIndex = currentWordIndex + 1;
        while (nextIndex < words.length && words[nextIndex].length <= 2) {
          newResults[nextIndex] = "correct";
          nextIndex++;
        }
        newWordIndex = nextIndex;
        
        scoreMessage = matched 
          ? `✅ Correct! "${expected}"`
          : `❌ Said "${spokenLower}", expected "${expected}"`;
      }
      
      // Start timeout for next word (if not expert mode and not finished)
      if (newWordIndex < words.length && currentLevel !== 'L3') {
        startWordTimeout(newWordIndex);
      }
      
      // Check if all words completed
      if (newWordIndex >= words.length) {
        const finalScore = newResults.filter(r => r === "correct").length;
        setTimeout(() => {
          recognition?.stop();
          setAutoRestartEnabled(false);
          setSpeechState(prev => ({
            ...prev,
            recognizing: false,
            isComplete: true,
            score: `🎉 Final Score: ${finalScore}/${words.length}`
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

  const toggleRecognition = () => {
    if (speechState.recognizing) {
      recognition?.stop();
      setAutoRestartEnabled(false);
      if (wordTimeout) {
        clearTimeout(wordTimeout);
        setWordTimeoutState(null);
      }
    } else {
      if (speechState.currentWordIndex === 0 || speechState.isComplete) {
        initializeWords();
      }
      setAutoRestartEnabled(true);
      recognition?.start();
    }
  };

  const resetReading = () => {
    recognition?.stop();
    setAutoRestartEnabled(false);
    if (wordTimeout) {
      clearTimeout(wordTimeout);
      setWordTimeoutState(null);
    }
    initializeWords();
  };

  const getLevelInfo = () => {
    switch(currentLevel) {
      case 'L1': return 'Beginner (0.5s per word)';
      case 'L2': return 'Advance (0.3s per word)';
      case 'L3': return 'Expert (Full Text)';
      default: return '';
    }
  };

  if (!bookText) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <p>No text available. Please upload an image first.</p>
        <button onClick={onBack} style={{ 
          padding: '10px 20px', 
          background: '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '8px',
          cursor: 'pointer'
        }}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '20px' 
      }}>
        <button 
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          <Home size={16} />
          Back
        </button>
        <h2 style={{ margin: 0, color: '#333' }}>📖 Read My Book</h2>
        <div style={{ width: '80px' }}></div> {/* Spacer for centering */}
      </div>

      {/* Mobile Instructions */}
      <div style={{
        textAlign: 'center',
        marginBottom: '15px',
        padding: '10px',
        background: '#e8f5e8',
        borderRadius: '8px',
        fontSize: '14px'
      }}>
        📱 <strong>Mobile Users:</strong> Click "Start" - speak clearly and continuously!
      </div>

      {/* Level Selector */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <label style={{ marginRight: '10px', fontWeight: 'bold' }}>
          Choose Level:
        </label>
        <select 
          value={currentLevel}
          onChange={(e) => setCurrentLevel(e.target.value)}
          style={{
            padding: '8px 12px',
            fontSize: '16px',
            borderRadius: '6px',
            border: '1px solid #ddd'
          }}
        >
          <option value="L1">Beginner (0.5s per word)</option>
          <option value="L2">Advance (0.3s per word)</option>
          <option value="L3">Expert (Full Text)</option>
        </select>
      </div>

      {/* Level Info */}
      <div style={{
        textAlign: 'center',
        marginBottom: '15px',
        fontWeight: 'bold',
        color: '#007bff'
      }}>
        Level: {getLevelInfo()}
      </div>

      {/* Error Message */}
      {speechState.errorMessage && (
        <div style={{
          textAlign: 'center',
          marginBottom: '15px',
          padding: '10px',
          background: '#ffe6e6',
          borderRadius: '8px',
          color: '#cc0000'
        }}>
          {speechState.errorMessage}
        </div>
      )}

      {/* Words Display */}
      <div style={{
        textAlign: 'center',
        marginBottom: '20px',
        fontSize: '20px',
        lineHeight: '1.8',
        maxHeight: '300px',
        overflowY: 'auto',
        padding: '20px',
        background: '#f8f9fa',
        borderRadius: '10px',
        border: '1px solid #ddd'
      }}>
        {speechState.words.map((word, i) => (
          <span
            key={i}
            style={{
              display: 'inline-block',
              margin: '3px',
              padding: '4px 8px',
              borderRadius: '4px',
              background: 
                speechState.results[i] === "correct" ? '#d4edda' :
                speechState.results[i] === "wrong" ? '#f8d7da' :
                i === speechState.currentWordIndex ? '#fff3cd' : 'transparent',
              border: 
                speechState.results[i] === "correct" ? '1px solid #28a745' :
                speechState.results[i] === "wrong" ? '1px solid #dc3545' :
                i === speechState.currentWordIndex ? '2px solid #ffc107' : '1px solid transparent',
              color:
                speechState.results[i] === "correct" ? '#155724' :
                speechState.results[i] === "wrong" ? '#721c24' : '#333',
              fontWeight: i === speechState.currentWordIndex ? 'bold' : 'normal',
              transform: i === speechState.currentWordIndex ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 0.3s ease'
            }}
          >
            {word}
          </span>
        ))}
      </div>

      {/* Score Display */}
      <div style={{
        textAlign: 'center',
        marginBottom: '20px',
        fontSize: '16px',
        fontWeight: 'bold',
        minHeight: '25px',
        color: '#333'
      }}>
        {speechState.score}
      </div>

      {/* Controls */}
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <button 
          onClick={toggleRecognition}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '15px 25px',
            fontSize: '16px',
            border: 'none',
            borderRadius: '10px',
            background: speechState.recognizing ? '#dc3545' : '#007bff',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {speechState.recognizing ? '🛑 Stop' : '🎤 Start Reading'}
        </button>

        <button 
          onClick={resetReading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '15px 25px',
            fontSize: '16px',
            border: 'none',
            borderRadius: '10px',
            background: '#28a745',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          <RotateCcw size={16} />
          Reset
        </button>
      </div>

      {/* Completion Message */}
      {speechState.isComplete && (
        <div style={{
          textAlign: 'center',
          marginTop: '30px',
          padding: '20px',
          background: '#d4edda',
          borderRadius: '10px',
          border: '1px solid #28a745'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#155724' }}>
            🎉 Reading Complete!
          </h3>
          <p style={{ margin: 0, color: '#155724' }}>
            Great job! You've finished reading your book.
          </p>
        </div>
      )}
    </div>
  );
};

export default ReadMyBook;