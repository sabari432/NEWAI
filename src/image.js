import { Camera, Check, Loader, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import Tesseract from 'tesseract.js';

const ImageUpload = ({ onTextExtracted, onBack }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);


  
  // Speech recognition state
  const [speechState, setSpeechState] = useState({
    words: [],
    results: [],
    currentWordIndex: 0,
    recognizing: false,
    score: '',
    errorMessage: '',
    currentLevel: 'L1',
    canValidate: false,
  });
  const canValidate = useRef(false);

  const autoRestartEnabledRef = useRef(false);
  const canValidateRef = useRef(false);
  
  // Define levels for speech recognition
  const levels = {
    L1: { delay: 1000, name: 'Beginner', nextWordDelay: 80 },
    L2: { delay: 800, name: 'Intermediate', nextWordDelay: 10 },
    L3: { delay: 500, name: 'Expert', nextWordDelay: 1, fullSentence: true }
  };

  let recognition;
  let wordTimeout;

 // Fixed Speech Recognition Setup and Validation Functions
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
      canValidateRef.current = true;
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
    // and autoRestartEnabled is true (set when user clicks start)
    setSpeechState(prevState => {
      if (autoRestartEnabledRef.current && prevState.currentWordIndex < prevState.words.length && prevState.currentLevel !== 'L3') {
        // Small delay before restarting to avoid rapid restart loops
        setTimeout(() => {
          if (recognition && autoRestartEnabledRef.current) {
            try {
              recognition.start();
            } catch (e) {
              console.log("Recognition restart failed:", e);
            }
          }
        }, 100);
      }
      return { ...prevState, recognizing: autoRestartEnabledRef.current && prevState.currentWordIndex < prevState.words.length };
    });
  };

  recognition.onerror = (e) => {
    console.log("Recognition error:", e.error);
    setSpeechState(prev => ({
      ...prev,
      recognizing: false,
      errorMessage: `Error: ${e.error}. Please try again.`
    }));
    
    // Try to restart on certain errors (but not on no-speech or aborted)
    if (autoRestartEnabledRef.current && !['no-speech', 'aborted'].includes(e.error)) {
      setTimeout(() => {
        if (recognition && autoRestartEnabledRef.current) {
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


// Fixed validateWord function - only validates current word
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
      
      // Mark each word as correct or wrong based on individual word matching
      words.forEach((word, index) => {
        if (word.length <= 2) {
          newResults[index] = "correct"; // Auto-correct short words
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
      
      if (accuracy >= 70) {
        scoreMessage = `🎉 Great! ${correctCount}/${totalWords} words correct (${accuracy}%)`;
      } else {
        scoreMessage = `❌ ${correctCount}/${totalWords} words correct (${accuracy}%). Try again!`;
      }
      
    } else {
      // Regular mode (L1, L2) - ONLY validate current word, don't auto-mark others
      const expected = words[currentWordIndex].toLowerCase();
      const spokenLower = spoken.toLowerCase().trim();
      
   
const matched =
  spokenLower === expected ||
  spokenLower.includes(expected) ||
  expected.includes(spokenLower);

newResults[currentWordIndex] = matched ? "correct" : "wrong";

// Move to next word ONLY IF matched
let nextIndex = currentWordIndex;
if (matched) {
  nextIndex++;
  while (nextIndex < words.length && words[nextIndex].length <= 2) {
    nextIndex++;
  }
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
  if (wordTimeout) {
    clearTimeout(wordTimeout);
  }
  
  wordTimeout = setTimeout(() => {
    setSpeechState(prevState => {
      const { words, results } = prevState;
      
      if (wordIndex >= words.length || wordIndex !== prevState.currentWordIndex) {
        return prevState; // Word already processed or finished
      }
      
      const newResults = [...results];
      newResults[wordIndex] = "wrong"; // Mark ONLY current word as wrong
      
      // Move to next word (skip short words but don't mark them)
      let nextIndex = wordIndex + 1;
      while (nextIndex < words.length && words[nextIndex].length <= 2) {
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
  }, 3000); // 3 second timeout per word
};

const startSpeechRecognition = () => {
  autoRestartEnabledRef.current = true;
  if (recognition) {
    try {
      recognition.start();
    } catch (e) {
      console.log("Recognition start failed:", e);
    }
  }
};

const stopSpeechRecognition = () => {
  autoRestartEnabledRef.current = false;
  if (recognition) {
    try {
      recognition.stop();
    } catch (e) {
      console.log("Recognition stop failed:", e);
    }
  }
  setSpeechState(prev => ({ ...prev, recognizing: false }));
};
  const performOCR = async (imageFile) => {
    setIsProcessing(true);
    setError('');
    try {
      const { data: { text } } = await Tesseract.recognize(
        imageFile,
        'eng',
        { logger: m => console.log(m) }
      );

      setExtractedText(text);
      const wordArray = text.trim().split(/\s+/);
      const initialResults = wordArray.map(() => null); // All words start as null (not validated yet)
      
      setSpeechState(prev => ({
        ...prev,
        words: wordArray,
        results: initialResults,
        currentWordIndex: 0
      }));

      setIsProcessing(false);
      setupSpeechRecognition();
      return text;
    } catch (err) {
      setError('Failed to extract text from image. Please try again.');
      setIsProcessing(false);
      return null;
    }
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target.result);
    };
    reader.readAsDataURL(file);

    await performOCR(file);
  };

  const handleCameraCapture = async (event) => {
    await handleFileSelect(event);
  };

  const handleUseText = () => {
    if (extractedText.trim()) {
      onTextExtracted(extractedText.trim());
    }
  };

  const resetForm = () => {
    stopSpeechRecognition();
    setSelectedImage(null);
    setExtractedText('');
    setIsProcessing(false);
    setError('');
    setSpeechState({
      words: [],
      results: [],
      currentWordIndex: 0,
      recognizing: false,
      score: '',
      errorMessage: '',
      currentLevel: 'L1'
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
        <button 
          onClick={onBack}
          style={{
            background: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '8px',
            cursor: 'pointer',
            marginRight: '20px'
          }}
        >
          ← Back
        </button>
        <h2 style={{ margin: 0, color: '#333' }}>📸 Upload Book Image</h2>
      </div>

      {/* Upload Options */}
      {!selectedImage && (
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ 
            display: 'flex', 
            gap: '20px', 
            justifyContent: 'center', 
            flexWrap: 'wrap' 
          }}>
            <button
              onClick={() => cameraInputRef.current?.click()}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                padding: '30px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '15px',
                cursor: 'pointer',
                minWidth: '150px'
              }}
            >
              <Camera size={32} />
              <span>Take Photo</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                padding: '30px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '15px',
                cursor: 'pointer',
                minWidth: '150px'
              }}
            >
              <Upload size={32} />
              <span>Upload Image</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraCapture}
            style={{ display: 'none' }}
          />

          <p style={{ 
            marginTop: '20px', 
            color: '#666', 
            fontSize: '14px' 
          }}>
            📖 Take a clear photo of book pages or upload an image to extract text
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          background: '#f8d7da',
          color: '#721c24',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      {/* Image Preview */}
      {selectedImage && (
        <div style={{ marginBottom: '30px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h3 style={{ margin: 0 }}>📷 Uploaded Image</h3>
            <button
              onClick={resetForm}
              style={{
                background: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <X size={16} />
              Remove
            </button>
          </div>
          
          <img
            src={selectedImage}
            alt="Uploaded book page"
            style={{
              width: '100%',
              maxHeight: '400px',
              objectFit: 'contain',
              border: '2px solid #ddd',
              borderRadius: '10px'
            }}
          />
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div style={{
          textAlign: 'center',
          padding: '30px',
          background: '#e8f4f8',
          borderRadius: '10px',
          marginBottom: '20px'
        }}>
          <Loader size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '15px' }} />
          <p style={{ margin: 0, color: '#0c5460' }}>🔍 Extracting text from image...</p>
        </div>
      )}

      {/* Extracted Text and Speech Recognition */}
      {extractedText && !isProcessing && (
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '15px' }}>📝 Extracted Text</h3>
          <div style={{
            background: '#f8f9fa',
            padding: '20px',
            borderRadius: '10px',
            border: '1px solid #ddd',
            marginBottom: '20px'
          }}>
            <textarea
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              style={{
                width: '100%',
                minHeight: '150px',
                border: 'none',
                background: 'transparent',
                fontSize: '16px',
                lineHeight: '1.5',
                resize: 'vertical',
                outline: 'none'
              }}
              placeholder="Extracted text will appear here..."
            />
          </div>

          {/* Speech Recognition Controls */}
          {speechState.words.length > 0 && (
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <div style={{ marginBottom: '15px' }}>
                <p>Current word: <strong>{speechState.words[speechState.currentWordIndex] || 'Completed!'}</strong></p>
                <p>Progress: {speechState.currentWordIndex} / {speechState.words.length}</p>
                {speechState.score && <p style={{ color: '#007bff' }}>{speechState.score}</p>}
                {speechState.errorMessage && <p style={{ color: '#dc3545' }}>{speechState.errorMessage}</p>}
              </div>
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  onClick={startSpeechRecognition}
                  disabled={speechState.recognizing || speechState.currentWordIndex >= speechState.words.length}
                  style={{
                    padding: '10px 20px',
                    background: speechState.recognizing ? '#6c757d' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: speechState.recognizing ? 'not-allowed' : 'pointer'
                  }}
                >
                  {speechState.recognizing ? '🎤 Listening...' : '🎤 Start Reading'}
                </button>
                
                <button
                  onClick={stopSpeechRecognition}
                  disabled={!speechState.recognizing}
                  style={{
                    padding: '10px 20px',
                    background: !speechState.recognizing ? '#6c757d' : '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: !speechState.recognizing ? 'not-allowed' : 'pointer'
                  }}
                >
                  ⏹️ Stop
                </button>
              </div>
            </div>
          )}
          
          <div style={{ 
            display: 'flex', 
            gap: '15px', 
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={handleUseText}
              disabled={!extractedText.trim()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 25px',
                background: extractedText.trim() ? '#28a745' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: extractedText.trim() ? 'pointer' : 'not-allowed',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              <Check size={16} />
              Use This Text
            </button>
            
            <button
              onClick={resetForm}
              style={{
                padding: '12px 25px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Upload Another
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{
        background: '#e8f5e8',
        padding: '20px',
        borderRadius: '10px',
        marginTop: '20px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#155724' }}>📋 Tips for Best Results:</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#155724' }}>
          <li>Ensure good lighting when taking photos</li>
          <li>Keep the camera steady and avoid blurry images</li>
          <li>Make sure text is clearly visible and not cut off</li>
          <li>You can edit the extracted text before using it</li>
          <li>Click "Start Reading" to begin speech recognition</li>
          <li>Speak each word clearly and wait for the next word</li>
        </ul>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ImageUpload;