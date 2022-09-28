<?php
namespace Classes;

use PHPMailer\PHPMailer\PHPMailer;



//Load Composer's autoloader
// require '/../vendor/autoload.php';
// require '/vendor/Exception.php';
// require '/vendor/PHPMailer.php';
// require '/vendor/SMTP.php';


class Email {
    public $email;
    public $nombre;
    public $token;
    public function __construct($email, $nombre, $token)
    {
        $this->email = $email;
        $this->nombre = $nombre;
        $this->token = $token;

    }
    public function enviarConfirmacion(){
        //Crear el objeto de Email
        //Create an instance; passing `true` enables exceptions
        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->Host = 'smtp.mailtrap.io';
        $mail->SMTPAuth = true;
        $mail->Port = 2525;
        $mail->Username = 'ff649ff56fb05e';
        $mail->Password = '9e645b8375cc27';

        $mail->setFrom('cuentas@appsalon.com');
        $mail->addAddress('cuentas@appsalon.com', 'AppSalon.com'); 

        $mail->Subject = 'Confirma tú cuenta';
        //Set HTML
        $mail->isHTML(TRUE); 
        $mail->CharSet = "UTF-8";
        $contenido = "<html>";
        $contenido .= "<p><strong>Hola ". $this->nombre . "</strong> Haz creado tú cuenta en App Salon, solo debes confirmarla presionando
        el siguiente enlace</p>";
        $contenido .= "<p>Presiona aquí: <a href='http://localhost:3000/confirmar-cuenta?toke=". $this->token. "'>Confirma Cuenta</a></p>";
        $contenido .= "<p>Si tú no solicitaste esta cuenta, haz caso omiso de este mensaje</p>";
        $contenido .= "</html>";
        $mail->Body = $contenido;

        //Enviar el Email
        $mail->send();


    }

    public function enviarInstrucciones() {

        // create a new object
        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->Host = 'smtp.mailtrap.io';
        $mail->SMTPAuth = true;
        $mail->Port = 2525;
        $mail->Username = 'ff649ff56fb05e';
        $mail->Password = '9e645b8375cc27';

    
        $mail->setFrom('cuentas@appsalon.com');
        $mail->addAddress('cuentas@appsalon.com', 'AppSalon.com');
        $mail->Subject = 'Reestablece tu password';

        // Set HTML
        $mail->isHTML(TRUE);
        $mail->CharSet = 'UTF-8';

        $contenido = '<html>';
        $contenido .= "<p><strong>Hola " . $this->nombre .  "</strong> Has solicitado reestablecer tu password, sigue el siguiente enlace para hacerlo.</p>";
        $contenido .= "<p>Presiona aquí: <a href='http://localhost:3000/recuperar?token=" . $this->token . "'>Reestablecer Password</a>";        
        $contenido .= "<p>Si tu no solicitaste este cambio, puedes ignorar el mensaje</p>";
        $contenido .= '</html>';
        $mail->Body = $contenido;

            //Enviar el mail
        $mail->send();
    }

}
?>