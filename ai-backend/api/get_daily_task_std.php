<?php
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

// DB connection
$host = 'speakread.ctea6e8ei0ff.ap-south-1.rds.amazonaws.com';
$dbname = 'speakread';
$username = 'admin';
$password = 'wfxicVdxG71bJvdVhFN2';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'DB connect error: ' . $e->getMessage()]);
    exit();
}

try {
    $today = date('Y-m-d');

    // Step 1: Get all teacher_ids from daily_tasks
    $teacherStmt = $pdo->query("SELECT DISTINCT teacher_id FROM daily_tasks WHERE teacher_id IS NOT NULL");
    $teacherIds = $teacherStmt->fetchAll(PDO::FETCH_COLUMN);

    if (empty($teacherIds)) {
        echo json_encode(['success' => true, 'tasks' => [], 'students' => [], 'message' => 'No teachers found.']);
        exit;
    }

    // Step 2: Get class IDs from classes where teacher_id matches
    $placeholders = implode(',', array_fill(0, count($teacherIds), '?'));
    $classStmt = $pdo->prepare("SELECT id, name, section, teacher_id FROM classes WHERE teacher_id IN ($placeholders)");
    $classStmt->execute($teacherIds);
    $classes = $classStmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($classes)) {
        echo json_encode(['success' => true, 'tasks' => [], 'students' => [], 'message' => 'No classes found.']);
        exit;
    }

    // Extract class IDs
    $classIds = array_column($classes, 'id');

    // Step 3: Get students in those classes
    $placeholders2 = implode(',', array_fill(0, count($classIds), '?'));
    $studentStmt = $pdo->prepare("SELECT id, name, class_id, school, level, stars FROM student WHERE class_id IN ($placeholders2)");
    $studentStmt->execute($classIds);
    $students = $studentStmt->fetchAll(PDO::FETCH_ASSOC);

    // Step 4: Get daily tasks for those teacher_ids (today and upcoming)
    $taskStmt = $pdo->prepare("
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
            dt.teacher_id
        FROM daily_tasks dt
        WHERE dt.teacher_id IN ($placeholders)
        AND dt.due_date >= ?
        ORDER BY dt.due_date ASC, dt.created_at DESC
    ");
    $taskStmt->execute([...$teacherIds, $today]);
    $tasks = $taskStmt->fetchAll(PDO::FETCH_ASSOC);

    // Step 5: Fetch sentences for each task
    foreach ($tasks as &$task) {
        $sentencesStmt = $pdo->prepare("SELECT sentence FROM daily_task_sentences WHERE task_id = ? ORDER BY id");
        $sentencesStmt->execute([$task['id']]);
        $task['sentences'] = $sentencesStmt->fetchAll(PDO::FETCH_COLUMN);

        // Convert numeric values
        $task['id'] = (int)$task['id'];
        $task['target_accuracy'] = (int)$task['target_accuracy'];
        $task['time_limit'] = (int)$task['time_limit'];
        $task['stars_reward'] = (int)$task['stars_reward'];
    }

    echo json_encode([
        'success' => true,
        'today' => $today,
        'tasks' => $tasks,
        'students' => $students,
        'debug' => [
            'teacher_count' => count($teacherIds),
            'class_count' => count($classIds),
            'student_count' => count($students),
            'task_count' => count($tasks)
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'DB error: ' . $e->getMessage()]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
