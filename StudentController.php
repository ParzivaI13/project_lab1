<?php
require_once 'Student.php';
require_once 'db.php';

class StudentController {
    private $student;
    private $db;

    public function __construct() {
        $database = new Database();
        $db = $database->getConnection();
        $this->student = new Student($db);
        $this->db = $db;
    }

    // Метод для отримання всіх студентів
    public function getAll() {
        $stmt = $this->student->getAll();
        $students = [];
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)){
            // Конвертуємо onlineStatus з бази (1/0) у відповідну іконку при відправці клієнту
            $onlineStatus = $row['onlineStatus'];
            if ($onlineStatus === '1' || $onlineStatus === 1) {
                $onlineStatus = '<i class="fa-solid fa-check" style="color: green;"></i>';
            } else {
                $onlineStatus = '<i class="fa-solid fa-xmark" style="color: red;"></i>';
            }
            
            $student = [
                'id' => $row['id'],
                'group' => $row['group'],
                'firstName' => $row['firstName'],
                'lastName' => $row['lastName'],
                'gender' => $row['gender'],
                'dob' => $row['dob'],
                'onlineStatus' => $onlineStatus
            ];
            $students[] = $student;
        }
        
        return $students;
    }
    
    // Додати студента
    public function add($data) {
        $this->student->group = $data['group'];
        $this->student->firstName = $data['firstName'];
        $this->student->lastName = $data['lastName'];
        $this->student->gender = $data['gender'];
        $this->student->dob = $data['dob'];
        $this->student->onlineStatus = $data['onlineStatus'];
        
        if($this->student->create()) {
            return [
                'success' => true,
                'message' => 'Студента додано успішно',
                'id' => $this->db->lastInsertId()
            ];
        } else {
            return [
                'success' => false,
                'message' => 'Не вдалося додати студента'
            ];
        }
    }
    
    // Оновити студента
    public function update($data) {
        $this->student->id = $data['id'];
        $this->student->group = $data['group'];
        $this->student->firstName = $data['firstName'];
        $this->student->lastName = $data['lastName'];
        $this->student->gender = $data['gender'];
        $this->student->dob = $data['dob'];
        $this->student->onlineStatus = $data['onlineStatus'];
        
        if($this->student->update()) {
            return [
                'success' => true,
                'message' => 'Студента оновлено успішно'
            ];
        } else {
            return [
                'success' => false,
                'message' => 'Не вдалося оновити студента'
            ];
        }
    }
    
    // Видалити студента
    public function delete($id) {
        $this->student->id = $id;
        
        if($this->student->delete()) {
            return [
                'success' => true,
                'message' => 'Студента видалено успішно'
            ];
        } else {
            return [
                'success' => false,
                'message' => 'Не вдалося видалити студента'
            ];
        }
    }
    
    // Видалити кількох студентів
    public function deleteMultiple($ids) {
        if($this->student->deleteMultiple($ids)) {
            return [
                'success' => true,
                'message' => 'Студентів успішно видалено'
            ];
        } else {
            return [
                'success' => false,
                'message' => 'Не вдалося видалити студентів'
            ];
        }
    }
    
    // Отримати одного студента
    public function getOne($id) {
        $this->student->id = $id;
        
        if($this->student->getOne()) {
            // Конвертуємо onlineStatus з бази (1/0) у відповідну іконку при відправці клієнту
            $onlineStatus = $this->student->onlineStatus;
            if ($onlineStatus === '1' || $onlineStatus === 1) {
                $onlineStatus = '<i class="fa-solid fa-check" style="color: green;"></i>';
            } else {
                $onlineStatus = '<i class="fa-solid fa-xmark" style="color: red;"></i>';
            }
            
            return [
                'id' => $this->student->id,
                'group' => $this->student->group,
                'firstName' => $this->student->firstName,
                'lastName' => $this->student->lastName,
                'gender' => $this->student->gender,
                'dob' => $this->student->dob,
                'onlineStatus' => $onlineStatus
            ];
        } else {
            return [
                'success' => false,
                'message' => 'Студента не знайдено'
            ];
        }
    }
}