<?php
$cicx = new CICX();
if(isset($_GET['login'])) $cicx->login();
if(isset($_GET['save'])) $cicx->save();
if(isset($_GET['signup'])) $cicx->signup();


class Access {
	const DB_NAME = 'formmaker';
	const DB_HOST = 'localhost';
	const DB_USER = 'root';
	const DB_PASSWORD = 'root';
	public $db;
}


class CICX extends Access {

	# Create the PDO database object
    public function __construct() {
		try {
			$this->db = new PDO('mysql:dbname=' . self::DB_NAME . ';host=' . self::DB_HOST, self::DB_USER, self::DB_PASSWORD, array(PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8"));
		} catch (PDOException $e) {
			file_put_contents('PDOErrors.txt', date('d-m-Y H:i:s') . ' - ' . $e->getMessage() . "\r\n", FILE_APPEND);
		}
	}

	public function login(){
		$data = array(
			':email' => $_POST['login-email'],
			':password' => md5($_POST['login-password'])
		);

		$query = $this->db
			->prepare("SELECT COUNT(1) FROM users WHERE email = :email AND password = :password");
		$query->execute($data);

		$result = $query->fetchColumn();
		echo $result;
	}



	public function save(){
		$data = array(
			':user' => $_POST['user'],
			':form' => json_decode($_POST['form'])[0]
		);

		@$this->db
			->prepare("INSERT INTO forms (id_user, form)
				VALUES (:user, :form)")
			->execute($data);
	}



	public function signup(){
		$data = array(
			':email' => $_POST['signup-email'],
			':password' => md5($_POST['signup-password'])
		);

		@$this->db
			->prepare("INSERT INTO users (email, password)
				VALUES (:email, :password)")
			->execute($data);
	}
}