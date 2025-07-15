<?php
// Add error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Handle preflight request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: http://localhost:3000");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Access-Control-Allow-Credentials: true");
    http_response_code(200);
    exit();
}

// Set CORS headers
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Skip OPTIONS method
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

try {
    // Database connection
    $host = 'speakread.ctea6e8ei0ff.ap-south-1.rds.amazonaws.com';
    $dbname = 'speakread';
    $username = 'admin';
    $password = 'wfxicVdxG71bJvdVhFN2';

    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // Test database connection
    $testQuery = $pdo->query("SELECT 1");
    if (!$testQuery) {
        throw new Exception("Database connection test failed");
    }

    // Check if daily_tasks table exists
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'daily_tasks'");
    if ($tableCheck->rowCount() === 0) {
        throw new Exception("Table 'daily_tasks' does not exist");
    }

    // Fetch all daily tasks
    $query = "
        SELECT 
            dt.id,
            dt.title,
            dt.description,
            dt.level,
            dt.target_accuracy,
            dt.time_limit,
            dt.stars_reward,
            dt.due_date,
            dt.created_at,
            dt.updated_at
        FROM daily_tasks dt
        ORDER BY dt.created_at DESC
    ";

    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $tasks = $stmt->fetchAll();

    // Fetch sentences and class assignments for each task
    foreach ($tasks as &$task) {
        // Sentences
        $sentencesStmt = $pdo->prepare("SELECT sentence FROM daily_task_sentences WHERE task_id = ? ORDER BY id");
        $sentencesStmt->execute([$task['id']]);
        $task['sentences'] = $sentencesStmt->fetchAll(PDO::FETCH_COLUMN);

        // Assigned classes
        $classesStmt = $pdo->prepare("
            SELECT 
                dtc.class_id,
                b.name as batch_name,
                b.section
            FROM daily_task_classes dtc
            JOIN batches b ON dtc.class_id = b.id
            WHERE dtc.task_id = ?
        ");
        $classesStmt->execute([$task['id']]);
        $assignedClasses = $classesStmt->fetchAll();

        $task['assigned_classes'] = array_column($assignedClasses, 'class_id');
        $task['assigned_classes_details'] = $assignedClasses;
    }

    // Return success response
    echo json_encode([
        'success' => true,
        'tasks' => $tasks,
        'debug' => [
            'task_count' => count($tasks),
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage(),
        'error_code' => $e->getCode()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
?>