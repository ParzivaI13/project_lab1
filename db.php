<?php
class Database {
    private $host = "localhost";
    private $username = "root";
    private $password = ""; // Your database password goes here if needed
    public $dbname = "student_system";
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->dbname, $this->username, $this->password);
            $this->conn->exec("set names utf8");
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $e) {
            // Log the error instead of showing it directly
            error_log("Database connection error: " . $e->getMessage());
            return null; // Return null instead of echoing the error
        }
        return $this->conn;
    }
}
?>