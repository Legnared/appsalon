<?php

// app.php
use Dotenv\Dotenv;

require __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load(); // Asegúrate de que esto esté presente

require 'funciones.php';
require 'database.php';

use Model\ActiveRecord;
ActiveRecord::setDB($db);

