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
    $required = ['name'];
    $missing = validateRequired($required, $input);
    
    if (!empty($missing)) {
        sendResponse(false, null, 'Missing required fields: ' . implode(', ', $missing));
    }
    
    // Sanitize inputs
    $name = sanitizeInput($input['name']);
    $address = isset($input['address']) ? sanitizeInput($input['address']) : null;
    $phone = isset($input['phone']) ? sanitizeInput($input['phone']) : null;
    $email = isset($input['email']) ? sanitizeInput($input['email']) : null;
    $principal = isset($input['principal']) ? sanitizeInput($input['principal']) : null;
    
    // Validate email format if provided
    if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendResponse(false, null, 'Invalid email format');
    }
    
    // Check if school name already exists
    $checkStmt = $conn->prepare("SELECT id FROM schools WHERE name = ?");
    $checkStmt->bind_param("s", $name);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    
    if ($result->num_rows > 0) {
        sendResponse(false, null, 'School with this name already exists');
    }
    
    // Insert new school
    $stmt = $conn->prepare("INSERT INTO schools (name, address, phone, email, principal) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("sssss", $name, $address, $phone, $email, $principal);
    
    if ($stmt->execute()) {
        $schoolId = $conn->insert_id;
        
        // Get the created school data
        $getSchool = $conn->prepare("SELECT * FROM schools WHERE id = ?");
        $getSchool->bind_param("i", $schoolId);
        $getSchool->execute();
        $schoolData = $getSchool->get_result()->fetch_assoc();
        
        sendResponse(true, $schoolData, 'School created successfully');
    } else {
        sendResponse(false, null, 'Failed to create school: ' . $stmt->error);
    }
    
} catch (Exception $e) {
    error_log("Error in create_school.php: " . $e->getMessage());
    sendResponse(false, null, 'Server error occurred');
}
?>