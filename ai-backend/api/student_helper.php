<?php
// Helper functions for managing both student tables

/**
 * Get all students from both tables for a specific class
 */
function getAllStudentsForClass($pdo, $class_id) {
    // Get from existing 'student' table
    $stmt1 = $pdo->prepare("
        SELECT 
            s.id,
            s.name,
            s.avatar,
            s.school,
            s.stars,
            s.day_streak as dayStreak,
            s.level,
            s.wpm,
            s.accuracy,
            c.name as class,
            c.section,
            CONCAT(c.name, ' - ', c.section) as grade,
            'existing' as source
        FROM student s
        JOIN classes c ON s.class_id = c.id
        WHERE s.class_id = ?
    ");
    
    $stmt1->execute([$class_id]);
    $existingStudents = $stmt1->fetchAll(PDO::FETCH_ASSOC);
    
    // Get from new 'students' table
    $stmt2 = $pdo->prepare("
        SELECT 
            s.id,
            s.name,
            s.avatar,
            s.school,
            s.stars,
            s.day_streak as dayStreak,
            s.level,
            s.wpm,
            s.accuracy,
            c.name as class,
            c.section,
            CONCAT(c.name, ' - ', c.section) as grade,
            'new' as source
        FROM students s
        JOIN classes c ON s.class_id = c.id
        WHERE s.class_id = ?
    ");
    
    $stmt2->execute([$class_id]);
    $newStudents = $stmt2->fetchAll(PDO::FETCH_ASSOC);
    
    // Combine and sort
    $allStudents = array_merge($existingStudents, $newStudents);
    usort($allStudents, function($a, $b) {
        return strcmp($a['name'], $b['name']);
    });
    
    return $allStudents;
}

/**
 * Check if student name exists in either table for a specific class
 */
function studentNameExists($pdo, $class_id, $name) {
    $stmt = $pdo->prepare("
        SELECT 'existing' as source FROM student WHERE class_id = ? AND name = ?
        UNION
        SELECT 'new' as source FROM students WHERE class_id = ? AND name = ?
    ");
    $stmt->execute([$class_id, $name, $class_id, $name]);
    
    return $stmt->fetch() !== false;
}

/**
 * Get total student count for a class from both tables
 */
function getTotalStudentCount($pdo, $class_id) {
    $stmt = $pdo->prepare("
        SELECT 
            (
                COALESCE(existing_count.count, 0) + COALESCE(new_count.count, 0)
            ) as total_count
        FROM classes c
        LEFT JOIN (
            SELECT class_id, COUNT(*) as count 
            FROM student 
            WHERE class_id = ?
            GROUP BY class_id
        ) existing_count ON c.id = existing_count.class_id
        LEFT JOIN (
            SELECT class_id, COUNT(*) as count 
            FROM students 
            WHERE class_id = ?
            GROUP BY class_id
        ) new_count ON c.id = new_count.class_id
        WHERE c.id = ?
    ");
    
    $stmt->execute([$class_id, $class_id, $class_id]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    return $result ? $result['total_count'] : 0;
}

/**
 * Migrate a student from 'students' table to 'student' table
 */
function migrateStudentToExisting($pdo, $student_id) {
    try {
        $pdo->beginTransaction();
        
        // Get student data from 'students' table
        $stmt = $pdo->prepare("SELECT * FROM students WHERE id = ?");
        $stmt->execute([$student_id]);
        $student = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$student) {
            throw new Exception("Student not found in students table");
        }
        
        // Insert into 'student' table
        $stmt = $pdo->prepare("
            INSERT INTO student (class_id, name, avatar, school, stars, day_streak, level, wpm, accuracy) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $student['class_id'],
            $student['name'],
            $student['avatar'],
            $student['school'],
            $student['stars'],
            $student['day_streak'],
            $student['level'],
            $student['wpm'],
            $student['accuracy']
        ]);
        
        $new_id = $pdo->lastInsertId();
        
        // Remove from 'students' table
        $stmt = $pdo->prepare("DELETE FROM students WHERE id = ?");
        $stmt->execute([$student_id]);
        
        $pdo->commit();
        
        return $new_id;
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}
?>