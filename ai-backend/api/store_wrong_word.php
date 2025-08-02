<?php
// store_wrong_word.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// DB config
$servername = "speakread.ctea6e8ei0ff.ap-south-1.rds.amazonaws.com";
$username = "admin";
$password = "wfxicVdxG71bJvdVhFN2";
$dbname = "speakread";

// Connect to DB
$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit();
}

// Read JSON input
$data = json_decode(file_get_contents("php://input"), true);

$studentId = $data['student_id'];
$word = $data['word'];

if (!$studentId || !$word) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing student_id or word"]);
    exit();
}

// Insert into DB
$stmt = $conn->prepare("INSERT INTO wrong_words (student_id, word) VALUES (?, ?)");
$stmt->bind_param("is", $studentId, $word);

if ($stmt->execute()) {
    echo json_encode(["status" => "success", "message" => "Word stored successfully"]);
} else {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Failed to insert word"]);
}

$stmt->close();
$conn->close();
