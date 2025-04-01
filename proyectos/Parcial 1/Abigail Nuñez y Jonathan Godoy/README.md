# Circuito aritmético para verificar operaciones matemáticas sin revelar los valores de entrada, utilizando pruebas de conocimiento cero.

Este mini-proyecto demuestra la aplicabilidad de las pruebas de conocimiento cero en la verificación de operaciones matemáticas sin revelar los valores de entrada. A través del uso de Circom y SNARKs, se ha implementado un circuito aritmético capaz de validar ecuaciones de forma segura y eficiente.

## Requisitos

- Circom
- Npm

## Ejecución

Ejecutaremos distintos scripts para el proceso, asegurándonos de seguir el flujo correcto para evitar errores y garantizar la correcta generación y verificación de la prueba de conocimiento cero. A continuación, se describen los pasos que se deben seguir:

1. Nos aseguramos de dar permiso a todos los scripts para que puedan ejecutarse correctamente:

```
chmod +x *.sh
```

2.  A continuación, ejecutamos los scripts en este orden:

```
./compilar.sh
./generar_witness.sh
./ceremonia.sh
./generar_prueba_y_verificacion.sh
```

Durante la ejecución, cada script desempeña un papel clave en el proceso de generación de la prueba de conocimiento cero:

-   `compilar.sh`: Compila el circuito y genera los archivos necesarios.
    
-   `generar_witness.sh`: Genera el testigo (witness) basado en las entradas privadas y públicas.
    
-   `ceremonia.sh`: Realiza la configuración de confianza requerida para el protocolo SNARK.
    
-   `generar_prueba_y_verificacion.sh`: Genera la prueba y verifica su validez.
    

Al finalizar, si la verificación es exitosa, se obtendrá un mensaje indicando que la prueba es válida.

Este enfoque permite demostrar la validez de una operación sin exponer información confidencial, lo que es útil en aplicaciones como blockchain y privacidad de datos.

**Realizado por:** Abigail Mercedes Nuñez Fernandez y Jonathan Sebastian Godoy Silva.