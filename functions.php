<?php
//require_once('connect.class.php');
$formmaker = new FormMaker();
if(isset($_GET['delete'])) $formmaker->delete();
if(isset($_GET['load'])) $formmaker->load();
if(isset($_GET['loadlist'])) $formmaker->loadlist();
if(isset($_GET['login'])) $formmaker->login();
if(isset($_GET['logout'])) $formmaker->logout();
if(isset($_GET['menu'])) $formmaker->menu();
if(isset($_GET['newform'])) $formmaker->newform();
if(isset($_GET['preview'])) $formmaker->preview();
if(isset($_GET['save'])) $formmaker->save();
if(isset($_GET['signup'])) $formmaker->signup();



class Access {
	const DB_NAME = 'formmaker';
	const DB_HOST = 'localhost';
	const DB_USER = 'root';
	const DB_PASSWORD = 'root';
	public $db;
}



class FormMaker extends Access {

	# Create the PDO database object
    public function __construct() {
		try {
			$this->db = new PDO('mysql:dbname=' . self::DB_NAME . ';host=' . self::DB_HOST, self::DB_USER, self::DB_PASSWORD, array(PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8"));
		} catch (PDOException $e) {
			file_put_contents('PDOErrors.txt', date('d-m-Y H:i:s') . ' - ' . $e->getMessage() . "\r\n", FILE_APPEND);
		}
	}



	public function delete(){
		session_start();
		$data = array(
			':delete' => $_GET['delete'],
			':user' => $_SESSION['user']
		);
		$query = $this->db
			->prepare("DELETE FROM forms WHERE id = :delete AND id_user = :user");
		$query->execute($data);
	}



	public function load(){
		session_start();
		$query = $this->db
			->prepare("SELECT title, form, css, public FROM forms WHERE id = {$_GET['load']} AND id_user = {$_SESSION['user']}");
		$query->execute();
		$result = $query->fetch(PDO::FETCH_ASSOC);

		if(!empty($result)):
			$_SESSION['id_form'] = $_GET['load'];
			$i = 0; $order = '';
			$forms = unserialize($result['form']);
			$title = (isset($result['title']) && !empty($result['title'])) ? $result['title'] : 'Untitled';
			$public = (isset($result['public']) && $result['public'] == 1) ? 'true' : 'false';
?>
localStorage.clear();
localStorage.title = <?php echo "\"$title\""; ?>;
localStorage.css = <?php echo json_encode($result['css']); ?>;
<?php
			foreach($forms as $form):
				$i++;
				$order .= "slot-$i,";
				echo "localStorage['slot-$i'] = '$form';\n";
			endforeach;
?>
localStorage.order = "<?php echo substr($order,0,-1); ?>";
localStorage.public = "<?php echo $public; ?>";
window.load();
document.location.reload();
<?php
		endif;
	}



	public function loadlist(){
		session_start();
		$query = $this->db
			->prepare("SELECT id, title FROM forms WHERE id_user = {$_SESSION['user']}");
		$query->execute();
		$result = $query->fetchAll(PDO::FETCH_ASSOC);

		echo "<h5>Choose a form to load</h5><ul>";
		foreach($result as $row):
			$title = (isset($row['title']) && !empty($row['title'])) ? $row['title'] : 'Untitled';
			echo "<li><a data-id=\"{$row['id']}\" href=\"javascript:;\">{$title}</a><i class=\"delete glyphicon glyphicon-remove\" data-id=\"{$row['id']}\" onclick=\"deleteForm(this)\" title=\"Delete this form\"></i></li>\n";
		endforeach;
		echo "</ul>";
	}



	public function login(){
		$data = array(
			':email' => $_POST['login-email'],
			':password' => md5($_POST['login-password'])
		);
		$query = $this->db
			->prepare("SELECT COUNT(1) as 'count', id FROM users WHERE email = :email AND password = :password");
		$query->execute($data);
		$result = $query->fetch(PDO::FETCH_ASSOC);

		session_start();
		if($result['count']) $_SESSION['user'] = $result['id'];
		echo $result['count'];
	}



	public function logout(){
		session_start();
		$_SESSION = array();
 		session_destroy();
	}



	public function menu(){
		session_start();
		if(isset($_SESSION['user']) && $_SESSION['user'] !== ''):
?>
$('#menu-login').hide();
$('#logged-menu').show();
$('#menu-save').attr('disabled', false);
<?php
		endif;
	}



	public function newform(){
		session_start();
		if(isset($_SESSION['id_form']) && $_SESSION['id_form'] !== '') $_SESSION['id_form'] = NULL;
		header('location: http://formmaker:8888/dist');
	}



	public function save(){
		session_start();
		$id_form = (isset($_SESSION['id_form'])) ? $_SESSION['id_form'] : '';
		$public = (isset($_POST['public']) && $_POST['public'] === 'false') ? 0 : 1;
		$data = array(
			':user' => $_SESSION['user'],
			':id_form' => $id_form,
			':title' => $_POST['title'],
			':form' => serialize(json_decode($_POST['form'],true)),
			':css' => $_POST['css'],
			':public' => $public
		);

		$query = $this->db
			->prepare("INSERT INTO forms (id, id_user, created_at, title, form, css, public)
				VALUES (:id_form, :user, now(), :title, :form, :css, :public)
				ON DUPLICATE KEY UPDATE title = :title, form = :form, css = :css, public = :public");
		$query->execute($data);
		$id_form = $this->db->lastInsertId();
		$_SESSION['id_form'] = $id_form;
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



	public function preview(){
		if(isset($_GET['preview']) && $_GET['preview'] !== ''):
			$query = $this->db
				->prepare("SELECT css, form FROM forms WHERE id = {$_GET['preview']}");
			$query->execute();
			$result = $query->fetch(PDO::FETCH_ASSOC);
		else:
			$result['css'] = $_POST['css'];
			$result['form'] = serialize(json_decode($_POST['form']));
		endif;


		$default_error_msg = '<label class="error">This field is required.</label>';
		$forms = unserialize($result['form']);
		$generated_form = '';
		$i = 0;
		foreach($forms as $form):
			$form = json_decode($form);
			$i++;
			$options = NULL;

			// Treat the attributes of each field
			foreach($form as $key => $val):
				if($key === 'type'):
					$type = $val;
				else:
					$temp_attribute = explode('_', $key);
					if(is_array($temp_attribute)) $attribute = $temp_attribute[1];
					$$attribute = $val;
				endif;


				$required = (isset($form->{$type . '_required'}) && $form->{$type . '_required'} === 'on') ? 'required' : '';
				$label = (isset($form->{$type . '_label'}) && $form->{$type . '_label'} !== '') ? '<label>' . $form->{$type . '_label'} : '';
				$endlabel = (isset($form->{$type . '_label'}) && $form->{$type . '_label'} !== '') ? '</label>' : '';
				$minlength = (isset($form->{$type . '_minlength'}) && $form->{$type . '_minlength'} !== '') ? 'minlength="' . $form->{$type . '_minlength'} . '"' : '';
				$maxlength = (isset($form->{$type . '_maxlength'}) && $form->{$type . '_maxlength'} !== '') ? 'maxlength="' . $form->{$type . '_maxlength'} . '"' : '';
				$placeholder = (isset($form->{$type . '_placeholder'}) && $form->{$type . '_placeholder'} !== '') ? 'placeholder="' . $form->{$type . '_placeholder'} . '"' : '';
				$mask = (isset($form->{$type . '_mask'}) && $form->{$type . '_mask'} !== '') ? 'data-mask="' . $form->{$type . '_mask'} . '"' : '';
				$value = (isset($form->{$type . '_value'}) && $form->{$type . '_value'} !== '') ? 'value="' . $form->{$type . '_value'} . '"' : '';
				$validate_msg = (isset($form->{$type . '_error_message'}) && ($form->{$type . '_error_message'} !== '')) ? '<label class="error button-error">' . $form->{$type . '_error_message'} . '</label>' : $default_error_msg;

			endforeach;



			if(isset($form->{$type . '_options'}) && $form->{$type . '_options'} !== NULL):
				$options = explode("\n",$options);
			endif;



			// Generates the final HTML
			$generated_form .= "<div id=\"slot-$i\">";
			switch ($form->type):
				case 'button':
					$generated_form .= "<input type=\"button\" name=\"button$i\" value=\"$value\" $required>$validate_msg";
					break;

				case 'email':
					$generated_form .= "<input type=\"email\" name=\"email$i\" value=\"$value\" $minlength $maxlength $placeholder $required>$validate_msg";
					break;

				case 'label':
					$label = substr($label,7);
					$generated_form .= "<label class=\"label\">$label</label>";
					break;

				case 'password':
					$generated_form .= "<input type=\"password\" name=\"password$i\" value=\"$value\" $minlength $maxlength $placeholder $required>$validate_msg";
					break;

				case 'tel':
					$generated_form .= "<input type=\"tel\" name=\"tel$i\" value=\"$value\" $mask $minlength $maxlength $placeholder $required>$validate_msg";
					break;

				case 'text':
					$generated_form .= "$label<input type=\"text\" name=\"text$i\" $mask $minlength $maxlength $placeholder $required $value>$endlabel$validate_msg";
					break;

				case 'textarea':
					$value = substr($value, 7, -1);
					$generated_form .= "$label<textarea name=\"textarea$i\" $placeholder $required>$value</textarea>$endlabel$validate_msg";
					break;
				case 'url':
					$generated_form .= "$label<input type=\"text\" name=\"url$i\" $minlength $maxlength $placeholder $required $value>$endlabel$validate_msg";
					break;


				case 'checkbox':
					$generated_form .= "<p class=\"label\">{$form->{'checkbox_label'}}</p>";
					foreach($options as $option):
						$generated_form .= "<label><input type=\"checkbox\" name=\"checkbox{$i}[]\">$option</label>$endlabel";
					endforeach;
					$generated_form .= $endlabel . $validate_msg;
					break;

				case 'radio':
					$generated_form .= "<p class=\"label\">{$form->{'radio_label'}}</p>";
					foreach($options as $option):
						$generated_form .= "<label><input type=\"radio\" name=\"radio$i\">$option</label>";
					endforeach;
					$generated_form .= $validate_msg;
					break;

				case 'dropdown':
					$generated_form .= "<p class=\"label\">{$form->{'dropdown_label'}}</p><select name=\"select$i\">";
					if($placeholder):
						$placeholder = substr($placeholder,13,-1);
						$generated_form .= "<option disabled selected>$placeholder</option>";
					endif;
					foreach($options as $option):
						$generated_form .= "<option>$option</option>";
					endforeach;
					$generated_form .= "</select>$validate_msg";
					break;


			endswitch;
			$generated_form .= "</div>\n";
		endforeach;

		$html = <<<HEREDOC
<!doctype html>
<!--[if lt IE 7]>      <html class="no-js lt-ie9 lt-ie8 lt-ie7"> <![endif]-->
<!--[if IE 7]>         <html class="no-js lt-ie9 lt-ie8"> <![endif]-->
<!--[if IE 8]>         <html class="no-js lt-ie9"> <![endif]-->
<!--[if gt IE 8]><!--> <html class="no-js"> <!--<![endif]-->
<head>
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Forms made easy - FormMaker</title>
<meta name="viewport" content="width=device-width">
<style>
{$result['css']}
</style>
</head>
<body>
<div id="container">
$generated_form
</div>
</body>
</html>
HEREDOC;
		echo $html;
	}
}