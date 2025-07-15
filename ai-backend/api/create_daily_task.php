<?php
// CORS headers
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Handle preflight request (CORS OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
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

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON input']);
    exit;
}

// Validate required fields
$required_fields = ['title', 'level', 'sentences', 'target_accuracy', 'time_limit', 'stars_reward', 'due_date'];
foreach ($required_fields as $field) {
    if (!isset($input[$field]) || empty($input[$field])) {
        http_response_code(400);
        echo json_encode(['error' => "Missing required field: $field"]);
        exit;
    }
}

try {
    $pdo->beginTransaction();

    // Insert daily task
    $sql = "INSERT INTO daily_tasks (title, description, level, target_accuracy, time_limit, stars_reward, due_date, created_at) 
            VALUES (:title, :description, :level, :target_accuracy, :time_limit, :stars_reward, :due_date, NOW())";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':title' => $input['title'],
        ':description' => $input['description'] ?? '',
        ':level' => $input['level'],
        ':target_accuracy' => $input['target_accuracy'],
        ':time_limit' => $input['time_limit'],
        ':stars_reward' => $input['stars_reward'],
        ':due_date' => $input['due_date']
    ]);

    $task_id = $pdo->lastInsertId();

    // Insert sentences
    if (!empty($input['sentences'])) {
        $sentence_sql = "INSERT INTO daily_task_sentences (task_id, sentence) VALUES (:task_id, :sentence)";
        $sentence_stmt = $pdo->prepare($sentence_sql);

        foreach ($input['sentences'] as $sentence) {
            if (trim($sentence) !== '') {
                $sentence_stmt->execute([
                    ':task_id' => $task_id,
                    ':sentence' => trim($sentence)
                ]);
            }
        }
    }

    // Insert class assignments
    if (!empty($input['assigned_classes'])) {
        $class_sql = "INSERT INTO daily_task_classes (task_id, class_id) VALUES (:task_id, :class_id)";
        $class_stmt = $pdo->prepare($class_sql);

        foreach ($input['assigned_classes'] as $class_id) {
            $class_stmt->execute([
                ':task_id' => $task_id,
                ':class_id' => $class_id
            ]);
        }
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Daily task created successfully',
        'task_id' => $task_id
    ]);

} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Failed to create task: ' . $e->getMessage()]);
}
?>
