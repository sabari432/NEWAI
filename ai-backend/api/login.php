<?php
// login.php
require_once 'apiMain.php';
session_start(); // Start session

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Credentials: true");

// Check connection
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit;
}

// Get JSON input
$data = json_decode(file_get_contents("php://input"), true);
$email = isset($data['email']) ? trim($data['email']) : '';
$password = isset($data['password']) ? $data['password'] : '';

if ($email === '' || $password === '') {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing email or password"]);
    exit;
}

// First check if user is a student
$sql = "SELECT id, student_name, password FROM students WHERE email = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();
    if (password_verify($password, $user['password'])) {
        // Set SESSION variables for student
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_email'] = $email;
        $_SESSION['user_name'] = $user['student_name'];
        $_SESSION['user_type'] = 'student';
        
        // Also set cookies for frontend compatibility
        setcookie("user_email", $email, time() + (7 * 24 * 60 * 60), "/", "", false, true);
        setcookie("user_id", $user['id'], time() + (7 * 24 * 60 * 60), "/", "", false, true);
        setcookie("user_name", $user['student_name'], time() + (7 * 24 * 60 * 60), "/", "", false, true);
        setcookie("user_type", "student", time() + (7 * 24 * 60 * 60), "/", "", false, true);
        
        echo json_encode([
            "success" => true,
            "message" => "Login successful",
            "user_type" => "student",
            "user" => [
                "id" => $user['id'],
                "name" => $user['student_name'],
                "email" => $email
            ]
        ]);
        $stmt->close();
        $conn->close();
        exit;
    }
}

// If not found in students table, check teachers table
$sql = "SELECT id, teacher_name, password, school_name, grade_level FROM teachers WHERE email = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();
    if (password_verify($password, $user['password'])) {
        // Set SESSION variables for teacher
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_email'] = $email;
        $_SESSION['user_name'] = $user['teacher_name'];
        $_SESSION['user_type'] = 'teacher';
        $_SESSION['user_school'] = $user['school_name'];
        $_SESSION['user_grade'] = $user['grade_level'];
        
        // Also set cookies for frontend compatibility
        setcookie("user_email", $email, time() + (7 * 24 * 60 * 60), "/", "", false, true);
        setcookie("user_id", $user['id'], time() + (7 * 24 * 60 * 60), "/", "", false, true);
        setcookie("user_name", $user['teacher_name'], time() + (7 * 24 * 60 * 60), "/", "", false, true);
        setcookie("user_type", "teacher", time() + (7 * 24 * 60 * 60), "/", "", false, true);
        setcookie("user_school", $user['school_name'], time() + (7 * 24 * 60 * 60), "/", "", false, true);
        setcookie("user_grade", $user['grade_level'], time() + (7 * 24 * 60 * 60), "/", "", false, true);
        
        echo json_encode([
            "success" => true,
            "message" => "Login successful",
            "user_type" => "teacher",
            "user" => [
                "id" => $user['id'],
                "name" => $user['teacher_name'],
                "email" => $email,
                "school" => $user['school_name'],
                "grade" => $user['grade_level']
            ]
        ]);
        $stmt->close();
        $conn->close();
        exit;
    }
}

// If user not found in either table
http_response_code(401);
echo json_encode(["success" => false, "message" => "Invalid credentials"]);

$stmt->close();
$conn->close();
?>