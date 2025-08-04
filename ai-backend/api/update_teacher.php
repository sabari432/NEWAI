<?php
require_once 'apiMain.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        throw new Exception("Invalid JSON data received");
    }

    // Validate ID
    if (empty($input['id'])) {
        throw new Exception("Teacher ID is required");
    }

    $id = intval($input['id']);
    $name = sanitizeInput($input['name'] ?? '');
    $email = sanitizeInput($input['email'] ?? '');
    $class_handled = sanitizeInput($input['class_handled'] ?? '');
    $sections = sanitizeInput($input['sections'] ?? '');
    $phone = sanitizeInput($input['phone'] ?? '');
    $school_name = sanitizeInput($input['school_name'] ?? '');
    $new_password = $input['new_password'] ?? '';

    // Validate email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception("Invalid email format");
    }

    // Optional password update
    if (!empty($new_password)) {
        $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
        $sql = "UPDATE teachers SET teacher_name=?, email=?, password=?, grade_level=?, subject=?, phone=?, school_name=? WHERE id=?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sssssssi", $name, $email, $hashed_password, $class_handled, $sections, $phone, $school_name, $id);
    } else {
        $sql = "UPDATE teachers SET teacher_name=?, email=?, grade_level=?, subject=?, phone=?, school_name=? WHERE id=?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssssssi", $name, $email, $class_handled, $sections, $phone, $school_name, $id);
    }

    if (!$stmt->execute()) {
        throw new Exception("Failed to update teacher: " . $stmt->error);
    }

    echo json_encode([
        'success' => true,
        'message' => 'Teacher updated successfully',
    ]);

} catch (Exception $e) {
    error_log("Error in update_teacher.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

$conn->close();
?>
