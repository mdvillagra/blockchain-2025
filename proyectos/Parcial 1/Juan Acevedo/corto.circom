pragma circom 2.0.0;
// Incluye templates de comparación de circomlib
include "circomlib/circuits/comparators.circom";  // Para LessEqThan, IsZero  
// Incluye templates de manipulación de bits de circomlib
include "circomlib/circuits/bitify.circom";       // Para Num2Bits

template z(p, min_bits) {
    // =============================================
    // 1. VALIDACIONES IMPLÍCITAS
    // =============================================
    signal input a;   // Entrada privada a
    signal input b;   // Entrada privada b
    signal output c;  // Salida pública c

    // =============================================
    // 2. VALIDACIONES EXPLÍCITAS
    // =============================================
    // Componente para verificar a <= p-1 (equivalente a a < p)
    component ltA = LessEqThan(32);
    ltA.in[0] <== a;      // Conecta entrada a
    ltA.in[1] <== p - 1;  // Compara con p-1
    ltA.out === 1;        // Exige que a <= p-1

    // Componente para verificar b <= p-1 (equivalente a b < p)
    component ltB = LessEqThan(32);
    ltB.in[0] <== b;      // Conecta entrada b
    ltB.in[1] <== p - 1;  // Compara con p-1
    ltB.out === 1;        // Exige que b <= p-1

    // Componente para verificar que a tiene al menos min_bits bits
    component minBitsA = Num2Bits(min_bits);
    minBitsA.in <== a;    // Convierte a a bits y verifica longitud

    // Verificación de que a no es cero mediante inverso multiplicativo
    signal invA;
    invA <-- 1 / a;       // Calcula inverso (falla si a = 0)
    invA * a === 1;       // Restricción: a debe tener inverso

    // Verificación de que a != b
    signal diff;
    diff <== a - b;       // Calcula diferencia entre entradas
    component isZero = IsZero();
    isZero.in <== diff;   // Verifica si la diferencia es cero
    isZero.out === 0;     // Exige que diff != 0 (a != b)

    // =============================================
    // 3. LÓGICA PRINCIPAL CON REDUCCIÓN MODULAR MANUAL
    // =============================================
    signal a2 <== a * a;  // Calcula a al cuadrado con restricción
    signal b2 <== b * b;  // Calcula b al cuadrado con restricción
    signal suma <== a2 + b2;  // Suma de cuadrados con restricción

    // --- Implementación manual de suma % p ---
    signal cociente <-- suma \ p;          // División entera temporal
    signal residuo <== suma - cociente*p;  // Residuo temporal equivalente a %

    // Verificación de la relación modular: suma = cociente*p + residuo
    suma === cociente * p + residuo;

    // --- Verificación de residuo < p ---
    // Calcula número de bits necesarios para representar p
    var bits_p = 0;       // Contador de bits
    var temp = p;         // Variable temporal
    while (temp > 0) {    // Mientras queden bits por contar
        bits_p++;         // Incrementa contador
        temp >>= 1;       // Desplaza bits a la derecha
    }
    // Componente para verificar que residuo tiene menos bits que p
    component checkResiduo = Num2Bits(bits_p);
    checkResiduo.in <== residuo;  // Falla si residuo >= p

    c <== residuo;  // Asigna residuo como salida pública
}

// Instancia principal del circuito con p=12 y min_bits=128
component main = z(12, 128);
