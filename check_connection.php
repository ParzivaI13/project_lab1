<?php
// check_connection.php - Updated version
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once 'db.php';

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    // Explicitly test the connection
    $query = "SELECT 1";
    $stmt = $conn->prepare($query);
    $result = $stmt->execute();
    
    if ($result) {
        echo json_encode([
            "status" => "success",
            "message" => "З'єднання з базою даних встановлено успішно.",
            "dbname" => $database->dbname // Add database name for verification
        ]);
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "З'єднання встановлено, але запит не виконано."
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Помилка: " . $e->getMessage()
    ]);
}
?>