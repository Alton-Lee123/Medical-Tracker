<?php
session_start();


$host = "localhost";
$dbname = "medical_tracker";
$username = "root";
$password = "";

$conn = new mysqli($host, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}


$error = "";

if ($_SERVER["REQUEST_METHOD"] == "POST") {

    $email = trim($_POST["email"]);
    $pass = trim($_POST["password"]);

    $stmt = $conn->prepare("SELECT id, name, password FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();

        if (password_verify($pass, $user["password"])) {

            $_SESSION["user_id"] = $user["id"];
            $_SESSION["user_name"] = $user["name"];

            header("Location: index.html"); 
            exit();
        } else {
            $error = "Invalid password.";
        }
    } else {
        $error = "No account found with that email.";
    }
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>Login - Medical Tracker</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>

<h2 style="text-align:center;">Login</h2>

<form method="POST" style="max-width:400px;margin:40px auto;">
    <label>Email</label>
    <input type="email" name="email" required style="width:100%;padding:10px;margin-bottom:15px;">

    <label>Password</label>
    <input type="password" name="password" required style="width:100%;padding:10px;margin-bottom:15px;">

    <button type="submit">Login</button>

    <?php if($error): ?>
        <p style="color:red;"><?php echo $error; ?></p>
    <?php endif; ?>
</form>

</body>
</html>
