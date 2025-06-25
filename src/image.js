import React, { useState, useEffect } from 'react';
import { Upload, Camera, BookOpen, Mic, Play, Volume2, ArrowLeft } from 'lucide-react';

const ImageUpload = ({ onTextExtracted, onBack }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPractice, setShowPractice] = useState(false);

  // Speech recognition state (same as app.js)
  const [speechState, setSpeechState] = useState({
    currentLevel: 'L1',
    words: [],
    currentWordIndex: 0,
    results: [],
    recognizing: false,
    canValidate: false,
    score: '',
    errorMessage: ''
  });

  // Initialize speech recognition when practice starts
  useEffect(() => {
    if (showPractice && extractedText) {
      initializeSpeechRecognition();
    }
  }, [showPractice, extractedText]);

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      setError('');
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedImage);
      formData.append('language', 'eng');
      formData.append('isOverlayRequired', 'false');
      formData.append('detectOrientation', 'false');
      formData.append('scale', 'true');
      formData.append('OCREngine', '2');

      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: {
          apikey: 'K85876709188957'
        },
        body: formData
      });

      const result = await response.json();
      
      if (result.ParsedResults && result.ParsedResults[0]) {
        const text = result.ParsedResults[0].ParsedText;
        if (text.trim()) {
          setExtractedText(text.trim());
          setError('');
        } else {
          setError('No text found in the image. Please try a clearer image.');
        }
      } else {
        setError('Failed to extract text. Please try again.');
      }
    } catch (err) {
      setError('Error processing image: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Speech recognition functions (same as app.js)
  const initializeSpeechRecognition = () => {
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
      // USE FULL TEXT instead of just first sentence
      const cleanText = extractedText.trim().replace(/\s+/g, ' '); // Clean up extra spaces
      const words = cleanText.split(/\s+/); // Split all text into words
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
        setSpeechState(prevState => {
          if (autoRestartEnabled && prevState.currentWordIndex < prevState.words.length && prevState.currentLevel !== 'L3') {
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
        
        // Try to restart on certain errors
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
          const expected = words[currentWordIndex].toLowerCase().replace(/[^\w\s]/g, '');
          const spokenLower = spoken.toLowerCase().trim().replace(/[^\w\s]/g, '');
          
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

    window.toggleImageRecognition = () => {
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

  const startPractice = () => {
    if (extractedText.trim()) {
      setShowPractice(true);
    }
  };

  if (showPractice) {
    return (
      <div className="image-practice-view">
        <div className="practice-header">
          <button className="back-btn" onClick={() => setShowPractice(false)}>
            <ArrowLeft size={16} /> Back to Text
          </button>
          <h2>📖 Reading Practice</h2>
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
            onClick={() => window.toggleImageRecognition && window.toggleImageRecognition()}
          >
            {speechState.recognizing ? '🛑 Stop' : '🎤 Start'}
          </button>
        </div>

        <style jsx>{`
          .image-practice-view {
            max-width: 800px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 30px;
            color: #333;
            min-height: 80vh;
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
            display: flex;
            align-items: center;
            gap: 5px;
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
            font-size: 20px;
            line-height: 1.8;
            max-height: 400px;
            overflow-y: auto;
            border: 1px solid #ddd;
            padding: 20px;
            border-radius: 10px;
            background: #fafafa;
          }

          .word {
            display: inline-block;
            margin: 3px 4px;
            padding: 6px 10px;
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
        `}</style>
      </div>
    );
  }

  return (
    <div className="image-upload-container">
      <div className="upload-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <h2>📚 Upload Your Book</h2>
      </div>

      <div className="upload-section">
        <div className="upload-area">
          <div className="upload-icon">
            <Camera size={48} />
          </div>
          <h3>Take a photo or upload an image</h3>
          <p>Upload a clear photo of any book page and we'll extract the text for reading practice</p>
          
          <input
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="file-input"
            id="imageInput"
          />
          <label htmlFor="imageInput" className="upload-btn">
            <Upload size={20} />
            Choose Image
          </label>
          
          {selectedImage && (
            <div className="selected-image">
              <img 
                src={URL.createObjectURL(selectedImage)} 
                alt="Selected" 
                className="preview-image"
              />
              <p>Selected: {selectedImage.name}</p>
            </div>
          )}
        </div>

        <div className="action-buttons">
          <button 
            className="extract-btn"
            onClick={handleImageUpload}
            disabled={!selectedImage || isLoading}
          >
            {isLoading ? 'Extracting Text...' : 'Extract Text'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {extractedText && (
          <div className="extracted-text-section">
            <h3>📖 Extracted Text</h3>
            <div className="text-preview">
              {extractedText}
            </div>
            <div className="text-actions">
              <button className="practice-btn" onClick={startPractice}>
                <Mic size={20} />
                Start Reading Practice
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .image-upload-container {
          max-width: 800px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 20px;
          padding: 30px;
          color: #333;
          min-height: 80vh;
        }

        .upload-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 30px;
        }

        .back-btn {
          background: #6c757d;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .upload-header h2 {
          margin: 0;
          color: #333;
          text-align: center;
          flex: 1;
        }

        .upload-section {
          text-align: center;
        }

        .upload-area {
          border: 2px dashed #007bff;
          border-radius: 16px;
          padding: 40px 20px;
          margin-bottom: 20px;
          background: #f8f9ff;
        }

        .upload-icon {
          color: #007bff;
          margin-bottom: 20px;
        }

        .upload-area h3 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .upload-area p {
          margin: 0 0 20px 0;
          color: #666;
          line-height: 1.5;
        }

        .file-input {
          display: none;
        }

        .upload-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #007bff;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .upload-btn:hover {
          background: #0056b3;
        }

        .selected-image {
          margin-top: 20px;
        }

        .preview-image {
          max-width: 200px;
          max-height: 200px;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          margin-bottom: 10px;
        }

        .action-buttons {
          margin-bottom: 20px;
        }

        .extract-btn {
          background: #28a745;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          font-size: 16px;
        }

        .extract-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .error-message {
          background: #f8d7da;
          color: #721c24;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          border: 1px solid #f5c6cb;
        }

        .extracted-text-section {
          margin-top: 30px;
        }

        .extracted-text-section h3 {
          margin-bottom: 15px;
          color: #333;
        }

        .text-preview {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          text-align: left;
          line-height: 1.6;
          max-height: 300px;
          overflow-y: auto;
          font-size: 16px;
        }

        .text-actions {
          display: flex;
          justify-content: center;
          gap: 15px;
        }

        .practice-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #28a745;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          font-size: 16px;
        }

        .practice-btn:hover {
          background: #218838;
        }

        @media (max-width: 768px) {
          .image-upload-container {
            padding: 20px;
          }

          .upload-header {
            flex-direction: column;
            gap: 15px;
          }

          .upload-area {
            padding: 30px 15px;
          }

          .text-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default ImageUpload;