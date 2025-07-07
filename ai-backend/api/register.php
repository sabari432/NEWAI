<?php
require_once 'apiMain.php';

// Remove duplicate headers since they're already in db_connection.php

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Only POST method allowed']);
    exit();
}

try {
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);

    if (!$data) {
        throw new Exception('Invalid JSON input');
    }

    // Get and sanitize input data
    $studentName = trim($data['student_name'] ?? '');
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';

    // Validation
    if (empty($studentName)) {
        throw new Exception('Student name is required');
    }
    
    if (strlen($studentName) > 255) {
        throw new Exception('Student name is too long');
    }

    if (empty($email)) {
        throw new Exception('Email is required');
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Please enter a valid email address');
    }

    if (strlen($email) > 255) {
        throw new Exception('Email address is too long');
    }

    if (empty($password)) {
        throw new Exception('Password is required');
    }

    if (strlen($password) < 6) {
        throw new Exception('Password must be at least 6 characters long');
    }

    // Check if database connection exists
    if (!isset($conn)) {
        throw new Exception('Database connection not available');
    }

    // Check for existing email
    $stmt = $conn->prepare("SELECT id FROM students WHERE email = ?");
    if (!$stmt) {
        throw new Exception('Database prepare error: ' . $conn->error);
    }
    
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        throw new Exception('An account with this email already exists');
    }
    $stmt->close();

    // Hash password securely
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    if (!$hashedPassword) {
        throw new Exception('Password hashing failed');
    }

    // Insert new student record
    $stmt = $conn->prepare("INSERT INTO students (student_name, email, password) VALUES (?, ?, ?)");
    if (!$stmt) {
        throw new Exception('Database prepare error: ' . $conn->error);
    }
    
    $stmt->bind_param("sss", $studentName, $email, $hashedPassword);
    
    if (!$stmt->execute()) {
        throw new Exception('Registration failed: ' . $stmt->error);
    }

    $userId = $conn->insert_id;
    $stmt->close();

    // Return success response
    echo json_encode([
        'success' => true, 
        'message' => 'Registration successful! You can now log in.',
        'user_id' => $userId
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false, 
        'error' => $e->getMessage()
    ]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>