<?php
require_once 'apiMain.php';
session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Not logged in'
    ]);
    exit;
}

try {
    // Get the JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['name']) || !isset($input['section'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid input data'
        ]);
        exit;
    }
    
    $name = trim($input['name']);
    $section = trim($input['section']);
    $teacher_id = $_SESSION['user_id'];
    
    if (empty($name)) {
        echo json_encode([
            'success' => false,
            'message' => 'Class name cannot be empty'
        ]);
        exit;
    }
    
    // Check if class already exists for this teacher
    $check_sql = "SELECT id FROM classes WHERE name = ? AND section = ? AND teacher_id = ?";
    $check_stmt = $conn->prepare($check_sql);
    if (!$check_stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $check_stmt->bind_param("ssi", $name, $section, $teacher_id);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();
    
    if ($check_result->num_rows > 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Class with this name and section already exists'
        ]);
        $check_stmt->close();
        exit;
    }
    $check_stmt->close();
    
    // Insert the new class
    $sql = "INSERT INTO classes (name, section, teacher_id, created_at) VALUES (?, ?, ?, NOW())";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param("ssi", $name, $section, $teacher_id);
    
    if ($stmt->execute()) {
        $class_id = $conn->insert_id;
        $stmt->close();
        
        echo json_encode([
            'success' => true,
            'message' => 'Class added successfully',
            'class_id' => $class_id
        ]);
    } else {
        throw new Exception("Execute failed: " . $stmt->error);
    }
    
} catch(Exception $e) {
    error_log("Error in add_class.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>