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
    $class_id = isset($_GET['class_id']) ? intval($_GET['class_id']) : 0;
    
    if ($class_id <= 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid class ID'
        ]);
        exit;
    }
    
    // First, verify that the class belongs to the logged-in teacher
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
    
    // Get students for this class
    $sql = "
        SELECT 
            s.id,
            s.name,
            s.avatar,
            s.school,
            s.stars,
            s.day_streak as dayStreak,
            s.level,
            s.wpm,
            s.accuracy,
            c.name as class,
            c.section
        FROM student s
        JOIN classes c ON s.class_id = c.id
        WHERE s.class_id = ?
        ORDER BY s.name
    ";
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param("i", $class_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $students = [];
    while ($row = $result->fetch_assoc()) {
        // Ensure default values
        $row['stars'] = intval($row['stars'] ?? 0);
        $row['dayStreak'] = intval($row['dayStreak'] ?? 0);
        $row['level'] = $row['level'] ?? 'Level 1';
        $row['wpm'] = intval($row['wpm'] ?? 0);
        $row['accuracy'] = intval($row['accuracy'] ?? 0);
        $row['avatar'] = $row['avatar'] ?? '👧';
        
        $students[] = $row;
    }
    
    $stmt->close();
    
    echo json_encode([
        'success' => true,
        'students' => $students
    ]);
    
} catch(Exception $e) {
    error_log("Error in get_students.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>