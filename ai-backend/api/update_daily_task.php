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

// Only teachers can update daily tasks
if ($_SESSION['user_type'] !== 'teacher') {
    echo json_encode([
        'success' => false,
        'message' => 'Only teachers can update daily tasks'
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

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON input']);
    exit;
}

// Validate required fields
if (!isset($input['id']) || empty($input['id'])) {
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
    echo json_encode(['error' => 'You can only update your own tasks']);
    exit;
}

// Validate that assigned classes belong to the teacher
if (!empty($input['assigned_classes'])) {
    $class_ids = implode(',', array_map('intval', $input['assigned_classes']));
    $class_check = $pdo->prepare("SELECT COUNT(*) FROM classes WHERE id IN ($class_ids) AND teacher_id = ?");
    $class_check->execute([$teacher_id]);
    $valid_classes = $class_check->fetchColumn();
    
    if ($valid_classes != count($input['assigned_classes'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Some assigned classes do not belong to you']);
        exit;
    }
}

try {
    // Start transaction
    $pdo->beginTransaction();
    
    // Update daily task (teacher_id remains the same)
    $sql = "UPDATE daily_tasks 
            SET title = :title, description = :description, level = :level, 
                target_accuracy = :target_accuracy, time_limit = :time_limit, 
                stars_reward = :stars_reward, due_date = :due_date, updated_at = NOW()
            WHERE id = :id AND teacher_id = :teacher_id";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id' => $task_id,
        ':title' => $input['title'],
        ':description' => $input['description'] ?? '',
        ':level' => $input['level'],
        ':target_accuracy' => $input['target_accuracy'],
        ':time_limit' => $input['time_limit'],
        ':stars_reward' => $input['stars_reward'],
        ':due_date' => $input['due_date'],
        ':teacher_id' => $teacher_id
    ]);
    
    // Delete existing sentences
    $delete_sentences_sql = "DELETE FROM daily_task_sentences WHERE task_id = :task_id";
    $delete_sentences_stmt = $pdo->prepare($delete_sentences_sql);
    $delete_sentences_stmt->execute([':task_id' => $task_id]);
    
    // Insert new sentences
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
    
    // Delete existing class assignments
    $delete_classes_sql = "DELETE FROM daily_task_classes WHERE task_id = :task_id";
    $delete_classes_stmt = $pdo->prepare($delete_classes_sql);
    $delete_classes_stmt->execute([':task_id' => $task_id]);
    
    // Insert new class assignments
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
    
    // Commit transaction
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Daily task updated successfully'
    ]);
    
} catch (Exception $e) {
    // Rollback transaction on error
    $pdo->rollback();
    http_response_code(500);
    echo json_encode(['error' => 'Failed to update task: ' . $e->getMessage()]);
}
?>