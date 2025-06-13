from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
import os
from werkzeug.utils import secure_filename
from rapidfuzz import fuzz

app = Flask(__name__)
CORS(app)  # ✅ Allow all origins for CORS
app.config['UPLOAD_FOLDER'] = 'uploads'

model = whisper.load_model("base")

def validate_word(expected, spoken, threshold=50):
    return fuzz.ratio(expected, spoken) >= threshold

@app.route('/transcribe', methods=['POST'])
def transcribe_audio():
    if 'audio' not in request.files or 'expected_word' not in request.form:
        return jsonify({'error': 'Missing audio or expected word'}), 400

    file = request.files['audio']
    expected_word = request.form.get("expected_word", "").strip().lower()

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    try:
        result = model.transcribe(filepath)
        transcribed_text = result['text'].strip().lower()
        spoken_words = transcribed_text.split()

        match_score = max(fuzz.ratio(expected_word, word) for word in spoken_words) if spoken_words else 0
        matched = match_score >= 50

        return jsonify({
            'spoken': transcribed_text,
            'match_score': match_score,
            'matched': matched
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        os.remove(filepath)

if __name__ == '__main__':
    os.makedirs('uploads', exist_ok=True)
    app.run(port=5000, debug=True)
