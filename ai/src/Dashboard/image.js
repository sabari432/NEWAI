import React, { useState, useEffect, useRef } from 'react';
import { Upload, Camera, BookOpen, Mic, Play, Volume2, ArrowLeft, X } from 'lucide-react';
import Tesseract from 'tesseract.js';

const ImageUpload = ({ onTextExtracted, onBack }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPractice, setShowPractice] = useState(false);
  
  // Camera states
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

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

  // Cleanup camera stream when component unmounts or camera closes
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      setError('');
    }
  };

  // Camera functions
  const openCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Use back camera on mobile if available
        } 
      });
      setStream(mediaStream);
      setShowCamera(true);
      setError('');
      
      // Set video stream when camera opens
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (err) {
      setError('Camera access denied or not available: ' + err.message);
    }
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        // Create a File object from the blob
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        setSelectedImage(file);
        closeCamera();
        
        // Automatically process the captured image
        setTimeout(() => {
          handleImageUpload(file);
        }, 500);
      }
    }, 'image/jpeg', 0.8);
  };

 const handleImageUpload = async (imageFile = null) => {
  const fileToUpload = imageFile || selectedImage;

  if (!fileToUpload) {
    setError('Please select an image first');
    return;
  }

  setIsLoading(true);
  setError('');

  try {
    const reader = new FileReader();
    reader.onload = async () => {
      const imageData = reader.result;

      const { data: { text } } = await Tesseract.recognize(
        imageData,
        'eng',
        {
          logger: m => console.log(m), // Logs progress
        }
      );

      if (text.trim()) {
        setExtractedText(text.trim());
        setError('');
      } else {
        setError('No text found in the image. Try a clearer image.');
      }

      setIsLoading(false);
    };

    reader.readAsDataURL(fileToUpload);

  } catch (err) {
    setError('Error processing image: ' + err.message);
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

  // Camera view
  if (showCamera) {
    return (
      <div className="camera-view">
        <div className="camera-header">
          <button className="close-camera-btn" onClick={closeCamera}>
            <X size={20} /> Close Camera
          </button>
          <h2>📷 Take Photo</h2>
        </div>
        
        <div className="camera-container">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline
            className="camera-video"
          />
          <canvas 
            ref={canvasRef} 
            style={{ display: 'none' }}
          />
        </div>
        
        <div className="camera-controls">
          <button className="capture-btn" onClick={capturePhoto}>
            📸 Capture Photo
          </button>
        </div>
        
        <style jsx>{`
          .camera-view {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          
          .camera-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }
          
          .close-camera-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 15px;
            background: #ff4757;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
          }
          
          .close-camera-btn:hover {
            background: #ff3742;
          }
          
          .camera-container {
            position: relative;
            margin-bottom: 20px;
            border-radius: 12px;
            overflow: hidden;
            background: #000;
          }
          
          .camera-video {
            width: 100%;
            height: auto;
            max-height: 400px;
            object-fit: cover;
          }
          
          .camera-controls {
            display: flex;
            justify-content: center;
          }
          
          .capture-btn {
            padding: 15px 30px;
            background: #2ed573;
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 18px;
            cursor: pointer;
            font-weight: bold;
          }
          
          .capture-btn:hover {
            background: #26d063;
          }
        `}</style>
      </div>
    );
  }

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
            <option value="L2">Beginner (0.5s per word)</option>
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
      </div>
    );
  }

  // Main upload view
  return (
    <div className="image-upload-container">
      <div className="upload-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </button>
        <h2>📷 Upload or Capture Image</h2>
      </div>

      <div className="upload-options">
        {/* File Upload */}
        <div className="upload-option">
          <label htmlFor="imageInput" className="upload-label">
            <Upload size={24} />
            Choose Image File
          </label>
          <input
            id="imageInput"
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />
        </div>

        {/* Camera Button */}
        <div className="upload-option">
          <button className="camera-btn" onClick={openCamera}>
            <Camera size={24} />
            Take Photo
          </button>
        </div>
      </div>

      {selectedImage && (
        <div className="selected-image">
          <h3>Selected Image:</h3>
          <img 
            src={URL.createObjectURL(selectedImage)} 
            alt="Selected" 
            style={{ maxWidth: '300px', maxHeight: '200px', objectFit: 'contain' }}
          />
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="upload-actions">
        <button 
          className="process-btn"
          onClick={() => handleImageUpload()}
          disabled={!selectedImage || isLoading}
        >
          {isLoading ? '⏳ Processing...' : '🔍 Extract Text'}
        </button>
      </div>

      {extractedText && (
        <div className="extracted-text">
          <h3>Extracted Text:</h3>
          <div className="text-content">
            {extractedText}
          </div>
          
          <button className="practice-btn" onClick={startPractice}>
            <BookOpen size={16} />
            Start Reading Practice
          </button>
        </div>
      )}

      <style jsx>{`
        .image-upload-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .upload-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 30px;
        }
        
        .back-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 15px;
          background: #74b9ff;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .back-btn:hover {
          background: #0984e3;
        }
        
        .upload-options {
          display: flex;
          gap: 20px;
          justify-content: center;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }
        
        .upload-option {
          flex: 1;
          min-width: 200px;
        }
        
        .upload-label, .camera-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 30px 20px;
          border: 2px dashed #74b9ff;
          border-radius: 12px;
          background: #f8f9ff;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 16px;
          font-weight: 500;
          color: #2d3436;
          width: 100%;
          text-align: center;
        }
        
        .camera-btn {
          border: 2px dashed #00b894;
          background: #f0fdf9;
          color: #2d3436;
        }
        
        .upload-label:hover, .camera-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .upload-label:hover {
          border-color: #0984e3;
          background: #e3f2fd;
        }
        
        .camera-btn:hover {
          border-color: #00a085;
          background: #e6fffa;
        }
        
        .selected-image {
          text-align: center;
          margin: 20px 0;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 12px;
        }
        
        .selected-image h3 {
          margin-bottom: 15px;
          color: #2d3436;
        }
        
        .error-message {
          background: #ff7675;
          color: white;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          text-align: center;
        }
        
        .upload-actions {
          text-align: center;
          margin: 30px 0;
        }
        
        .process-btn {
          padding: 15px 30px;
          background: #00b894;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 18px;
          cursor: pointer;
          font-weight: bold;
          disabled: opacity 0.6;
        }
        
        .process-btn:hover:not(:disabled) {
          background: #00a085;
        }
        
        .process-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .extracted-text {
          margin-top: 30px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 12px;
        }
        
        .extracted-text h3 {
          margin-bottom: 15px;
          color: #2d3436;
        }
        
        .text-content {
          background: white;
          padding: 20px;
          border-radius: 8px;
          line-height: 1.6;
          margin-bottom: 20px;
          border: 1px solid #e9ecef;
          max-height: 300px;
          overflow-y: auto;
        }
        
        .practice-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: #6c5ce7;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
        }
        
        .practice-btn:hover {
          background: #5f3dc4;
        }
      `}</style>
    </div>
  );
};

export default ImageUpload;