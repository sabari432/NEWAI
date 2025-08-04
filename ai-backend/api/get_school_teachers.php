<?php
header("Access-Control-Allow-Origin: http://localhost:3000"); // Specific origin instead of *
header("Access-Control-Allow-Methods: POST, GET, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true"); // Added this line
header("Content-Type: application/json");

require_once 'apiMain.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(false, null, 'Only GET requests are allowed');
}

try {
    // Get school_id from query parameters
    $schoolId = isset($_GET['school_id']) ? intval($_GET['school_id']) : null;
    
    if (!$schoolId) {
        sendResponse(false, null, 'School ID is required');
    }
    
    // Verify school exists
    $checkSchool = $conn->prepare("SELECT id FROM schools WHERE id = ?");
    $checkSchool->bind_param("i", $schoolId);
    $checkSchool->execute();
    $schoolResult = $checkSchool->get_result();
    
    if ($schoolResult->num_rows === 0) {
        sendResponse(false, null, 'School not found');
    }
    
    // Get all teachers for this school
    $stmt = $conn->prepare("
        SELECT 
            id,
            teacher_name as name,
            email,
            phone,
            grade_level,
            subject,
            COALESCE(total_students, 0) as total_students,
            COALESCE(total_classes, 0) as total_classes,
            created_at,
            updated_at
        FROM teachers 
        WHERE school_id = ?
        ORDER BY teacher_name ASC
    ");
    
    $stmt->bind_param("i", $schoolId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result === false) {
        sendResponse(false, null, 'Database query failed: ' . $conn->error);
    }
    
    $teachers = [];
    while ($row = $result->fetch_assoc()) {
        // Convert numeric strings to integers
        $row['total_students'] = (int)$row['total_students'];
        $row['total_classes'] = (int)$row['total_classes'];
        $teachers[] = $row;
    }
    
    sendResponse(true, ['teachers' => $teachers], 'Teachers retrieved successfully');
    
} catch (Exception $e) {
    error_log("Error in get_school_teachers.php: " . $e->getMessage());
    sendResponse(false, null, 'Server error occurred');
}
?>