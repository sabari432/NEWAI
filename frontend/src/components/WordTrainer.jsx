import React, { useState, useEffect } from 'react';
import './WordTrainer.css';

const WordTrainer = () => {
  const [currentSentence, setCurrentSentence] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);
  const [gameStarted, setGameStarted] = useState(false);
  const [sentenceComplete, setSentenceComplete] = useState(false);
  
  // ✅ NEW: State for speech recognition
  const [recognition, setRecognition] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [browserSupported, setBrowserSupported] = useState(false);

  const [words, setWords] = useState([
    ['The', 'boy', 'is', 'walking', 'on', 'the', 'street', 'with', 'a', 'dog'],
    ['She', 'loves', 'to', 'read', 'books', 'in', 'the', 'library'],
    ['We', 'are', 'going', 'to', 'the', 'park', 'tomorrow']
  ]);

  const [wordStatus, setWordStatus] = useState({});
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState('Checking browser compatibility...');

  // ✅ Initialize speech recognition on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false; // ✅ Changed to false - restart manually
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'en-US';
        recognitionInstance.maxAlternatives = 1;
        
        recognitionInstance.onresult = (event) => {
          let finalTranscript = '';
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          const fullTranscript = finalTranscript || interimTranscript;
          setTranscript(fullTranscript);
          console.log('Speech result:', fullTranscript); // ✅ Debug log
        };
        
        recognitionInstance.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'no-speech') {
            setStatus('❌ No speech detected. Try speaking louder.');
          } else if (event.error === 'network') {
            setStatus('❌ Network error. Check your connection.');
          } else {
            setStatus(`❌ Speech recognition error: ${event.error}`);
          }
          setIsListening(false);
        };
        
        recognitionInstance.onend = () => {
          console.log('Recognition ended'); // ✅ Debug log
          // Don't automatically set isListening to false here
          // Let the timer or word detection handle it
        };
        
        recognitionInstance.onstart = () => {
          console.log('Recognition started'); // ✅ Debug log
        };
        
        setRecognition(recognitionInstance);
        setBrowserSupported(true);
        setStatus('Click "Start Word Test" to begin');
      } else {
        setBrowserSupported(false);
        setStatus('❌ Your browser does not support speech recognition. Please use Chrome, Edge, or Safari.');
      }
    }
  }, []);

  // ✅ Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const parsed = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(sentence => sentence.replace(/[^\w\s]/g, '').split(' '));
      setWords(parsed);
      setCurrentSentence(0);
      setCurrentWordIndex(0);
      setSentenceComplete(false);
      setGameStarted(false);
      setStatus('📝 New paragraph uploaded. Click "Start Word Test" to begin');
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    let timer;
    if (isListening && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (isListening && timeLeft === 0) {
      handleIncorrectWord();
    }
    return () => clearTimeout(timer);
  }, [isListening, timeLeft]);

  useEffect(() => {
    if (!transcript || !isListening) return;
    
    const spokenWord = transcript.trim().toLowerCase();
    const expectedWord = words[currentSentence][currentWordIndex].toLowerCase();
    
    console.log('Comparing:', spokenWord, 'vs', expectedWord); // ✅ Debug log
    
    // ✅ More flexible matching
    if (spokenWord.includes(expectedWord) || 
        expectedWord.includes(spokenWord) ||
        spokenWord === expectedWord) {
      handleCorrectWord();
    }
  }, [transcript, isListening, currentWordIndex, currentSentence]);

  const startWordTest = async () => {
    if (!browserSupported || !recognition) {
      setStatus('❌ Speech recognition not available');
      return;
    }

    try {
      // ✅ Request microphone permission explicitly
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Release the stream
      
      setGameStarted(true);
      setCurrentWordIndex(0);
      setWordStatus({});
      setScore(0);
      setSentenceComplete(false);
      startListeningToWord();
    } catch (error) {
      console.error('Microphone access error:', error);
      setStatus('❌ Microphone access denied. Please allow microphone access and refresh the page.');
    }
  };

  const startListeningToWord = () => {
    if (currentWordIndex >= words[currentSentence].length) {
      completeSentence();
      return;
    }

    const currentWord = words[currentSentence][currentWordIndex];
    setStatus(`🎤 Say the word: "${currentWord}"`);
    setIsListening(true);
    setTimeLeft(5);
    setTranscript('');

    // ✅ Start recognition with better error handling and restart logic
    if (recognition) {
      try {
        recognition.stop(); // Stop any previous recognition
        setTimeout(() => {
          try {
            recognition.start();
            console.log('Started listening for:', currentWord); // ✅ Debug log
          } catch (error) {
            console.error('Failed to start recognition:', error);
            setStatus('❌ Failed to start speech recognition');
            setIsListening(false);
          }
        }, 100); // Small delay to ensure stop completes
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
  };

  const handleCorrectWord = () => {
    const wordKey = `${currentSentence}-${currentWordIndex}`;
    setWordStatus(prev => ({ ...prev, [wordKey]: 'correct' }));
    setScore(prev => prev + 1);
    setStatus('✅ Correct! Moving to next word...');
    
    // ✅ Properly stop recognition
    if (recognition && isListening) {
      try {
        recognition.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
    setIsListening(false);
    
    setTimeout(() => {
      setCurrentWordIndex(prev => prev + 1);
      setTimeout(startListeningToWord, 800); // ✅ Longer delay for stability
    }, 1200);
  };

  const handleIncorrectWord = () => {
    const wordKey = `${currentSentence}-${currentWordIndex}`;
    setWordStatus(prev => ({ ...prev, [wordKey]: 'incorrect' }));
    setStatus('❌ Time up or incorrect! Moving to next word...');
    
    // ✅ Properly stop recognition
    if (recognition && isListening) {
      try {
        recognition.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
    setIsListening(false);
    
    setTimeout(() => {
      setCurrentWordIndex(prev => prev + 1);
      setTimeout(startListeningToWord, 800); // ✅ Longer delay for stability
    }, 1200);
  };

  const completeSentence = () => {
    setSentenceComplete(true);
    setGameStarted(false);
    setIsListening(false);
    
    if (recognition) {
      recognition.stop();
    }

    const totalWords = words[currentSentence].length;
    const rawScore = score;
    const maxDisplayScore = 10;
    const scaledScore = ((rawScore / totalWords) * maxDisplayScore).toFixed(1);

    setStatus(`🎉 Sentence completed! Your score: ${scaledScore}/${maxDisplayScore}`);
  };

  const nextSentence = () => {
    if (currentSentence < words.length - 1) {
      setCurrentSentence(prev => prev + 1);
      setCurrentWordIndex(0);
      setWordStatus({});
      setScore(0);
      setSentenceComplete(false);
      setGameStarted(false);
      setStatus('Click "Start Word Test" to begin the next sentence');
    } else {
      setStatus('🎊 Congratulations! You have completed all sentences!');
    }
  };

  const getWordClassName = (sentenceIndex, wordIndex) => {
    const wordKey = `${sentenceIndex}-${wordIndex}`;
    const status = wordStatus[wordKey];
    let baseClass = 'word-box';
    if (gameStarted && sentenceIndex === currentSentence && wordIndex === currentWordIndex && isListening) {
      baseClass += ' active';
    } else if (status === 'correct') {
      baseClass += ' correct';
    } else if (status === 'incorrect') {
      baseClass += ' incorrect';
    }
    return baseClass;
  };

  return (
    <div className="word-trainer-container">
      {/* Browser compatibility warning */}
      {!browserSupported && (
        <div style={{ 
          backgroundColor: '#fee2e2', 
          border: '1px solid #fecaca', 
          padding: '16px', 
          margin: '10px',
          borderRadius: '8px',
          color: '#dc2626'
        }}>
          <strong>⚠️ Browser Not Supported</strong>
          <p>This app requires speech recognition. Please use:</p>
          <ul>
            <li>Google Chrome (recommended)</li>
            <li>Microsoft Edge</li>
            <li>Safari (latest version)</li>
          </ul>
        </div>
      )}

      {/* Upload button */}
      <div style={{ padding: '10px' }}>
        <label style={{ fontWeight: 'bold' }}>📤 Upload Paragraph File (txt): </label>
        <input type="file" accept=".txt" onChange={handleFileUpload} />
      </div>

      {/* Left Sidebar */}
      <div className="sidebar left-sidebar">
        <div className="sidebar-decoration">
          <div className="floating-element elem-1"></div>
          <div className="floating-element elem-2"></div>
          <div className="floating-element elem-3"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <div className="header">
          <h1 className="title">
            <span className="title-icon">🎯</span>
            Word Trainer Pro
          </h1>
          <div className="status-card">
            <p className="status">{status}</p>
          </div>
        </div>

        {/* Progress Info */}
        <div className="progress-section">
          <div className="progress-info">
            <div className="sentence-counter">
              <span className="counter-label">Sentence</span>
              <span className="counter-value">{currentSentence + 1}</span>
              <span className="counter-total">of {words.length}</span>
            </div>
            {gameStarted && !sentenceComplete && (
              <div className="score-display-live">
                <span className="score-label">Score:</span>
                <span className="score-value">{score}/{words[currentSentence].length}</span>
              </div>
            )}
          </div>
          
          {isListening && (
            <div className="timer-container">
              <div className="timer-display">
                <span className="timer-icon">⏱️</span>
                <span className="timer-text">{timeLeft}s</span>
              </div>
              <div className="timer-bar">
                <div 
                  className="timer-fill" 
                  style={{ 
                    width: `${(timeLeft / 5) * 100}%`,
                    backgroundColor: timeLeft <= 2 ? '#ef4444' : timeLeft <= 3 ? '#f59e0b' : '#10b981'
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Word Grid */}
        <div className="word-grid">
          {words[currentSentence].map((word, index) => (
            <div
              key={index}
              className={getWordClassName(currentSentence, index)}
            >
              <span className="word-text">{word}</span>
              {wordStatus[`${currentSentence}-${index}`] === 'correct' && (
                <span className="word-status correct-icon">✓</span>
              )}
              {wordStatus[`${currentSentence}-${index}`] === 'incorrect' && (
                <span className="word-status incorrect-icon">✗</span>
              )}
            </div>
          ))}
        </div>

        {/* Control Panel */}
        <div className="control-panel">
          {!gameStarted && !sentenceComplete && (
            <button 
              onClick={startWordTest}
              className="btn-primary"
              disabled={!browserSupported}
            >
              <span className="btn-icon">🚀</span>
              Start Word Test
            </button>
          )}
          
          {sentenceComplete && (
            <div className="results-container">
              <div className="results-card">
                <div className="results-header">
                  <h3>🎉 Results</h3>
                </div>
                <div className="results-stats">
                  <div className="stat-item">
                    <span className="stat-label">Score</span>
                   <span className="stat-value">
                    {(score / words[currentSentence].length * 10).toFixed(1)} / 10
                  </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Accuracy</span>
                    <span className="stat-value">{Math.round((score / words[currentSentence].length) * 100)}%</span>
                  </div>
                </div>
                <div className="accuracy-bar">
                  <div 
                    className="accuracy-fill" 
                    style={{ 
                      width: `${(score / words[currentSentence].length) * 100}%`,
                      backgroundColor: (score / words[currentSentence].length) >= 0.8 ? '#10b981' : 
                                     (score / words[currentSentence].length) >= 0.6 ? '#f59e0b' : '#ef4444'
                    }}
                  ></div>
                </div>
              </div>
              
              {currentSentence < words.length - 1 ? (
                <button onClick={nextSentence} className="btn-next">
                  <span className="btn-icon">➡️</span>
                  Next Sentence
                </button>
              ) : (
                <div className="completion-message">
                  <span className="completion-icon">🏆</span>
                  All sentences completed!
                  <span className="celebration">🎊</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Current Word Display */}
        {isListening && (
          <div className="current-word-section">
            <div className="current-word-card">
              <p className="current-word-label">Currently testing:</p>
              <h2 className="current-word-display">"{words[currentSentence][currentWordIndex]}"</h2>
              <div className="transcript-section">
                <p className="transcript-label">You said:</p>
                <p className="transcript-text">"{transcript || '...'}"</p>
              </div>
              <div className="listening-indicator">
                <div className="pulse-dot"></div>
                <span>Listening...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="sidebar right-sidebar">
        <div className="sidebar-decoration">
          <div className="floating-element elem-4"></div>
          <div className="floating-element elem-5"></div>
          <div className="floating-element elem-6"></div>
        </div>
      </div>
    </div>
  );
};

export default WordTrainer;