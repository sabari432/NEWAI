<?php
require_once 'apiMain.php';

// Set CORS headers
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');


// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(false, null, 'Only GET requests are allowed');
}

try {
    // Get school_id from query parameters
    $schoolId = isset($_GET['school_id']) ? intval($_GET['school_id']) : null;
    
    if (!$schoolId) {
        sendResponse(false, null, 'School ID is required');
    }
    
    // Verify school exists
    $checkSchool = $conn->prepare("SELECT id FROM schools WHERE id = ?");
    $checkSchool->bind_param("i", $schoolId);
    $checkSchool->execute();
    $schoolResult = $checkSchool->get_result();
    
    if ($schoolResult->num_rows === 0) {
        sendResponse(false, null, 'School not found');
    }
    
    // Get statistics for the school
    $stats = [
        'totalStudents' => 0,
        'totalTeachers' => 0,
        'totalClasses' => 0
    ];
    
    // Get total teachers
    $teacherStmt = $conn->prepare("SELECT COUNT(*) as count FROM teachers WHERE school_id = ?");
    $teacherStmt->bind_param("i", $schoolId);
    $teacherStmt->execute();
    $teacherResult = $teacherStmt->get_result()->fetch_assoc();
    $stats['totalTeachers'] = (int)$teacherResult['count'];
    
    // Get total students (sum from all teachers in this school)
    $studentStmt = $conn->prepare("
        SELECT COALESCE(SUM(total_students), 0) as count 
        FROM teachers 
        WHERE school_id = ? AND total_students IS NOT NULL
    ");
    $studentStmt->bind_param("i", $schoolId);
    $studentStmt->execute();
    $studentResult = $studentStmt->get_result()->fetch_assoc();
    $stats['totalStudents'] = (int)$studentResult['count'];
    
    // Get total classes (if you have a classes table)
    // For now, we'll use the total_classes from teachers table or count distinct classes
    $classStmt = $conn->prepare("
        SELECT COALESCE(SUM(total_classes), 0) as count 
        FROM teachers 
        WHERE school_id = ? AND total_classes IS NOT NULL
    ");
    $classStmt->bind_param("i", $schoolId);
    $classStmt->execute();
    $classResult = $classStmt->get_result()->fetch_assoc();
    $stats['totalClasses'] = (int)$classResult['count'];
    
    // If you have a separate classes table, use this instead:
    // $classStmt = $conn->prepare("SELECT COUNT(*) as count FROM classes WHERE school_id = ?");
    // $classStmt->bind_param("i", $schoolId);
    // $classStmt->execute();
    // $classResult = $classStmt->get_result()->fetch_assoc();
    // $stats['totalClasses'] = (int)$classResult['count'];
    
    sendResponse(true, $stats, 'School statistics retrieved successfully');
    
} catch (Exception $e) {
    error_log("Error in get_school_stats.php: " . $e->getMessage());
    sendResponse(false, null, 'Server error occurred');
}
?>