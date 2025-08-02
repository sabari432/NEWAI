<?php
require_once 'apiMain.php';

try {
    // Initialize stats
    $stats = [
        'totalStudents' => 0,
        'totalTeachers' => 0,
        'TotalClass' => 0
    ];
    
    // Get total teachers count
    $teacher_sql = "SELECT COUNT(*) as count FROM teachers";
    $teacher_result = $conn->query($teacher_sql);
    if ($teacher_result) {
        $teacher_row = $teacher_result->fetch_assoc();
        $stats['totalTeachers'] = (int)$teacher_row['count'];
    }
    
    // Get unique classes count (from grade_level column)
    $class_sql = "SELECT COUNT(DISTINCT grade_level) as count FROM teachers WHERE grade_level IS NOT NULL AND grade_level != ''";
    $class_result = $conn->query($class_sql);
    if ($class_result) {
        $class_row = $class_result->fetch_assoc();
        $stats['TotalClass'] = (int)$class_row['count'];
    }
    
    // If you have a students table, uncomment and modify this:
    /*
    $student_sql = "SELECT COUNT(*) as count FROM students";
    $student_result = $conn->query($student_sql);
    if ($student_result) {
        $student_row = $student_result->fetch_assoc();
        $stats['totalStudents'] = (int)$student_row['count'];
    }
    */
    
    // For now, set a placeholder value for students
    $stats['totalStudents'] = 0; // You can update this when you have a students table
    
    header('Content-Type: application/json');
    echo json_encode($stats);
    
} catch (Exception $e) {
    error_log("Error in getTeacherStats.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to fetch stats',
        'message' => $e->getMessage()
    ]);
}

$conn->close();
?>