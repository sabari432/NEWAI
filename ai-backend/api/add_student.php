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
    
    if (!$input || !isset($input['name']) || !isset($input['class_id'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid input data'
        ]);
        exit;
    }
    
    $name = trim($input['name']);
    $class_id = intval($input['class_id']);
    $avatar = $input['avatar'] ?? '👧';
    $school = trim($input['school'] ?? '');
    $user_id = $_SESSION['user_id'];
    
    if (empty($name)) {
        echo json_encode([
            'success' => false,
            'message' => 'Student name cannot be empty'
        ]);
        exit;
    }
    
    // Verify that the class belongs to the logged-in teacher
    $verify_sql = "SELECT id FROM classes WHERE id = ? AND teacher_id = ?";
    $verify_stmt = $conn->prepare($verify_sql);
    if (!$verify_stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $verify_stmt->bind_param("ii", $class_id, $user_id);
    $verify_stmt->execute();
    $verify_result = $verify_stmt->get_result();
    
    if ($verify_result->num_rows === 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Class not found or access denied'
        ]);
        $verify_stmt->close();
        exit;
    }
    $verify_stmt->close();
    
    // Check if student already exists in this class
    $check_sql = "SELECT id FROM student WHERE name = ? AND class_id = ?";
    $check_stmt = $conn->prepare($check_sql);
    if (!$check_stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $check_stmt->bind_param("si", $name, $class_id);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();
    
    if ($check_result->num_rows > 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Student with this name already exists in this class'
        ]);
        $check_stmt->close();
        exit;
    }
    $check_stmt->close();
    
    // Insert the new student
    $sql = "INSERT INTO student (class_id, name, avatar, school, stars, day_streak, level, wpm, accuracy, created_at) VALUES (?, ?, ?, ?, 0, 0, 'Level 1', 0, 0, NOW())";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param("isss", $class_id, $name, $avatar, $school);
    
    if ($stmt->execute()) {
        $student_id = $conn->insert_id;
        $stmt->close();
        
        echo json_encode([
            'success' => true,
            'message' => 'Student added successfully',
            'student_id' => $student_id
        ]);
    } else {
        throw new Exception("Execute failed: " . $stmt->error);
    }
    
} catch(Exception $e) {
    error_log("Error in add_student.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>