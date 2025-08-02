<?php
require_once 'apiMain.php';

// Set CORS headers
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

try {
    // Debug: Check if connection exists
    if (!$conn) {
        throw new Exception("Database connection failed");
    }
    
    // Query to get teacher card data with dynamic student counts
    // This joins teachers -> classes -> student to count actual students per teacher
    $sql = "SELECT 
                t.id,
                t.teacher_name as name,
                t.email,
                t.grade_level as class_handled,
                t.subject as sections,
                t.phone,
                t.school_name,
                t.created_at,
                COALESCE(student_counts.count, 0) as count
            FROM teachers t
            LEFT JOIN (
                SELECT 
                    c.teacher_id,
                    COUNT(s.id) as count
                FROM classes c
                LEFT JOIN student s ON c.id = s.class_id
                GROUP BY c.teacher_id
            ) student_counts ON t.id = student_counts.teacher_id
            ORDER BY t.created_at DESC";
    
    // Debug: Log the query
    error_log("Executing query: " . $sql);
    
    $result = $conn->query($sql);
    
    if ($result === false) {
        throw new Exception("Query failed: " . $conn->error);
    }
    
    $teacherCards = [];
    $rowCount = 0;
    
    while ($row = $result->fetch_assoc()) {
        $rowCount++;
        
        // Ensure all required fields have values
        $row['name'] = $row['name'] ?? 'Unknown Teacher';
        $row['class_handled'] = $row['class_handled'] ?? '';
        $row['sections'] = $row['sections'] ?? '';
        $row['count'] = intval($row['count']); // Ensure it's an integer
        
        $teacherCards[] = $row;
    }
    
    // Debug: Log the number of records found
    error_log("Found " . $rowCount . " teacher records");
    error_log("Teacher cards data: " . json_encode($teacherCards));
    
    // Set response headers
    header('Content-Type: application/json');
    http_response_code(200);
    
    // Return success response with data
    echo json_encode([
        'success' => true,
        'data' => $teacherCards,
        'count' => count($teacherCards)
    ]);
    
} catch (Exception $e) {
    error_log("Error in getTeacherCardsData.php: " . $e->getMessage());
    
    // Set error response
    header('Content-Type: application/json');
    http_response_code(500);
    
    echo json_encode([
        'success' => false,
        'error' => 'Failed to fetch teacher cards data',
        'message' => $e->getMessage(),
        'data' => []
    ]);
}

// Close connection if it exists
if (isset($conn) && $conn) {
    $conn->close();
}
?>