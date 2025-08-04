<?php
require_once 'apiMain.php';
session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// Handle different request methods
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        handleGetRequest();
        break;
    case 'POST':
        handlePostRequest();
        break;
    default:
        sendResponse(false, null, 'Method not allowed', 405);
}

function handleGetRequest() {
    global $conn;
    
    try {
        $query = "SELECT * FROM schools ORDER BY name ASC";
        $result = $conn->query($query);
        
        if (!$result) {
            throw new Exception("Database error: " . $conn->error);
        }
        
        $schools = [];
        while ($row = $result->fetch_assoc()) {
            $schools[] = $row;
        }
        
        sendResponse(true, $schools, 'Schools retrieved successfully');
    } catch (Exception $e) {
        error_log($e->getMessage());
        sendResponse(false, null, 'Failed to retrieve schools');
    }
}

function handlePostRequest() {
    global $conn;
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    $required = ['name'];
    $missing = validateRequired($required, $input);
    
    if (!empty($missing)) {
        sendResponse(false, null, 'Missing required fields: ' . implode(', ', $missing), 400);
    }
    
    try {
        // Sanitize input
        $name = sanitizeInput($input['name']);
        $address = isset($input['address']) ? sanitizeInput($input['address']) : null;
        $phone = isset($input['phone']) ? sanitizeInput($input['phone']) : null;
        $email = isset($input['email']) ? sanitizeInput($input['email']) : null;
        $principal = isset($input['principal']) ? sanitizeInput($input['principal']) : null;
        
        // Insert new school
        $stmt = $conn->prepare("INSERT INTO schools (name, address, phone, email, principal) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("sssss", $name, $address, $phone, $email, $principal);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to create school: " . $stmt->error);
        }
        
        $schoolId = $stmt->insert_id;
        
        // Get the newly created school
        $query = "SELECT * FROM schools WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $schoolId);
        $stmt->execute();
        $result = $stmt->get_result();
        $newSchool = $result->fetch_assoc();
        
        sendResponse(true, $newSchool, 'School created successfully', 201);
    } catch (Exception $e) {
        error_log($e->getMessage());
        sendResponse(false, null, 'Failed to create school');
    }
}
?>