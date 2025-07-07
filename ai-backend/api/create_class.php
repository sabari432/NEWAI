<?php
require_once 'apiMain.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, null, 'Only POST requests are allowed');
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    sendResponse(false, null, 'Invalid JSON input');
}

// Validate required fields
$required = ['class_name', 'teacher_id'];
$missing = validateRequired($required, $input);

if (!empty($missing)) {
    sendResponse(false, null, 'Missing required fields: ' . implode(', ', $missing));
}

$class_name = sanitizeInput($input['class_name']);
$teacher_id = intval($input['teacher_id']);

if (empty($class_name) || $teacher_id <= 0) {
    sendResponse(false, null, 'Invalid class name or teacher ID');
}

try {
    // Check if teacher exists
    $check_sql = "SELECT id FROM users WHERE id = ? AND role = 'teacher'";
    $stmt = $conn->prepare($check_sql);
    $stmt->bind_param("i", $teacher_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        sendResponse(false, null, 'Teacher not found');
    }
    
    // Check if class name already exists for this teacher
    $duplicate_sql = "SELECT id FROM classes WHERE class_name = ? AND teacher_id = ?";
    $stmt = $conn->prepare($duplicate_sql);
    $stmt->bind_param("si", $class_name, $teacher_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        sendResponse(false, null, 'Class name already exists for this teacher');
    }
    
    // Create the class
    $insert_sql = "INSERT INTO classes (class_name, teacher_id) VALUES (?, ?)";
    $stmt = $conn->prepare($insert_sql);
    $stmt->bind_param("si", $class_name, $teacher_id);
    
    if ($stmt->execute()) {
        $class_id = $conn->insert_id;
        
        $response_data = [
            'id' => $class_id,
            'class_name' => $class_name,
            'teacher_id' => $teacher_id,
            'student_count' => 0,
            'created_at' => date('Y-m-d H:i:s')
        ];
        
        sendResponse(true, $response_data, 'Class created successfully');
    } else {
        sendResponse(false, null, 'Failed to create class');
    }
    
} catch (Exception $e) {
    sendResponse(false, null, 'Database error: ' . $e->getMessage());
}
?>