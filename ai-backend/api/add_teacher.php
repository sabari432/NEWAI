<?php
require_once 'apiMain.php';

// Only allow POST method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    // Get POST data
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception("Invalid JSON data received");
    }
    
    // Validate required fields
    $required = ['name', 'email', 'password'];
    $missing = validateRequired($required, $input);
    
    if (!empty($missing)) {
        throw new Exception("Missing required fields: " . implode(', ', $missing));
    }
    
    // Sanitize input data
    $name = sanitizeInput($input['name']);
    $email = sanitizeInput($input['email']);
    $password = $input['password']; // Don't sanitize password as it might remove special chars
    $class_handled = isset($input['class_handled']) ? sanitizeInput($input['class_handled']) : '';
    $sections = isset($input['sections']) ? sanitizeInput($input['sections']) : '';
    $phone = isset($input['phone']) ? sanitizeInput($input['phone']) : '';
    $school_name = isset($input['school_name']) ? sanitizeInput($input['school_name']) : 'Default School';
    
    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception("Invalid email format");
    }
    
    // Check if email already exists
    $check_sql = "SELECT id FROM teachers WHERE email = ?";
    $check_stmt = $conn->prepare($check_sql);
    $check_stmt->bind_param("s", $email);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();
    
    if ($check_result->num_rows > 0) {
        throw new Exception("Email already exists");
    }
    
    // Hash the password
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    
    // Insert new teacher
    $sql = "INSERT INTO teachers (teacher_name, email, password, phone, school_name, grade_level, subject, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())";
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param("sssssss", $name, $email, $hashed_password, $phone, $school_name, $class_handled, $sections);
    
    if ($stmt->execute()) {
        $teacher_id = $conn->insert_id;
        
        // Return success with the new teacher data
        echo json_encode([
            'success' => true,
            'message' => 'Teacher registered successfully',
            'data' => [
                'id' => $teacher_id,
                'name' => $name,
                'email' => $email,
                'class_handled' => $class_handled,
                'sections' => $sections,
                'phone' => $phone,
                'school_name' => $school_name
            ]
        ]);
    } else {
        throw new Exception("Execute failed: " . $stmt->error);
    }
    
} catch (Exception $e) {
    error_log("Error in add_teacher.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

$conn->close();
?>