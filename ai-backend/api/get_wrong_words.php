<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');


$servername = "speakread.ctea6e8ei0ff.ap-south-1.rds.amazonaws.com";
$username = "admin";
$password = "wfxicVdxG71bJvdVhFN2";
$dbname = "speakread";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

$student_id = isset($_GET['student_id']) ? intval($_GET['student_id']) : 0;

$sql = "SELECT word, timestamp FROM wrong_words WHERE student_id = $student_id ORDER BY timestamp DESC";
$result = $conn->query($sql);

$wrongWords = [];
while ($row = $result->fetch_assoc()) {
    $wrongWords[] = $row;
}

echo json_encode($wrongWords);
$conn->close();
?>
