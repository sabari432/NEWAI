<?php
// Handle preflight for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: http://localhost:3000");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");
    header("Access-Control-Allow-Credentials: true");
    exit(0);
}

session_start(); // for reading session or cookies

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// DB connection
$host = 'speakread.ctea6e8ei0ff.ap-south-1.rds.amazonaws.com';
$dbname = 'speakread';
$username = 'admin';
$password = 'wfxicVdxG71bJvdVhFN2';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'DB connection failed']);
    exit();
}

try {
    $today = date('Y-m-d');

    // 1. Get student_profile_id from cookie
    $studentId = $_COOKIE['student_profile_id'] ?? null;

    if (!$studentId) {
        echo json_encode(['success' => false, 'error' => 'Student ID not found in cookies']);
        exit();
    }

    // 2. Fetch student info
    $stmt = $pdo->prepare("SELECT id, name, class_id, school, level, stars FROM student WHERE id = ?");
    $stmt->execute([$studentId]);
    $student = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$student) {
        echo json_encode(['success' => false, 'error' => 'Student not found']);
        exit();
    }

    // 3. Call stored procedure to get tasks for student
    $taskStmt = $pdo->prepare("CALL GetTasksForStudent(?)");
    $taskStmt->execute([$studentId]);
    $tasks = $taskStmt->fetchAll(PDO::FETCH_ASSOC);
    $taskStmt->closeCursor();

    // 4. Add sentences to each task
    foreach ($tasks as &$task) {
        $sStmt = $pdo->prepare("SELECT sentence FROM daily_task_sentences WHERE task_id = ? ORDER BY id");
        $sStmt->execute([$task['id']]);
        $task['sentences'] = $sStmt->fetchAll(PDO::FETCH_COLUMN);

        // Convert to int
        $task['id'] = (int)$task['id'];
        $task['target_accuracy'] = (int)$task['target_accuracy'];
        $task['time_limit'] = (int)$task['time_limit'];
        $task['stars_reward'] = (int)$task['stars_reward'];
    }

    echo json_encode([
        'success' => true,
        'today' => $today,
        'student' => $student,
        'tasks' => $tasks,
        'debug' => [
            'task_count' => count($tasks),
            'student_id' => $studentId,
            'class_id' => $student['class_id']
        ]
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
