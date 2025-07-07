<?php
session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// Clear all session variables
$_SESSION = array();

// Destroy the session
session_destroy();

// Clear all cookies
if (isset($_COOKIE['user_email'])) {
    setcookie('user_email', '', time() - 3600, '/');
}
if (isset($_COOKIE['user_id'])) {
    setcookie('user_id', '', time() - 3600, '/');
}
if (isset($_COOKIE['user_name'])) {
    setcookie('user_name', '', time() - 3600, '/');
}
if (isset($_COOKIE['user_type'])) {
    setcookie('user_type', '', time() - 3600, '/');
}
if (isset($_COOKIE['user_school'])) {
    setcookie('user_school', '', time() - 3600, '/');
}
if (isset($_COOKIE['user_grade'])) {
    setcookie('user_grade', '', time() - 3600, '/');
}

echo json_encode([
    'success' => true,
    'message' => 'Logged out successfully'
]);
?>