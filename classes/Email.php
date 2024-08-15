<?php

namespace Classes;

use PHPMailer\PHPMailer\{PHPMailer, SMTP, Exception};

class Email {
    public $email;
    public $nombre;
    public $token;

    public function __construct($email, $nombre, $token) {
        $this->email = $email;
        $this->nombre = $nombre;
        $this->token = $token;
    }

    private function configurarCorreo(PHPMailer $mail) {
        $mail->isSMTP();
        $mail->Host = $_ENV['EMAIL_HOST'] ?? 'smtp.mailtrap.io';
        $mail->SMTPAuth = true;
        $mail->Port = $_ENV['EMAIL_PORT'] ?? 2525;
        $mail->SMTPSecure = $_ENV['EMAIL_SSL'] ?? PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Username = $_ENV['EMAIL_USER'] ?? 'default_user';
        $mail->Password = $_ENV['EMAIL_PASS'] ?? 'default_pass';

        // Logging SMTP debug information (optional)
        $mail->SMTPDebug = SMTP::DEBUG_SERVER; // Enable verbose debug output
    }

    public function enviarConfirmacion() {
        $mail = new PHPMailer(true);
    
        try {
            $this->configurarCorreo($mail);
    
            $mail->setFrom('cuentas@appsalon.com', 'AppSalon');
            if (!filter_var($this->email, FILTER_VALIDATE_EMAIL)) {
                throw new \Exception("Dirección de correo electrónico inválida: " . $this->email);
            }
            $mail->addAddress($this->email, $this->nombre);
    
            $mail->Subject = 'Confirma tu cuenta';
            $mail->isHTML(true); 
            $mail->CharSet = 'UTF-8';
    
            $contenido = "<html>";
            $contenido .= "<p><strong>Hola " . htmlspecialchars($this->nombre) . "</strong>, haz creado tu cuenta en AppSalon. Solo debes confirmarla presionando el siguiente enlace:</p>";
            $contenido .= "<p>Presiona aquí: <a href='" . $_ENV['HOST'] . "confirmar-cuenta?token=" . htmlspecialchars($this->token) . "'>Confirma Cuenta</a></p>";
            $contenido .= "<p>Si tú no solicitaste esta cuenta, haz caso omiso de este mensaje.</p>";
            $contenido .= "</html>";
    
            $mail->Body = $contenido;
    
            // Enviar el Email
            $mail->send();
        } catch (Exception $e) {
            error_log("Error al enviar el correo de confirmación: " . $mail->ErrorInfo);
            throw new \Exception("Error al enviar el correo de confirmación: " . $mail->ErrorInfo);
        }
    }
    

    public function enviarInstrucciones() {
        $mail = new PHPMailer(true);

        try {
            $this->configurarCorreo($mail);

            $mail->setFrom('cuentas@appsalon.com', 'AppSalon');
            $mail->addAddress($this->email, $this->nombre);

            $mail->Subject = 'Reestablece tu contraseña';
            $mail->isHTML(true); 
            $mail->CharSet = 'UTF-8';

            $contenido = '<html>';
            $contenido .= "<p><strong>Hola " . htmlspecialchars($this->nombre) . "</strong>, has solicitado reestablecer tu contraseña. Sigue el siguiente enlace para hacerlo:</p>";
            $contenido .= "<p>Presiona aquí: <a href='" . $_ENV['HOST'] . "reestablecer?token=" . htmlspecialchars($this->token) . "'>Reestablecer Contraseña</a></p>";
            $contenido .= "<p>Si tú no solicitaste este cambio, puedes ignorar este mensaje.</p>";
            $contenido .= '</html>';

            $mail->Body = $contenido;

            // Enviar el Email
            $mail->send();
        } catch (Exception $e) {
            error_log("Error al enviar el correo de instrucciones: " . $mail->ErrorInfo);
            throw new \Exception("Error al enviar el correo de instrucciones: " . $mail->ErrorInfo);
        }
    }
}
