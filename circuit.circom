pragma circom 2.0.0;

template Mod() {
    // Entradas privadas
    signal input a;
    signal input b;

    // Salida pública
    signal output c;

    // Constante del módulo
    var p = 17;

    // Señales auxiliares
    signal a2;
    signal b2;
    signal sum;
    signal q;

    // Operaciones
    a2 <== a * a;
    b2 <== b * b;
    sum <== a2 + b2;

    // Calcular la división entera q = sum / p
    q <-- sum \ p;
    
    // Calcular el residuo c = sum % p
    c <== sum - q * p;
}

component main = Mod();
