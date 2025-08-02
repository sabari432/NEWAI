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
    
    if (!$input || !isset($input['id'])) {
        throw new Exception("Teacher ID is required");
    }
    
    $teacher_id = (int)$input['id'];
    
    if ($teacher_id <= 0) {
        throw new Exception("Invalid teacher ID");
    }
    
    // Check if teacher exists
    $check_sql = "SELECT id FROM teachers WHERE id = ?";
    $check_stmt = $conn->prepare($check_sql);
    $check_stmt->bind_param("i", $teacher_id);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();
    
    if ($check_result->num_rows === 0) {
        throw new Exception("Teacher not found");
    }
    
    // Delete the teacher
    $sql = "DELETE FROM teachers WHERE id = ?";
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param("i", $teacher_id);
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode([
                'success' => true,
                'message' => 'Teacher deleted successfully'
            ]);
        } else {
            throw new Exception("No rows affected - teacher may not exist");
        }
    } else {
        throw new Exception("Execute failed: " . $stmt->error);
    }
    
} catch (Exception $e) {
    error_log("Error in delete_teacher.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

$conn->close();
?>