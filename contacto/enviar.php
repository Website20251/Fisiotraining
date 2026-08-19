<?php

declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

function clean_input(string $value): string
{
    $value = trim($value);
    $value = str_replace(["\r", "\n"], ' ', $value);
    return filter_var($value, FILTER_UNSAFE_RAW, FILTER_FLAG_STRIP_LOW);
}

function response_payload(bool $success, string $message, array $extra = []): array
{
    return array_merge([
        'success' => $success,
        'message' => $message,
    ], $extra);
}

function text_length(string $value): int
{
    return function_exists('mb_strlen') ? mb_strlen($value) : strlen($value);
}

$nombre = clean_input($_POST['nombre'] ?? '');
$correo = clean_input($_POST['correo'] ?? '');
$celular = clean_input($_POST['celular'] ?? '');
$sede = clean_input($_POST['sede'] ?? '');
$servicio = clean_input($_POST['servicio'] ?? '');
$objetivo = clean_input($_POST['objetivo'] ?? '');
$horario = clean_input($_POST['horario'] ?? '');
$mensaje = trim((string)($_POST['mensaje'] ?? ''));
$isAjax = isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower((string)$_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
$expectsJson = $isAjax || (isset($_SERVER['HTTP_ACCEPT']) && strpos((string)$_SERVER['HTTP_ACCEPT'], 'application/json') !== false);

$errors = [];

if ($nombre === '' || text_length($nombre) < 3) {
    $errors[] = 'El nombre es obligatorio.';
}

if ($correo !== '' && !filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'El correo no es válido.';
}

if ($celular === '' || !preg_match('/^[0-9+\s()-]{7,20}$/', $celular)) {
    $errors[] = 'El celular debe contener entre 7 y 20 caracteres válidos.';
}

$allowedServices = [
    'Fisioterapia',
    'Entrenamiento terapéutico',
    'Plan Premium: Fisioterapia + Entrenamiento',
    'Programa Integral: Nutrición + Entrenamiento',
    'Deseo orientación',
];
if (!in_array($servicio, $allowedServices, true)) {
    $errors[] = 'Selecciona un servicio válido.';
}

$allowedObjetivos = [
    'Aliviar dolor o recuperarme de una lesión',
    'Mejorar fuerza y movilidad',
    'Bajar de peso / reducir grasa',
    'Mejorar mi condición física',
    'Otro',
];
if (!in_array($objetivo, $allowedObjetivos, true)) {
    $errors[] = 'Selecciona tu principal objetivo.';
}

$allowedSedes = ['Los Olivos', 'San Isidro / Magdalena'];
if (!in_array($sede, $allowedSedes, true)) {
    $errors[] = 'Selecciona una sede válida.';
}

$allowedHorarios = ['', 'Mañana', 'Tarde', 'Noche'];
if (!in_array($horario, $allowedHorarios, true)) {
    $errors[] = 'Selecciona un horario válido.';
}

if ($errors !== []) {
    http_response_code(422);
    $payload = response_payload(false, implode(' ', $errors), ['errors' => $errors]);
    if ($expectsJson) {
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    echo '<!doctype html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Error al enviar | Fisiotraining</title><style>body{font-family:Arial,sans-serif;background:#f8fafc;color:#18293b;display:grid;place-items:center;min-height:100vh;margin:0;padding:2rem}main{max-width:560px;background:#fff;border:1px solid #e8edf2;padding:2.4rem;border-radius:18px;box-shadow:0 5px 18px rgba(15,45,75,.1)}h1{color:#0c315d;font-size:1.4rem;margin:0 0 .8rem}a{color:#0758ad;font-weight:700}</style></head><body><main><h1>No pudimos enviar tu mensaje</h1><p>' . htmlspecialchars(implode(' ', $errors), ENT_QUOTES, 'UTF-8') . '</p><p><a href="../index.html">Volver al sitio</a></p></main></body></html>';
    exit;
}

$correoTexto = $correo !== '' ? $correo : 'No proporcionado';
$horarioTexto = $horario !== '' ? $horario : 'Sin preferencia';
$mensajeTexto = $mensaje !== '' ? $mensaje : 'Sin detalle adicional.';
$fullMessage = "Nombre: {$nombre}\nCorreo: {$correoTexto}\nCelular: {$celular}\nServicio: {$servicio}\nObjetivo: {$objetivo}\nSede: {$sede}\nHorario de preferencia: {$horarioTexto}\n\nMensaje:\n{$mensajeTexto}";
$mailSent = false;
$mailError = null;

$autoload = dirname(__DIR__) . '/vendor/autoload.php';
if (is_file($autoload)) {
    require_once $autoload;

    if (class_exists(PHPMailer::class)) {
        try {
            $mail = new PHPMailer(true);
            $mail->CharSet = 'UTF-8';
            $mail->isSMTP();
            $smtpUser = getenv('FISIOTRAINING_SMTP_USER') ?: 'usuario@example.com';
            $mail->Host = getenv('FISIOTRAINING_SMTP_HOST') ?: 'smtp.example.com';
            $mail->SMTPAuth = true;
            $mail->Username = $smtpUser;
            $mail->Password = getenv('FISIOTRAINING_SMTP_PASS') ?: 'cambia-esta-clave';
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = (int)(getenv('FISIOTRAINING_SMTP_PORT') ?: 587);
            $mail->setFrom($smtpUser, 'Fisiotraining');
            $mail->addAddress(getenv('FISIOTRAINING_TO_EMAIL') ?: 'jhoseptrujillo367@gmail.com', 'Fisiotraining');
            if ($correo !== '') {
                $mail->addReplyTo($correo, $nombre);
            }
            $mail->Subject = 'Nuevo contacto desde Fisiotraining';
            $mail->Body = $fullMessage;
            $mail->send();
            $mailSent = true;
        } catch (Exception $exception) {
            $mailError = $exception->getMessage();
        }
    }
}

if (!$mailSent) {
    $headers = "From: Fisiotraining <no-reply@fisiotraining.pe>\r\n";
    if ($correo !== '') {
        $headers .= "Reply-To: {$correo}\r\n";
    }
    $headers .= "Content-Type: text/plain; charset=UTF-8";

    $toEmail = getenv('FISIOTRAINING_TO_EMAIL') ?: 'jhoseptrujillo367@gmail.com';
    $fallback = @mail($toEmail, 'Nuevo contacto desde Fisiotraining', $fullMessage, $headers);

    $mailSent = $fallback;
}

if (!$mailSent) {
    http_response_code(500);
    $message = $mailError ? 'No se pudo enviar el mensaje. ' . $mailError : 'No se pudo enviar el mensaje en este momento.';
    if ($expectsJson) {
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode(response_payload(false, $message), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    echo '<!doctype html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Error al enviar | Fisiotraining</title><style>body{font-family:Arial,sans-serif;background:#f8fafc;color:#18293b;display:grid;place-items:center;min-height:100vh;margin:0;padding:2rem}main{max-width:560px;background:#fff;border:1px solid #e8edf2;padding:2.4rem;border-radius:18px;box-shadow:0 5px 18px rgba(15,45,75,.1)}h1{color:#0c315d;font-size:1.4rem;margin:0 0 .8rem}a{color:#0758ad;font-weight:700}</style></head><body><main><h1>No pudimos enviar tu mensaje</h1><p>' . htmlspecialchars($message, ENT_QUOTES, 'UTF-8') . '</p><p><a href="../index.html">Volver al sitio</a></p></main></body></html>';
    exit;
}

$successMessage = 'Mensaje enviado correctamente. Te contactaremos en breve.';
if ($expectsJson) {
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode(response_payload(true, $successMessage), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

echo '<!doctype html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Mensaje enviado | Fisiotraining</title><style>body{font-family:Arial,sans-serif;background:#f8fafc;color:#18293b;display:grid;place-items:center;min-height:100vh;margin:0;padding:2rem}main{max-width:560px;background:#fff;border:1px solid #e8edf2;padding:2.4rem;border-radius:18px;box-shadow:0 5px 18px rgba(15,45,75,.1);text-align:center}h1{color:#0c315d;font-size:1.4rem;margin:0 0 .8rem}a{color:#0758ad;font-weight:700}</style></head><body><main><h1>Gracias por escribirnos</h1><p>Tu mensaje fue enviado correctamente.</p><p><a href="../index.html">Volver al sitio</a></p></main></body></html>';
