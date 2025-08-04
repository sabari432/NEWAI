<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, GET, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    // Check if apiMain.php exists and can be included
    if (!file_exists('apiMain.php')) {
        throw new Exception('apiMain.php file not found');
    }
    
    require_once 'apiMain.php';
    
    // Check if database connection exists
    if (!isset($conn)) {
        throw new Exception('Database connection ($conn) not found in apiMain.php');
    }
    
    // Test database connection
    if ($conn->connect_error) {
        throw new Exception('Database connection failed: ' . $conn->connect_error);
    }
    
    // Only allow GET requests
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        sendResponse(false, null, 'Only GET requests are allowed');
        exit;
    }

    // First, let's try a simple query to check if schools table exists
    $testQuery = "SHOW TABLES LIKE 'schools'";
    $testResult = $conn->query($testQuery);
    
    if ($testResult === false) {
        throw new Exception('Failed to check if schools table exists: ' . $conn->error);
    }
    
    if ($testResult->num_rows === 0) {
        throw new Exception('Schools table does not exist in database');
    }
    
    // Try to get basic school data first
    $simpleQuery = "SELECT * FROM schools ORDER BY name ASC";
    $result = $conn->query($simpleQuery);
    
    if ($result === false) {
        throw new Exception('Simple schools query failed: ' . $conn->error);
    }
    
    $schools = [];
    while ($row = $result->fetch_assoc()) {
        $schools[] = $row;
    }
    
    // If simple query works, try the complex query with joins
    if (count($schools) > 0) {
        $complexQuery = "
            SELECT 
                s.*,
                COALESCE(t.total_teachers, 0) as total_teachers,
                COALESCE(t.total_students, 0) as total_students,
                COALESCE(c.total_classes, 0) as total_classes
            FROM schools s
            LEFT JOIN (
                SELECT 
                    school_id,
                    COUNT(*) as total_teachers,
                    SUM(COALESCE(total_students, 0)) as total_students
                FROM teachers 
                WHERE school_id IS NOT NULL
                GROUP BY school_id
            ) t ON s.id = t.school_id
            LEFT JOIN (
                SELECT 
                    school_id,
                    COUNT(*) as total_classes
                FROM classes 
                WHERE school_id IS NOT NULL
                GROUP BY school_id
            ) c ON s.id = c.school_id
            ORDER BY s.name ASC
        ";
        
        $complexResult = $conn->query($complexQuery);
        
        if ($complexResult !== false) {
            $schools = [];
            while ($row = $complexResult->fetch_assoc()) {
                // Convert numeric strings to integers
                $row['total_teachers'] = (int)($row['total_teachers'] ?? 0);
                $row['total_students'] = (int)($row['total_students'] ?? 0);
                $row['total_classes'] = (int)($row['total_classes'] ?? 0);
                $schools[] = $row;
            }
        }
    }
    
    // Check if sendResponse function exists
    if (!function_exists('sendResponse')) {
        // If sendResponse doesn't exist, create a basic response
        echo json_encode([
            'success' => true,
            'data' => ['schools' => $schools],
            'message' => 'Schools retrieved successfully (without sendResponse function)',
            'debug' => [
                'schools_count' => count($schools),
                'php_version' => PHP_VERSION,
                'mysql_version' => $conn->server_info ?? 'Unknown'
            ]
        ]);
    } else {
        sendResponse(true, ['schools' => $schools], 'Schools retrieved successfully');
    }
    
} catch (Exception $e) {
    // Log the actual error
    error_log("Detailed error in get_schools.php: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    
    // Return detailed error for debugging (remove in production)
    echo json_encode([
        'success' => false,
        'data' => null,
        'message' => 'Server error: ' . $e->getMessage(),
        'debug' => [
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ]
    ]);
}
?>