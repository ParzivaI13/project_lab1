<?php
class Student {
    private $conn;
    private $table_name = "students";

    public $id;
    public $group;
    public $firstName;
    public $lastName;
    public $gender;
    public $dob;
    public $onlineStatus;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Отримати всіх студентів
    public function getAll() {
        $query = "SELECT * FROM " . $this->table_name;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Створити нового студента
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                SET 
                    `group` = :group,
                    firstName = :firstName,
                    lastName = :lastName,
                    gender = :gender,
                    dob = :dob,
                    onlineStatus = :onlineStatus";

        $stmt = $this->conn->prepare($query);

        // Очистка даних - видаляємо htmlspecialchars для onlineStatus
        $this->group = htmlspecialchars(strip_tags($this->group));
        $this->firstName = htmlspecialchars(strip_tags($this->firstName));
        $this->lastName = htmlspecialchars(strip_tags($this->lastName));
        $this->gender = htmlspecialchars(strip_tags($this->gender));
        $this->dob = htmlspecialchars(strip_tags($this->dob));
        // Зберігаємо onlineStatus як 1 або 0 замість HTML-коду
        $this->onlineStatus = $this->onlineStatus === '<i class="fa-solid fa-check" style="color: green;"></i>' ? '1' : '0';

        // Прив'язка параметрів
        $stmt->bindParam(":group", $this->group);
        $stmt->bindParam(":firstName", $this->firstName);
        $stmt->bindParam(":lastName", $this->lastName);
        $stmt->bindParam(":gender", $this->gender);
        $stmt->bindParam(":dob", $this->dob);
        $stmt->bindParam(":onlineStatus", $this->onlineStatus);

        // Виконання запиту
        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    // Оновити студента
    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                SET 
                    `group` = :group,
                    firstName = :firstName,
                    lastName = :lastName,
                    gender = :gender,
                    dob = :dob,
                    onlineStatus = :onlineStatus
                WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        // Очистка даних
        $this->id = htmlspecialchars(strip_tags($this->id));
        $this->group = htmlspecialchars(strip_tags($this->group));
        $this->firstName = htmlspecialchars(strip_tags($this->firstName));
        $this->lastName = htmlspecialchars(strip_tags($this->lastName));
        $this->gender = htmlspecialchars(strip_tags($this->gender));
        $this->dob = htmlspecialchars(strip_tags($this->dob));
        // Зберігаємо onlineStatus як 1 або 0 замість HTML-коду
        $this->onlineStatus = $this->onlineStatus === '<i class="fa-solid fa-check" style="color: green;"></i>' ? '1' : '0';

        // Прив'язка параметрів
        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":group", $this->group);
        $stmt->bindParam(":firstName", $this->firstName);
        $stmt->bindParam(":lastName", $this->lastName);
        $stmt->bindParam(":gender", $this->gender);
        $stmt->bindParam(":dob", $this->dob);
        $stmt->bindParam(":onlineStatus", $this->onlineStatus);

        // Виконання запиту
        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    // Видалити студента
    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);

        // Очистка даних
        $this->id = htmlspecialchars(strip_tags($this->id));
        
        // Прив'язка параметра
        $stmt->bindParam(":id", $this->id);

        // Виконання запиту
        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    // Отримати одного студента
    public function getOne() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE id = :id LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        
        // Прив'язка параметра
        $stmt->bindParam(":id", $this->id);
        
        // Виконання запиту
        $stmt->execute();
        
        // Отримання даних
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if($row) {
            $this->group = $row['group'];
            $this->firstName = $row['firstName'];
            $this->lastName = $row['lastName'];
            $this->gender = $row['gender'];
            $this->dob = $row['dob'];
            $this->onlineStatus = $row['onlineStatus'];
            return true;
        }
        return false;
    }
    
    // Видалити кілька студентів
    public function deleteMultiple($ids) {
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $query = "DELETE FROM " . $this->table_name . " WHERE id IN ($placeholders)";
        $stmt = $this->conn->prepare($query);
        
        // Виконання запиту
        return $stmt->execute($ids);
    }
}