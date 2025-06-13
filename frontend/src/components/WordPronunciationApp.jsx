import React, { useRef, useState } from "react";
import { Button, Typography, Space, Progress, message } from "antd";
import axios from "axios";

const words = ["the", "boy", "walking", "on", "the", "street"];
const { Title } = Typography;

const WordPronunciationApp = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState([]);
  const mediaRecorderRef = useRef(null);
  const [recording, setRecording] = useState(false);

  const handleRecord = () => {
    setRecording(true);
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      mediaRecorderRef.current = new MediaRecorder(stream);
      const audioChunks = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.wav");
        formData.append("expected_word", words[currentIndex]);

        try {
          const response = await axios.post("http://localhost:5000/transcribe", formData);
          const { matched } = response.data;
          const newResult = [...results, matched];
          setResults(newResult);
          if (currentIndex < words.length - 1) {
            setCurrentIndex(currentIndex + 1);
          } else {
            message.success("Finished! See your score below.");
          }
        } catch (err) {
          console.error("Upload failed:", err);
          message.error("Upload failed!");
        }

        setRecording(false);
      };

      mediaRecorderRef.current.start();

      setTimeout(() => {
        mediaRecorderRef.current.stop();
      }, 4000); // record 4s
    });
  };

  const getColor = (index) => {
    if (results[index] === true) return "green";
    if (results[index] === false) return "red";
    return "default";
  };

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", textAlign: "center" }}>
      <Title level={2}>👶 Word Pronunciation Checker</Title>
      <Space wrap style={{ marginBottom: "30px" }}>
        {words.map((word, i) => (
          <span
            key={i}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              backgroundColor: getColor(i),
              color: "#fff",
              fontWeight: "bold",
              margin: "5px",
              fontSize: "18px",
              border: currentIndex === i ? "3px solid #1890ff" : "1px solid transparent",
            }}
          >
            {word}
          </span>
        ))}
      </Space>

      <div style={{ marginBottom: "20px" }}>
        <Button
          type="primary"
          size="large"
          disabled={recording || currentIndex >= words.length}
          onClick={handleRecord}
        >
          {recording ? "Recording..." : "Start"}
        </Button>
      </div>

      {results.length === words.length && (
        <div>
          <Progress
            percent={(results.filter(Boolean).length / words.length) * 100}
            status="active"
            strokeColor={{ "0%": "#52c41a", "100%": "#237804" }}
            style={{ marginBottom: 20 }}
          />
          <Title level={4}>
            Score: {results.filter(Boolean).length} / {words.length}
          </Title>
          <Button type="default" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
};

export default WordPronunciationApp;
