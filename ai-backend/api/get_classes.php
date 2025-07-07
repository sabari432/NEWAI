<?php
require_once 'apiMain.php';
session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Not logged in'
    ]);
    exit;
}

try {
    $user_id = $_SESSION['user_id'];
    
    // Get classes for the logged-in teacher with student count
    // Only count from 'student' table since 'students' is for login authentication
    $sql = "
        SELECT 
            c.id,
            c.name,
            c.section,
            c.teacher_id,
            COALESCE(student_count.count, 0) as student_count
        FROM classes c
        LEFT JOIN (
            SELECT class_id, COUNT(*) as count 
            FROM student 
            GROUP BY class_id
        ) student_count ON c.id = student_count.class_id
        WHERE c.teacher_id = ?
        ORDER BY c.name, c.section
    ";
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $classes = [];
    while ($row = $result->fetch_assoc()) {
        $classes[] = $row;
    }
    
    $stmt->close();
    
    echo json_encode([
        'success' => true,
        'classes' => $classes
    ]);
    
} catch(Exception $e) {
    error_log("Error in get_classes.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>