import React, { useEffect } from "react";

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
  useEffect(() => {
    const sentences = [
      "Many children play cricket in an empty ground after finishing homework",
    ];

    // Optimized 3-level system with mobile-friendly settings
    const levels = {
      L1: { name: "Beginner", delay: 500, nextWordDelay: 800 }, // Much faster for mobile
      L2: { name: "Advance", delay: 300, nextWordDelay: 500 },
      L3: { name: "Expert", delay: 300, nextWordDelay: 1, fullSentence: true }
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
      speechRecognition = null,
      autoRestartEnabled = false;

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
    const levelSelect = document.getElementById("levelSelect");
    const levelInfo = document.getElementById("levelInfo");

    function updateLevelInfo() {
      const levelName = levels[currentLevel].name;
      if (currentLevel === 'L3') {
        levelInfo.textContent = `Level: ${levelName} (Full Sentence Mode)`;
      } else {
        const speed = `${levels[currentLevel].delay / 1000}s per word`;
        levelInfo.textContent = `Level: ${levelName} (${speed})`;
      }
    }

    function initWords() {
      words = sentences[sentenceIndex].split(" ");
      results = Array(words.length).fill(null);
      currentWordIndex = 0;
      
      // Auto-mark words with 2 letters or fewer as correct
      words.forEach((word, index) => {
        if (word.length <= 2 ) {
          results[index] = "correct";
        }
      });
      
      // Find first word that needs validation (more than 2 letters)
      currentWordIndex = words.findIndex((word, index) => word.length > 2 && results[index] === null);
      if (currentWordIndex === -1) {
        // All words are 2 letters or fewer, complete the sentence
        currentWordIndex = words.length;
      }
      
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
        else if (currentLevel === 'L3' && recognizing) span.classList.add("sentence-highlight");
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
      autoRestartEnabled = false;
      startBtn.textContent = "🎤 Start";
      startBtn.className = "";
      canValidate = false;
      if (restartTimeout) {
        clearTimeout(restartTimeout);
        restartTimeout = null;
      }
    }

    async function stopRecognition() {
      autoRestartEnabled = false;
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

    // Mobile-optimized continuous speech recognition
    async function startMobileSpeechRecognition() {
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

        // Mobile-optimized settings for continuous recognition
        recognition.continuous = true; // Enable continuous for mobile too
        recognition.interimResults = false; // Keep false for stability
        recognition.maxAlternatives = 1;
        recognition.lang = "en-US";

        recognizing = true;
        autoRestartEnabled = true; // Enable auto-restart for mobile
        startTime = Date.now();
        canValidate = true; // Enable validation quickly for mobile
        
        startBtn.textContent = "🛑 Stop";
        startBtn.className = "stop-btn";
        
        if (currentLevel === 'L3') {
          scoreDiv.textContent = `🎤 Read the full sentence: "${sentences[sentenceIndex]}"`;
          renderWords();
        } else {
          scoreDiv.textContent = `🎤 Say: "${words[currentWordIndex]}"`;
        }
        
        recognition.start();
        
        return true;
      } catch (e) {
        showError("Failed to start: " + e.message);
        resetUI();
        return false;
      }
    }

    window.toggleRecognition = async function () {
      if (recognizing) {
        await stopRecognition();
        return;
      }

      if (isMobile) {
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

        // Desktop settings
        recognition.continuous = true;
        recognition.interimResults = currentLevel === 'L3';
        recognition.maxAlternatives = 1;

        recognizing = true;
        autoRestartEnabled = true;
        startTime = Date.now();
        canValidate = false;
        
        startBtn.textContent = "🛑 Stop";
        startBtn.className = "stop-btn";
        scoreDiv.textContent = "🎤 Starting...";
        
        recognition.start();
        
        setTimeout(() => {
          canValidate = true;
          if (recognizing) {
            if (currentLevel === 'L3') {
              scoreDiv.textContent = `🎤 Read the full sentence: "${sentences[sentenceIndex]}"`;
              renderWords();
            } else {
              scoreDiv.textContent = `🎤 Say: "${words[currentWordIndex]}"`;
            }
          }
        }, levels[currentLevel].delay);
        
      } catch (e) {
        showError("Failed to start: " + e.message);
        resetUI();
      }
    }

    // Enhanced validation with better mobile matching
    window.validateWord = function (spoken) {
      if (!canValidate || currentWordIndex >= words.length || currentLevel === 'L3') return;
      
      const expected = words[currentWordIndex].toLowerCase();
      const spokenLower = spoken.toLowerCase().trim();
      const spokenWords = spokenLower.split(/\s+/);
      
      console.log(`Validating word ${currentWordIndex}: spoken="${spokenLower}", expected="${expected}"`);
      
      // Enhanced matching logic - more lenient for mobile
      const matched = spokenWords.some(word => {
        // Exact match
        if (word === expected) return true;
        
        // Contains match (both directions)
        if (word.includes(expected) || expected.includes(word)) return true;
        
        // Partial match for longer words (more lenient)
        if (word.length >= 2 && expected.length >= 2) {
          if (word.substring(0, Math.min(3, word.length)) === expected.substring(0, Math.min(3, expected.length))) return true;
        }
        
        // Remove common suffixes and prefixes
        const wordBase = word.replace(/s$|ed$|ing$|ly$/i, '');
        const expectedBase = expected.replace(/s$|ed$|ing$|ly$/i, '');
        if (wordBase === expectedBase || wordBase.includes(expectedBase) || expectedBase.includes(wordBase)) return true;
        
        // Phonetic similarity (enhanced)
        const wordPhonetic = word.replace(/ph/g, 'f').replace(/th/g, 't').replace(/ck/g, 'k');
        const expectedPhonetic = expected.replace(/ph/g, 'f').replace(/th/g, 't').replace(/ck/g, 'k');
        if (wordPhonetic === expectedPhonetic) return true;
        
        // Sound-like matches
        if (word.length >= 3 && expected.length >= 3) {
          const similarity = getSimilarity(word, expected);
          if (similarity > 0.6) return true; // 60% similarity threshold
        }
        
        return false;
      });
      
      results[currentWordIndex] = matched ? "correct" : "wrong";
      
      const resultDisplayDelay = isMobile ? 100 : 200; // Faster feedback on mobile
      
      setTimeout(() => {
        scoreDiv.textContent = matched
          ? `✅ Correct! "${expected}"`
          : `❌ Said "${spokenLower}", expected "${expected}"`;
      }, resultDisplayDelay);
      
      // Move to next word that needs validation (skip 2-letter words)
      do {
        currentWordIndex++;
      } while (currentWordIndex < words.length && words[currentWordIndex].length <= 2);
      
      renderWords();

      if (currentWordIndex >= words.length) {
        // Sentence complete - stop everything
        autoRestartEnabled = false; // Stop auto-restart
        setTimeout(() => {
          stopRecognition();
          const score = results.filter((r) => r === "correct").length;
          const totalWords = words.length;
          
          const incorrectWords = words.filter((word, index) => results[index] === "wrong");
          
          scoreDiv.textContent = `🎉 Score: ${score}/${totalWords}`;
          
          if (incorrectWords.length > 0) {
            setTimeout(() => {
              if (!incorrectHandler) {
                incorrectHandler = new IncorrectWordHandler();
              }
              
              incorrectHandler.init(incorrectWords, () => {
                nextBtn.style.display = sentenceIndex < sentences.length - 1 ? "inline-block" : "none";
                incorrectHandler = null;
              });
            }, 1000);
          } else {
            nextBtn.style.display = sentenceIndex < sentences.length - 1 ? "inline-block" : "none";
          }
        }, resultDisplayDelay);
        return;
      }

      // Keep microphone active for next word
      console.log(`Moving to next word ${currentWordIndex}: "${words[currentWordIndex]}"`);
      
      // Show next word prompt immediately
      const totalDelay = resultDisplayDelay + levels[currentLevel].nextWordDelay;
      setTimeout(() => {
        if (recognizing && currentWordIndex < words.length) {
          scoreDiv.textContent = `🎤 Say: "${words[currentWordIndex]}"`;
          console.log("Ready for next word, mic should be active");
        }
      }, totalDelay);
    };

    // Similarity function for better word matching
    function getSimilarity(s1, s2) {
      let longer = s1;
      let shorter = s2;
      if (s1.length < s2.length) {
        longer = s2;
        shorter = s1;
      }
      const editDistance = getEditDistance(longer, shorter);
      return (longer.length - editDistance) / longer.length;
    }

    function getEditDistance(s1, s2) {
      const matrix = [];
      for (let i = 0; i <= s2.length; i++) {
        matrix[i] = [i];
      }
      for (let j = 0; j <= s1.length; j++) {
        matrix[0][j] = j;
      }
      for (let i = 1; i <= s2.length; i++) {
        for (let j = 1; j <= s1.length; j++) {
          if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
          }
        }
      }
      return matrix[s2.length][s1.length];
    }

    // Improved expert level full sentence validation
    window.validateFullSentence = function (spoken) {
      if (!canValidate || currentLevel !== 'L3') return;
      
      const spokenWords = spoken.toLowerCase().trim().split(/\s+/);
      const expectedWords = words.map(w => w.toLowerCase());
      
      console.log("Spoken words:", spokenWords.length, spokenWords);
      console.log("Expected words:", expectedWords.length, expectedWords);
      
      // Stop mic immediately
      stopRecognition();
      
      // More intelligent word alignment for expert level
      const alignedResults = alignWords(spokenWords, expectedWords);
      
      // Apply results
      expectedWords.forEach((expectedWord, index) => {
        if (results[index] !== "correct") { // Don't override auto-correct 2-letter words
          results[index] = alignedResults[index] ? "correct" : "wrong";
        }
      });
      
      currentWordIndex = words.length;
      renderWords();
      
      const score = results.filter((r) => r === "correct").length;
      const totalWords = words.length;
      scoreDiv.textContent = `🎉 Expert Score: ${score}/${totalWords}`;
      
      // Handle incorrect words for expert level too
      const incorrectWords = words.filter((word, index) => results[index] === "wrong");
      
      if (incorrectWords.length > 0) {
        setTimeout(() => {
          if (!incorrectHandler) {
            incorrectHandler = new IncorrectWordHandler();
          }
          
          incorrectHandler.init(incorrectWords, () => {
            nextBtn.style.display = sentenceIndex < sentences.length - 1 ? "inline-block" : "none";
            incorrectHandler = null;
          });
        }, 1000);
      } else {
        nextBtn.style.display = sentenceIndex < sentences.length - 1 ? "inline-block" : "none";
      }
    };

    // Smart word alignment for expert mode
    function alignWords(spoken, expected) {
      const results = new Array(expected.length).fill(false);
      const usedSpoken = new Array(spoken.length).fill(false);
      
      // First pass: exact matches
      for (let i = 0; i < expected.length; i++) {
        for (let j = 0; j < spoken.length; j++) {
          if (!usedSpoken[j] && spoken[j] === expected[i]) {
            results[i] = true;
            usedSpoken[j] = true;
            break;
          }
        }
      }
      
      // Second pass: similarity matches
      for (let i = 0; i < expected.length; i++) {
        if (!results[i]) {
          for (let j = 0; j < spoken.length; j++) {
            if (!usedSpoken[j]) {
              const similarity = getSimilarity(spoken[j], expected[i]);
              if (similarity > 0.5 || // 50% similarity
                  spoken[j].includes(expected[i]) || 
                  expected[i].includes(spoken[j])) {
                results[i] = true;
                usedSpoken[j] = true;
                break;
              }
            }
          }
        }
      }
      
      return results;
    }

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
      // Reset current sentence for new level
      initWords();
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
      // Web speech recognition setup
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        showError("Speech recognition not supported in this browser.");
        startBtn.disabled = true;
        return;
      }

      recognition = new SR();
      recognition.lang = "en-US";

      recognition.onstart = () => {
        console.log("Recognition started for word:", currentWordIndex < words.length ? words[currentWordIndex] : "complete");
        recognizing = true;
        startTime = Date.now();
        
        // Only update UI if this is the initial start (not auto-restart)
        if (startBtn.textContent !== "🛑 Stop") {
          startBtn.textContent = "🛑 Stop";
          startBtn.className = "stop-btn";
        }
        
        // Faster start for mobile
        const startDelay = isMobile ? 50 : levels[currentLevel].delay;
        
        setTimeout(() => {
          canValidate = true;
          if (recognizing) {
            if (currentLevel === 'L3') {
              scoreDiv.textContent = `🎤 Read the full sentence: "${sentences[sentenceIndex]}"`;
              renderWords();
            } else if (currentWordIndex < words.length) {
              scoreDiv.textContent = `🎤 Say: "${words[currentWordIndex]}"`;
            }
          }
        }, startDelay);
      };

      recognition.onerror = (e) => {
        console.log("Recognition error:", e.error, "auto-restart:", autoRestartEnabled);
        
        const errorMessages = {
          'no-speech': "No speech detected. Trying again...",
          'audio-capture': "Microphone not accessible. Please check permissions.",
          'not-allowed': "Microphone permission denied. Please allow and refresh the page.",
          'network': "Network error. Check your internet connection.",
          'aborted': "Speech recognition was stopped.",
        };
        
        // Force restart on no-speech for mobile
        if (e.error === 'no-speech' && autoRestartEnabled && currentWordIndex < words.length) {
          console.log("No speech detected, forcing restart...");
          recognizing = false; // Reset flag
          
          setTimeout(() => {
            if (autoRestartEnabled && !recognizing && currentWordIndex < words.length) {
              try {
                recognizing = true;
                recognition.start();
                console.log("Force restarted after no-speech");
              } catch (err) {
                console.log("Force restart failed:", err);
                recognizing = false;
                showError("Microphone stopped. Please click Start again.");
                resetUI();
              }
            }
          }, isMobile ? 200 : 500);
        } 
        // Handle aborted gracefully
        else if (e.error === 'aborted') {
          recognizing = false;
          if (!autoRestartEnabled) {
            resetUI();
          }
        }
        // Show error for other cases
        else {
          const message = errorMessages[e.error] || `Error: ${e.error}. Please try again.`;
          showError(message);
          resetUI();
        }
      };

      recognition.onend = () => {
  console.log("Recognition ended, auto-restart:", autoRestartEnabled, "current word:", currentWordIndex, "recognizing:", recognizing);

  if (autoRestartEnabled && currentWordIndex < words.length) {
    recognizing = false;

    setTimeout(() => {
      if (!recognizing && autoRestartEnabled && currentWordIndex < words.length) {
        try {
          recognition.start();
          recognizing = true;
          console.log("✅ Auto-restarted mic for next word.");
        } catch (err) {
          console.error("❌ Mic restart failed:", err);
          resetUI();
        }
      }
    }, 200); // Small delay before restart
  } else {
    resetUI();
  }
};


      recognition.onresult = (e) => {
        if (!canValidate || !recognizing) return;
        
        let finalTranscript = "";
        
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const transcript = e.results[i][0].transcript;
          if (e.results[i].isFinal) {
            finalTranscript += transcript + " ";
          }
        }
        
        if (finalTranscript.trim()) {
          console.log("Final transcript:", finalTranscript.trim());
          if (currentLevel === 'L3') {
            window.validateFullSentence(finalTranscript.trim());
          } else {
            window.validateWord(finalTranscript.trim());
          }
        }
      };

      const uploadInput = document.getElementById("uploadTxt");
      if (uploadInput) {
        uploadInput.addEventListener("change", handleFileUpload);
      }
      
      if (levelSelect) {
        levelSelect.addEventListener("change", (e) => {
          window.changeLevel(e.target.value);
        });
      }
      
      initWords();
      updateLevelInfo();
    }

    setupSpeechRecognition();
    
    // Cleanup
    return () => {
      autoRestartEnabled = false;
      if (incorrectHandler) {
        incorrectHandler.cleanup();
      }
      if (recognition) {
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
      
      {/* Mobile Instructions */}
      <div style={{ textAlign: "center", marginBottom: "15px", padding: "10px", backgroundColor: "#e8f5e8", borderRadius: "5px", fontSize: "14px" }}>
        📱 <strong>Mobile Users:</strong> Click "Start" once - speak all words continuously!
      </div>
      
      {/* Level Selector */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <label htmlFor="levelSelect" style={{ marginRight: "10px", fontWeight: "bold" }}>Choose Level:</label>
        <select id="levelSelect" defaultValue="L1" style={{ padding: "5px", fontSize: "16px" }}>
          <option value="L1">Beginner (0.5s per word)</option>
          <option value="L2">Advance (0.3s per word)</option>
          <option value="L3">Expert (Full Sentence)</option>
        </select>
      </div>
      
      <div id="levelInfo" style={{ textAlign: "center", marginBottom: "15px", fontWeight: "bold", color: "#007bff" }}>
        Level: Beginner (0.5s per word)
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
        .word.sentence-highlight {
          background-color: #e3f2fd;
          border-color: #2196f3;
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