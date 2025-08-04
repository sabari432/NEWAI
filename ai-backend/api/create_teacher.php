<?php
require_once 'apiMain.php';

// Set CORS headers
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');


// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, null, 'Only POST requests are allowed');
}

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    $required = ['teacher_name', 'school_id'];
    $missing = validateRequired($required, $input);
    
    if (!empty($missing)) {
        sendResponse(false, null, 'Missing required fields: ' . implode(', ', $missing));
    }
    
    // Sanitize inputs
    $teacherName = sanitizeInput($input['teacher_name']);
    $schoolId = intval($input['school_id']);
    $email = isset($input['email']) ? sanitizeInput($input['email']) : null;
    $password = isset($input['password']) ? password_hash($input['password'], PASSWORD_DEFAULT) : null;
    $phone = isset($input['phone']) ? sanitizeInput($input['phone']) : null;
    $gradeLevel = isset($input['grade_level']) ? sanitizeInput($input['grade_level']) : null;
    $subject = isset($input['subject']) ? sanitizeInput($input['subject']) : null;
    
    // Validate email format if provided
    if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendResponse(false, null, 'Invalid email format');
    }
    
    // Verify school exists
    $checkSchool = $conn->prepare("SELECT id, name FROM schools WHERE id = ?");
    $checkSchool->bind_param("i", $schoolId);
    $checkSchool->execute();
    $schoolResult = $checkSchool->get_result();
    
    if ($schoolResult->num_rows === 0) {
        sendResponse(false, null, 'Selected school does not exist');
    }
    
    $school = $schoolResult->fetch_assoc();
    $schoolName = $school['name'];
    
    // Check if teacher email already exists (if email is provided)
    if ($email) {
        $checkStmt = $conn->prepare("SELECT id FROM teachers WHERE email = ?");
        $checkStmt->bind_param("s", $email);
        $checkStmt->execute();
        $result = $checkStmt->get_result();
        
        if ($result->num_rows > 0) {
            sendResponse(false, null, 'Teacher with this email already exists');
        }
    }
    
    // Insert new teacher
    $stmt = $conn->prepare("
        INSERT INTO teachers (teacher_name, email, password, phone, school_id, school_name, grade_level, subject) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->bind_param("ssssisss", $teacherName, $email, $password, $phone, $schoolId, $schoolName, $gradeLevel, $subject);
    
    if ($stmt->execute()) {
        $teacherId = $conn->insert_id;
        
        // Get the created teacher data
        $getTeacher = $conn->prepare("
            SELECT 
                id,
                teacher_name as name,
                email,
                phone,
                school_id,
                school_name,
                grade_level,
                subject,
                created_at,
                updated_at
            FROM teachers 
            WHERE id = ?
        ");
        $getTeacher->bind_param("i", $teacherId);
        $getTeacher->execute();
        $teacherData = $getTeacher->get_result()->fetch_assoc();
        
        sendResponse(true, $teacherData, 'Teacher created successfully');
    } else {
        sendResponse(false, null, 'Failed to create teacher: ' . $stmt->error);
    }
    
} catch (Exception $e) {
    error_log("Error in create_teacher.php: " . $e->getMessage());
    sendResponse(false, null, 'Server error occurred');
}
?>