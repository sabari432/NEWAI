from flask import Flask, request, jsonify, send_from_directory, session, redirect, url_for
from flask_cors import CORS
import speech_recognition as sr
from pydub import AudioSegment
from thefuzz import fuzz
import os
from datetime import datetime

app = Flask(__name__, static_folder="frontend", static_url_path="")
CORS(app)
app.secret_key = "supersecretkey"  # Needed for session support

@app.route("/")
def login_page():
    return send_from_directory("frontend", "login.html")

@app.route("/login", methods=["POST"])
def login():
    username = request.form.get("username")
    password = request.form.get("password")
    if username == "admin" and password == "123":
        session["logged_in"] = True
        return redirect("/index")
    return "❌ Invalid credentials", 401

@app.route("/index")
def index():
    if not session.get("logged_in"):
        return redirect("/")
    return send_from_directory("frontend", "index.html")

@app.route("/logout")
def logout():
    session.clear()
    return redirect("/")

@app.route("/transcribe", methods=["POST"])
def transcribe():
    expected = request.args.get("expected", "").upper()
    file = request.files.get("audio")
    if not file:
        return jsonify({"error": "No audio file uploaded"}), 400

    temp_webm = f"temp_{datetime.now().timestamp()}.webm"
    temp_wav = temp_webm.replace(".webm", ".wav")
    file.save(temp_webm)

    try:
        sound = AudioSegment.from_file(temp_webm, format="webm")
        sound.export(temp_wav, format="wav")

        recognizer = sr.Recognizer()
        with sr.AudioFile(temp_wav) as source:
            audio = recognizer.record(source)

        try:
            transcript = recognizer.recognize_google(audio).upper()
            print(f"✅ Expected: {expected}")
            print(f"🧠 Transcript: {transcript}")

            best_match = ""
            best_score = 0
            for word in transcript.split():
                similarity = fuzz.ratio(expected, word)
                if similarity > best_score:
                    best_score = similarity
                    best_match = word

            status = "correct" if best_score >= 80 else "incorrect"
            return jsonify({
                "expected": expected,
                "spoken": best_match,
                "similarity": best_score,
                "status": status
            })

        except sr.UnknownValueError:
            return jsonify({"error": "Could not understand audio", "status": "incorrect"}), 200

    except Exception as e:
        return jsonify({"error": str(e), "status": "incorrect"}), 500

    finally:
        if os.path.exists(temp_webm): os.remove(temp_webm)
        if os.path.exists(temp_wav): os.remove(temp_wav)

if __name__ == "__main__":
    app.run(debug=True)
