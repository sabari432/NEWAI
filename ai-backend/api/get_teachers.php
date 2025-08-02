<?php
require_once 'apiMain.php';

try {
    // Query to get all teachers
    $sql = "SELECT id, teacher_name as name, email, grade_level as class_handled, subject as sections, phone, school_name, created_at FROM teachers ORDER BY created_at DESC";
    $result = $conn->query($sql);
    
    if ($result === false) {
        throw new Exception("Query failed: " . $conn->error);
    }
    
    $teachers = [];
    while ($row = $result->fetch_assoc()) {
        $teachers[] = $row;
    }
    
    // Return the teachers array directly (not wrapped in another object)
    header('Content-Type: application/json');
    echo json_encode($teachers);
    
} catch (Exception $e) {
    error_log("Error in get_teachers.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to fetch teachers',
        'message' => $e->getMessage()
    ]);
}

$conn->close();
?>