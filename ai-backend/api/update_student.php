<?php
require_once 'apiMain.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['id'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid input']);
    exit;
}

try {
    $student_id = intval($input['id']);
    $name = trim($input['name']);
    $avatar = $input['avatar'] ?? '👧';
    $school = trim($input['school'] ?? '');
    $user_id = $_SESSION['user_id'];
    
    // Verify the student belongs to a class owned by this teacher
    $verify_sql = "SELECT s.id FROM student s JOIN classes c ON s.class_id = c.id WHERE s.id = ? AND c.teacher_id = ?";
    $verify_stmt = $conn->prepare($verify_sql);
    $verify_stmt->bind_param("ii", $student_id, $user_id);
    $verify_stmt->execute();
    
    if ($verify_stmt->get_result()->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Student not found or access denied']);
        exit;
    }
    
    $update_sql = "UPDATE student SET name = ?, avatar = ?, school = ? WHERE id = ?";
    $update_stmt = $conn->prepare($update_sql);
    $update_stmt->bind_param("sssi", $name, $avatar, $school, $student_id);
    
    if ($update_stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Student updated successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update student']);
    }
    
} catch(Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>