const snarkjs = require("snarkjs");
const fs = require("fs");

async function main() 
{
    const datosPrueba = JSON.parse(fs.readFileSync("prueba.json"));
    const clave = JSON.parse(fs.readFileSync("clave.json"));
    const publicas = JSON.parse(fs.readFileSync("salida.json"));
    const {pi_a,pi_b,pi_c} = datosPrueba;
    
    const valido = await snarkjs.groth16.verify(clave,publicas,{pi_a,pi_b,pi_c});
    if(valido) 
    {
        console.log("Prueba válida");
    } 
    else 
    {
        console.log("Prueba no válida");
    }
    process.exit(0);
}

main();
