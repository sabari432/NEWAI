<?php
session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// Check if user is logged in
if (!isset($_SESSION['user_id']) || !isset($_SESSION['user_type'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Not logged in'
    ]);
    exit;
}

// Only teachers can delete daily tasks
if ($_SESSION['user_type'] !== 'teacher') {
    echo json_encode([
        'success' => false,
        'message' => 'Only teachers can delete daily tasks'
    ]);
    exit;
}

// Database connection
$host = 'speakread.ctea6e8ei0ff.ap-south-1.rds.amazonaws.com';
$dbname = 'speakread';
$username = 'admin';
$password = 'wfxicVdxG71bJvdVhFN2';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Task ID is required']);
    exit;
}

$teacher_id = $_SESSION['user_id'];
$task_id = $input['id'];

// Check if the task belongs to the logged-in teacher
$ownershipCheck = $pdo->prepare("SELECT id FROM daily_tasks WHERE id = ? AND teacher_id = ?");
$ownershipCheck->execute([$task_id, $teacher_id]);

if ($ownershipCheck->rowCount() === 0) {
    http_response_code(403);
    echo json_encode(['error' => 'You can only delete your own tasks']);
    exit;
}

try {
    // Start transaction
    $pdo->beginTransaction();
    
    // Delete sentences first (foreign key constraint)
    $delete_sentences = $pdo->prepare("DELETE FROM daily_task_sentences WHERE task_id = ?");
    $delete_sentences->execute([$task_id]);
    
    // Delete class assignments
    $delete_classes = $pdo->prepare("DELETE FROM daily_task_classes WHERE task_id = ?");
    $delete_classes->execute([$task_id]);
    
    // Delete the task itself
    $delete_task = $pdo->prepare("DELETE FROM daily_tasks WHERE id = ? AND teacher_id = ?");
    $delete_task->execute([$task_id, $teacher_id]);
    
    // Commit transaction
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Daily task deleted successfully'
    ]);
    
} catch (Exception $e) {
    // Rollback transaction on error
    $pdo->rollback();
    http_response_code(500);
    echo json_encode(['error' => 'Failed to delete task: ' . $e->getMessage()]);
}
?>