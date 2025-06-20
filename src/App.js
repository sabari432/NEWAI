import React, { useEffect } from "react";
import IncorrectWordHandler from './incorrect.js';

function App() {
  useEffect(() => {
    const sentences = [
      "the boy is walking with dog",
      "Kids learn better when having fun so engaging them in games is the best way to teach them English",
      "Say the word you see highlighted",
    ];

    // Level system configuration
    const levels = {
      L1: { name: "Beginner", delay: 3000, nextWordDelay: 3000 },
      L2: { name: "Faster", delay: 1000, nextWordDelay: 1000 },
      L3: { name: "Advanced", delay: 400, nextWordDelay: 400 },
      L4: { name: "Expert", delay: 1, nextWordDelay: 1 }
    };

    let incorrectHandler = null;
    let currentLevel = 'L1';
    let sentenceIndex = 0,
      words = [],
      currentWordIndex = 0,
      results = [];
    let recognition,
      recognizing = false,
      canValidate = false,
      startTime = 0,
      restartTimeout = null,
      isCapacitor = false,
      speechRecognition = null;

    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Check if running in Capacitor
    const checkCapacitor = () => {
      return !!(window.Capacitor || window.capacitor);
    };

    const wordsDiv = document.getElementById("words");
    const scoreDiv = document.getElementById("score");
    const nextBtn = document.getElementById("next_button");
    const startBtn = document.getElementById("start_button");
    const errorDiv = document.getElementById("errorMessage");
    const browserInfoDiv = document.getElementById("browserInfo");
    const levelSelect = document.getElementById("levelSelect");
    const levelInfo = document.getElementById("levelInfo");

    function updateLevelInfo() {
      const levelName = levels[currentLevel].name;
      const speed = currentLevel === 'L4' ? 'Instant!' : `${levels[currentLevel].delay}ms`;
      levelInfo.textContent = `Level: ${levelName} (${speed})`;
    }

    function initWords() {
      words = sentences[sentenceIndex].split(" ");
      results = Array(words.length).fill(null);
      currentWordIndex = 0;
      renderWords();
    }

    function renderWords() {
      wordsDiv.innerHTML = "";
      words.forEach((word, i) => {
        const span = document.createElement("span");
        span.textContent = word;
        span.className = "word";
        if (results[i] === "correct") span.classList.add("correct");
        else if (results[i] === "wrong") span.classList.add("wrong");
        else if (i === currentWordIndex) span.classList.add("highlight");
        wordsDiv.appendChild(span);
      });
    }

    function showError(msg) {
      errorDiv.textContent = msg;
      errorDiv.style.display = "block";
      setTimeout(() => {
        errorDiv.style.display = "none";
      }, 4000);
    }

    function resetUI() {
      recognizing = false;
      startBtn.textContent = "🎤 Start";
      startBtn.className = "";
      canValidate = false;
      if (restartTimeout) {
        clearTimeout(restartTimeout);
        restartTimeout = null;
      }
    }

    async function stopRecognition() {
      if (recognizing) {
        try {
          if (isCapacitor && speechRecognition) {
            await speechRecognition.stop();
          } else if (recognition) {
            recognition.abort();
          }
        } catch (e) {
          console.log("Error stopping recognition:", e);
        }
      }
      resetUI();
    }

    // Capacitor Speech Recognition Setup
    async function initCapacitorSpeech() {
      try {
        const { SpeechRecognition } = await import('@capacitor-community/speech-recognition');
        speechRecognition = SpeechRecognition;
        
        // Request permissions
        const permissions = await speechRecognition.requestPermissions();
        if (permissions.speechRecognition !== 'granted') {
          throw new Error('Speech recognition permission not granted');
        }

        // Check availability
        const available = await speechRecognition.available();
        if (!available.available) {
          throw new Error('Speech recognition not available');
        }

        return true;
      } catch (e) {
        console.log("Capacitor speech not available:", e);
        return false;
      }
    }

    // Enhanced mobile speech recognition with shorter listening sessions
    async function startMobileSpeechRecognition() {
      if (isCapacitor && speechRecognition) {
        return await startCapacitorRecognition();
      }
      
      // Mobile web speech recognition - shorter sessions
      if (!recognition) {
        showError("Speech recognition not supported.");
        return false;
      }
      
      try {
        if (currentWordIndex === 0) {
          initWords();
        }
        
        errorDiv.style.display = "none";
        
        if (restartTimeout) {
          clearTimeout(restartTimeout);
          restartTimeout = null;
        }

        // Mobile-specific settings for better reliability
        recognition.continuous = false; // Short sessions for mobile
        recognition.interimResults = false; // Disable interim for mobile
        recognition.maxAlternatives = 3; // More alternatives for mobile

        recognizing = true;
        startTime = Date.now();
        canValidate = false;
        
        startBtn.textContent = "🛑 Stop";
        startBtn.className = "stop-btn";
        scoreDiv.textContent = "🎤 Starting...";
        
        recognition.start();
        
        // Shorter delay for mobile
        setTimeout(() => {
          canValidate = true;
          if (recognizing) {
            scoreDiv.textContent = `🎤 Say: "${words[currentWordIndex]}"`;
          }
        }, levels[currentLevel].delay);
        
        return true;
      } catch (e) {
        showError("Failed to start: " + e.message);
        resetUI();
        return false;
      }
    }

    // Capacitor Speech Recognition Start
    async function startCapacitorRecognition() {
      if (!speechRecognition) return false;
      
      try {
        const options = {
          language: 'en-US',
          maxResults: 5,
          prompt: `Say: "${words[currentWordIndex]}"`,
          partialResults: false, // Disable for consistency
          popup: false
        };

        recognizing = true;
        startTime = Date.now();
        canValidate = true;
        
        startBtn.textContent = "🛑 Stop";
        startBtn.className = "stop-btn";
        scoreDiv.textContent = `🎤 Listening... Say: "${words[currentWordIndex]}"`;

        const result = await speechRecognition.listen(options);
        
        if (result && result.matches && result.matches.length > 0) {
          const transcript = result.matches[0];
          console.log("Capacitor transcript:", transcript);
          window.validateWord(transcript);
        } else {
          showError("No speech detected. Try again.");
          resetUI();
        }
        
        return true;
      } catch (e) {
        console.log("Capacitor recognition error:", e);
        showError("Speech error: " + e.message);
        resetUI();
        return false;
      }
    }

    window.toggleRecognition = async function () {
      if (recognizing) {
        await stopRecognition();
        return;
      }

      // Different approach for mobile vs desktop
      if (isMobile || isCapacitor) {
        await startMobileSpeechRecognition();
      } else {
        startDesktopRecognition();
      }
    };

    function startDesktopRecognition() {
      try {
        if (currentWordIndex === 0) {
          initWords();
        }
        
        errorDiv.style.display = "none";
        
        if (restartTimeout) {
          clearTimeout(restartTimeout);
          restartTimeout = null;
        }

        // Desktop settings - continuous listening
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognizing = true;
        startTime = Date.now();
        canValidate = false;
        
        startBtn.textContent = "🛑 Stop";
        startBtn.className = "stop-btn";
        scoreDiv.textContent = "🎤 Starting...";
        
        recognition.start();
        
        // Level-based delay
        setTimeout(() => {
          canValidate = true;
          if (recognizing) {
            scoreDiv.textContent = `🎤 Say: "${words[currentWordIndex]}"`;
          }
        }, levels[currentLevel].delay);
        
      } catch (e) {
        showError("Failed to start: " + e.message);
        resetUI();
      }
    }

    window.validateWord = function (spoken) {
      if (!canValidate || currentWordIndex >= words.length) return;
      
      const expected = words[currentWordIndex].toLowerCase();
      const spokenLower = spoken.toLowerCase().trim();
      const spokenWords = spokenLower.split(/\s+/);
      
      // Enhanced matching for mobile/Capacitor
      const matched = spokenWords.some(word => {
        return word === expected || 
               word.includes(expected) || 
               expected.includes(word) ||
               (word.length >= 3 && expected.length >= 3 && 
                (word.startsWith(expected.substring(0, 3)) || 
                 expected.startsWith(word.substring(0, 3)))) ||
               // Phonetic similarity for common speech recognition errors
               (word.replace(/s$/i, '') === expected.replace(/s$/i, '')) ||
               (word.replace(/ed$/i, '') === expected.replace(/ed$/i, ''));
      });
      
      results[currentWordIndex] = matched ? "correct" : "wrong";
      
      // Show result immediately for expert level, or with brief delay for others
      const resultDisplayDelay = currentLevel === 'L4' ? 1 : 500;
      
      setTimeout(() => {
        scoreDiv.textContent = matched
          ? `✅ Correct! "${expected}"`
          : `❌ Said "${spokenLower}", expected "${expected}"`;
      }, resultDisplayDelay);
      
      currentWordIndex++;
      renderWords();

    if (currentWordIndex >= words.length) {
  // Sentence complete
  setTimeout(() => {
    stopRecognition();
    const score = results.filter((r) => r === "correct").length;
    const totalWords = words.length;
    
    // Get incorrect words
    const incorrectWords = words.filter((word, index) => results[index] === "wrong");
    
    scoreDiv.textContent = `🎉 Score: ${score}/${totalWords}`;
    
    // Check if there are incorrect words and ask for retry
    if (incorrectWords.length > 0) {
      setTimeout(() => {
        if (!incorrectHandler) {
          incorrectHandler = new IncorrectWordHandler();
        }
        
        incorrectHandler.init(incorrectWords, () => {
          // This callback runs after retry is complete or skipped
          nextBtn.style.display = sentenceIndex < sentences.length - 1 ? "inline-block" : "none";
          incorrectHandler = null;
        });
      }, 1000);
    } else {
      // No incorrect words, show next button directly
      nextBtn.style.display = sentenceIndex < sentences.length - 1 ? "inline-block" : "none";
    }
  }, resultDisplayDelay);
  return;
}
      // Continue to next word with level-based delay
      const totalDelay = resultDisplayDelay + levels[currentLevel].nextWordDelay;
      setTimeout(() => {
        if (recognizing && currentWordIndex < words.length) {
          scoreDiv.textContent = `🎤 Say: "${words[currentWordIndex]}"`;
          
          // For mobile, restart recognition for next word
          if (isMobile && !isCapacitor && recognition) {
            try {
              recognition.start();
            } catch (e) {
              console.log("Restart error:", e);
            }
          }
        }
      }, totalDelay);
    };

    window.nextSentence = function () {
      if (sentenceIndex < sentences.length - 1) {
        sentenceIndex++;
        initWords();
        nextBtn.style.display = "none";
        scoreDiv.textContent = "";
        resetUI();
      }
    };

    window.changeLevel = function(level) {
      currentLevel = level;
      updateLevelInfo();
      if (recognizing) {
        stopRecognition();
      }
    };

    const handleFileUpload = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = function (evt) {
        const text = evt.target.result.trim();
        if (text) {
          sentences.push(text);
          scoreDiv.textContent = "✅ New sentence added!";
          setTimeout(() => (scoreDiv.textContent = ""), 2000);
        }
      };
      reader.readAsText(file);
    };

    async function setupSpeechRecognition() {
      // Check if running in Capacitor
      isCapacitor = checkCapacitor();
      
      if (isCapacitor) {
        console.log("Running in Capacitor app");
        const capacitorReady = await initCapacitorSpeech();
        if (capacitorReady) {
          browserInfoDiv.textContent = "📱 Capacitor App: Tap Start → Speak clearly";
          initWords();
          updateLevelInfo();
          return;
        } else {
          console.log("Capacitor speech failed, falling back to web");
        }
      }

      // Fallback to web speech recognition
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        showError("Speech recognition not supported in this browser.");
        startBtn.disabled = true;
        browserInfoDiv.textContent = "❌ Speech recognition not supported";
        return;
      }

      recognition = new SR();
      recognition.lang = "en-US";
      
      if (isMobile) {
        browserInfoDiv.textContent = "📱 Mobile: Tap Start → Speak word → Auto-restart";
        // Mobile-specific settings
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 3;
      } else {
        browserInfoDiv.textContent = "🖥️ Desktop: Click Start → Continuous listening";
        // Desktop settings
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
      }

      recognition.onstart = () => {
        console.log("Recognition started");
        recognizing = true;
        startTime = Date.now();
        startBtn.textContent = "🛑 Stop";
        startBtn.className = "stop-btn";
        
        scoreDiv.textContent = "🎤 Starting...";
        setTimeout(() => {
          canValidate = true;
          if (recognizing) {
            scoreDiv.textContent = `🎤 Say: "${words[currentWordIndex]}"`;
          }
        }, levels[currentLevel].delay);
      };

      recognition.onerror = (e) => {
        console.log("Web recognition error:", e.error);
        
        const errorMessages = {
          'no-speech': "No speech detected. Try speaking louder.",
          'audio-capture': "Microphone not accessible. Check permissions.",
          'not-allowed': "Microphone permission denied. Please allow and refresh.",
          'network': "Network error. Check your connection.",
          
        };
        
        const message = errorMessages[e.error] || `Error: ${e.error}. Try again.`;
        if (message) showError(message);
        
        resetUI();
      };

      recognition.onend = () => {
        console.log("Recognition ended");
        
        // Different behavior for mobile vs desktop
        if (isMobile) {
          // Mobile: only restart if we're still in the middle of a sentence
          if (recognizing && currentWordIndex < words.length) {
            // Don't auto-restart immediately, wait for next word timing
            console.log("Mobile: Waiting for next word timing");
          } else if (recognizing) {
            resetUI();
          }
        } else {
          // Desktop: auto-restart for continuous listening
          if (recognizing && currentWordIndex < words.length) {
            restartTimeout = setTimeout(() => {
              if (recognizing) {
                try {
                  recognition.start();
                  console.log("Auto-restarted recognition");
                } catch (e) {
                  console.log("Restart error:", e);
                  resetUI();
                }
              }
            }, 100);
          } else if (recognizing) {
            resetUI();
          }
        }
      };

      recognition.onresult = (e) => {
        if (!canValidate || !recognizing) return;
        
        let finalTranscript = "";
        let interimTranscript = "";
        
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const transcript = e.results[i][0].transcript;
          if (e.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript + " ";
          }
        }
        
        // Process final results immediately
        if (finalTranscript.trim()) {
          console.log("Final transcript:", finalTranscript.trim());
          window.validateWord(finalTranscript.trim());
        }
        // Show interim results for feedback (desktop only)
        else if (interimTranscript.trim() && !isMobile) {
          console.log("Interim:", interimTranscript.trim());
          scoreDiv.textContent = `🎤 Hearing: "${interimTranscript.trim()}"`;
        }
      };

      const uploadInput = document.getElementById("uploadTxt");
      if (uploadInput) {
        uploadInput.addEventListener("change", handleFileUpload);
      }
      
      // Setup level selector
      if (levelSelect) {
        levelSelect.addEventListener("change", (e) => {
          window.changeLevel(e.target.value);
        });
      }
      
      initWords();
      updateLevelInfo();
    }

    // Initialize everything
    setupSpeechRecognition();
    
    // Cleanup
    return () => {
      if (isCapacitor && speechRecognition) {
        try {
          speechRecognition.stop();
        } catch (e) {}
      } else if (recognition) {
        try {
          recognition.abort();
        } catch (e) {}
      }
      if (restartTimeout) {
        clearTimeout(restartTimeout);
      }
    };
    return () => {
  if (incorrectHandler) {
    incorrectHandler.cleanup();
  }
  if (isCapacitor && speechRecognition) {
    try {
      speechRecognition.stop();
    } catch (e) {}
  } else if (recognition) {
    try {
      recognition.abort();
    } catch (e) {}
  }
  if (restartTimeout) {
    clearTimeout(restartTimeout);
  }
};
    
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", color: "#333" }}>👧👦 Kids Speech Buddy 🎤</h1>
      <p style={{ textAlign: "center", color: "#666" }}>Say the word you see highlighted!</p>
      
      {/* Level Selector */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <label htmlFor="levelSelect" style={{ marginRight: "10px", fontWeight: "bold" }}>Choose Level:</label>
        <select id="levelSelect" defaultValue="L1" style={{ padding: "5px", fontSize: "16px" }}>
          <option value="L1">L1 - Beginner (800ms)</option>
          <option value="L2">L2 - Faster (600ms)</option>
          <option value="L3">L3 - Advanced (400ms)</option>
          <option value="L4">L4 - Expert (Instant!)</option>
        </select>
      </div>
      
      <div id="levelInfo" style={{ textAlign: "center", marginBottom: "15px", fontWeight: "bold", color: "#007bff" }}>
        Level: Beginner (800ms response)
      </div>
      
      <div id="browserInfo" style={{ textAlign: "center", marginBottom: "15px", padding: "10px", backgroundColor: "#e7f3ff", borderRadius: "5px", color: "#0066cc" }}>
        Loading...
      </div>
      
      <div id="errorMessage" style={{ display: "none", textAlign: "center", marginBottom: "15px", padding: "10px", backgroundColor: "#ffe6e6", borderRadius: "5px", color: "#cc0000" }}>
      </div>
      
      <div id="words" style={{ textAlign: "center", marginBottom: "20px", fontSize: "24px", lineHeight: "1.5" }}>
      </div>
      
      <div id="score" style={{ textAlign: "center", marginBottom: "20px", fontSize: "18px", fontWeight: "bold", minHeight: "25px" }}>
      </div>
      
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <button id="start_button" onClick={() => window.toggleRecognition && window.toggleRecognition()} 
                style={{ padding: "15px 30px", fontSize: "18px", border: "none", borderRadius: "5px", backgroundColor: "#007bff", color: "white", cursor: "pointer" }}>
          🎤 Start
        </button>
      </div>
      
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <button id="next_button" style={{ display: "none", padding: "10px 20px", fontSize: "16px", border: "none", borderRadius: "5px", backgroundColor: "#28a745", color: "white", cursor: "pointer" }}
                onClick={() => window.nextSentence && window.nextSentence()}>
          ➡️ Next Sentence
        </button>
      </div>
      
      <div style={{ textAlign: "center" }}>
        <input type="file" id="uploadTxt" accept=".txt" style={{ padding: "5px" }} />
        <label htmlFor="uploadTxt" style={{ marginLeft: "10px", color: "#666" }}>Upload custom sentence</label>
      </div>

      <style jsx>{`
        .word {
          display: inline-block;
          margin: 5px;
          padding: 8px 12px;
          border-radius: 5px;
          background-color: #f8f9fa;
          border: 2px solid #dee2e6;
          transition: all 0.3s ease;
        }
        .word.highlight {
          background-color: #fff3cd;
          border-color: #ffc107;
          transform: scale(1.1);
          font-weight: bold;
        }
        .word.correct {
          background-color: #d4edda;
          border-color: #28a745;
          color: #155724;
        }
        .word.wrong {
          background-color: #f8d7da;
          border-color: #dc3545;
          color: #721c24;
        }
        .stop-btn {
          background-color: #dc3545 !important;
        }
        .stop-btn:hover {
          background-color: #c82333 !important;
        }
        button:hover {
          opacity: 0.9;
        }
        button:active {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
}

export default App;