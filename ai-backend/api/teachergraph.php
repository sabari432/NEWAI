<?php
include_once "../apiMain.php"; // 👈 Include your shared config file

try {
    // ✅ Get total teachers
    $totalTeachersQuery = "SELECT COUNT(*) as total FROM teachers";
    $totalTeachersResult = $conn->query($totalTeachersQuery);
    $totalTeachers = $totalTeachersResult->fetch_assoc()['total'] ?? 0;

    // ✅ Get total schools
    $totalSchoolsQuery = "SELECT COUNT(DISTINCT school_name) as total FROM teachers";
    $totalSchoolsResult = $conn->query($totalSchoolsQuery);
    $totalSchools = $totalSchoolsResult->fetch_assoc()['total'] ?? 0;

    // ✅ Get teacher raw data for the table
    $teacherTableQuery = "SELECT id, name, email, school_name, phone FROM teachers LIMIT 20";
    $teacherDataResult = $conn->query($teacherTableQuery);
    $teacherData = [];

    while ($row = $teacherDataResult->fetch_assoc()) {
        $teacherData[] = $row;
    }

    // ✅ Send standardized JSON response
    sendResponse(true, [
        "cards" => [
            [
                "title" => "Total Teachers",
                "value" => $totalTeachers,
                "tableData" => $teacherData
            ],
            [
                "title" => "Total Schools",
                "value" => $totalSchools,
                "tableData" => []
            ]
        ]
    ]);

} catch (Exception $e) {
    sendResponse(false, null, $e->getMessage());
}
