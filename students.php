<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Відповідь для preflight запитів
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Додаємо логування
function logDebug($message, $data = null) {
    $logFile = dirname(__FILE__) . "/debug.log";
    $timestamp = date("Y-m-d H:i:s");
    $logEntry = "[{$timestamp}] {$message}";
    
    if ($data !== null) {
        $logEntry .= " " . json_encode($data, JSON_UNESCAPED_UNICODE);
    }
    
    file_put_contents($logFile, $logEntry . PHP_EOL, FILE_APPEND);
}

// Функція для безпечного отримання даних з запиту
function getRequestData() {
    $inputData = file_get_contents("php://input");
    logDebug("Вхідні дані:", $inputData);
    
    if (!empty($inputData)) {
        $data = json_decode($inputData, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            logDebug("Помилка розбору JSON:", json_last_error_msg());
            return null;
        }
        return $data;
    }
    return null;
}

// Надіслати відповідь
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    logDebug("Відповідь:", $data);
    exit;
}

// Коректний шлях до контролера
require_once 'StudentController.php';

// Обробка потенційних помилок
try {
    logDebug("Запит до students.php", $_SERVER['REQUEST_METHOD']);
    
    $controller = new StudentController();

    // Отримуємо метод запиту
    $method = $_SERVER['REQUEST_METHOD'];

    // Обробка різних HTTP методів
    switch($method) {
        case 'GET':
            // Отримати всіх студентів
            $students = $controller->getAll();
            logDebug("Отримано студентів:", count($students));
            sendResponse($students);
            break;
            
        case 'POST':
            // Отримати дані з тіла запиту
            $data = getRequestData();
            
            if(!$data) {
                throw new Exception("Помилка при розборі JSON даних");
            }
            
            if(isset($data['action']) && $data['action'] === 'delete_multiple') {
                // Видалити кількох студентів
                logDebug("Видалення кількох студентів:", $data['ids']);
                $result = $controller->deleteMultiple($data['ids']);
                sendResponse($result);
            } else {
                // Додати нового студента
                logDebug("Додавання нового студента:", $data);
                $result = $controller->add($data);
                sendResponse($result);
            }
            break;
            
        case 'PUT':
            // Оновити існуючого студента
            $data = getRequestData();
            
            if(!$data) {
                throw new Exception("Помилка при розборі JSON даних");
            }
            
            logDebug("Оновлення студента:", $data);
            $result = $controller->update($data);
            sendResponse($result);
            break;
            
        case 'DELETE':
            // Видалити студента
            $data = getRequestData();
            
            if(!$data) {
                throw new Exception("Помилка при розборі JSON даних");
            }
            
            logDebug("Видалення студента:", $data);
            $result = $controller->delete($data['id']);
            sendResponse($result);
            break;
            
        default:
            // Метод не дозволений
            logDebug("Метод не дозволений:", $method);
            sendResponse(["success" => false, "message" => "Метод не дозволений"], 405);
            break;
    }
} catch (Exception $e) {
    logDebug("Помилка:", $e->getMessage());
    sendResponse([
        "success" => false,
        "message" => "Помилка сервера: " . $e->getMessage()
    ], 500);
}
?>