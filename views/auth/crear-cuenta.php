<h1 class="nombre-pagina">Crear Cuenta</h1>
<p class="descripcion-pagina">Llena el siguiente formulario de Registro</p>

<?php  
    include_once __DIR__ . "/../templates/alertas.php";
?>
<form class="formulario" method="POST" action="/crear-cuenta">
    <div class="campo">
         <label for="nombre">Nombre(s)</label>
         <input type="text" id="nombre" name="nombre" placeholder="Tú nombre" value="<?php echo s($usuario->nombre); ?>">
    </div>
    <div class="campo">
         <label for="apellido">Apellido(s)</label>
         <input type="text" id="apellido" name="apellido" placeholder="Tú apellido" value="<?php echo s($usuario->apellido); ?>">
    </div>
    <div class="campo">
         <label for="telefono">Teléfono</label>
         <input type="tel" id="telefono" name="telefono" placeholder="Tú Teléfono" value="<?php echo s($usuario->telefono); ?>">
    </div>
    <div class="campo">
        <label for="email">Email</label>
        <input type="email" id="email" placeholder="Te E-mail" name="email" value="<?php echo s($usuario->email); ?>">
    </div>
    <div class="campo">
        <label for="password">Password</label>
        <input type="password" id="password" placeholder="Tu Password" name="password">
    </div>
    <input type="submit" class="boton" value="Crear Cuenta">
</form>
<div class="acciones">
    <a href="/">¿Ya tienes una cuenta? Inicia Sesión</a>
    <a href="/olvide">¿Olvidaste tú Contraseña?</a>
</div>