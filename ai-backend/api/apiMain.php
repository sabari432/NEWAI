<?php

// CORS headers - Updated to work with credentials
header("Access-Control-Allow-Origin: http://localhost:3000"); // Specific origin instead of *
header("Access-Control-Allow-Methods: POST, GET, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true"); // Added this line
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database connection settings
$servername = "speakread.ctea6e8ei0ff.ap-south-1.rds.amazonaws.com";
$username = "admin";
$password = "wfxicVdxG71bJvdVhFN2";
$dbname = "speakread";

try {
    // Create connection with error handling
    $conn = new mysqli($servername, $username, $password, $dbname);
    
    // Set charset
    $conn->set_charset("utf8mb4");

    
    // Check connection
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }
    
} catch (Exception $e) {
    // Log error for debugging
    error_log("Database connection error: " . $e->getMessage());
    
    // Return JSON error response
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'error' => 'Database connection failed',
        'message' => 'Unable to connect to database server'
    ]);
    exit();
}
function sendResponse($success, $data = null, $message = '') {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => $success,
        'data' => $data,
        'message' => $message
    ]);
    exit;
}

// Function to validate required fields
function validateRequired($fields, $data) {
    $missing = [];
    foreach ($fields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            $missing[] = $field;
        }
    }
    return $missing;
}

// Function to sanitize input
function sanitizeInput($input) {
    $input = trim($input);
    $input = stripslashes($input);
    $input = htmlspecialchars($input);
    return $input;
}
?>