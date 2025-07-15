<?php
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: http://localhost:3000");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Access-Control-Allow-Credentials: true");
    http_response_code(200); // MUST return 200 OK
    exit();
}

// CORS headers for actual request
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");


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

try {
    // Start transaction
    $pdo->beginTransaction();
    
    // Delete sentences
    $delete_sentences_sql = "DELETE FROM daily_task_sentences WHERE task_id = :task_id";
    $delete_sentences_stmt = $pdo->prepare($delete_sentences_sql);
    $delete_sentences_stmt->execute([':task_id' => $input['id']]);
    
    // Delete class assignments
    $delete_classes_sql = "DELETE FROM daily_task_classes WHERE task_id = :task_id";
    $delete_classes_stmt = $pdo->prepare($delete_classes_sql);
    $delete_classes_stmt->execute([':task_id' => $input['id']]);
    
    // Delete task
    $delete_task_sql = "DELETE FROM daily_tasks WHERE id = :id";
    $delete_task_stmt = $pdo->prepare($delete_task_sql);
    $delete_task_stmt->execute([':id' => $input['id']]);
    
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