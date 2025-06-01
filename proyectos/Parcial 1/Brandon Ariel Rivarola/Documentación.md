# Documentación del proyecto
## Estructura del circuito
![Estructura del circuito en **circuito.circom**](https://drive.google.com/uc?id=1iard0-wYmXR3-zf2kmJ4p32cwDL5YOTa)

Se tienen dos entradas *a* y *b*, cada una de ellas se eleva al cuadrado multiplicándose a si mismas, el resultado se suma y la misma pasa por módulo 17 para enviar el resultado a la salida *c*.
### Generación y verificación de pruebas
Luego de compilar el circuito y generar los testigos desde **entradas.json** se procede a seguir los pasos de la generación y verificación de pruebas descritas en la [documentación de circom](https://docs.circom.io/getting-started/proving-circuits/):

1. Se comienza con la fase 1 del protocolo Groth16, iniciando una ceremonia *Powers of Tau*
```bash
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
```
2. Se realizan las contribuciones (en este caso sólo será necesario una). Se deberá ingresar un conjunto de caracteres aleatorio para el secreto de la contribución
```bash
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="Primera contribucion" -v
Enter a random text. (Entropy): asdfgh
```
3. Se inicia la fase 2 del protocolo
```bash
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v
```
4. Se genera las claves de prueba y verificación con el circuito aritmético compilado
```bash
snarkjs groth16 setup circuito.r1cs pot12_final.ptau circuito_0000.zkey
```
5. Se realiza la contribución
```bash
snarkjs zkey contribute circuito_0000.zkey circuito_0001.zkey --name="Brandon"
Enter a random text. (Entropy): qwerty
```
6. Se exporta la clave en un JSON
```bash
snarkjs zkey export verificationkey circuito_0001.zkey clave.json
```
7. Se genera la prueba en base a la clave y los testigos, esto genera la salida, el cual contiene el valor *c*
```bash
snarkjs groth16 prove circuito_0001.zkey testigo.wtns prueba.json salida.json
```
8. Finalmente se verifica la prueba
```bash
snarkjs groth16 verify clave.json salida.json prueba.json
```
### Ejemplo
Para una entrada *a = 4* y *b = 6* se espera que la salida *c* sea: 

*a\*a = 16; b\*b = 36; 16+36 = 52; 52%17 = **1***

Por lo tanto, luego de compilar con **compilar.sh** y probar con **probar.sh 4 6**, se generará la prueba con la verificación de la misma y una **salida.json** que contiene *c = 1*, demostrando que la verificación se realiza correctamente, sin necesidad de revelar el contenido de **entradas.json** al verificador
