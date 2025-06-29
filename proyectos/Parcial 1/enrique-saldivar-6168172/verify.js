const snarkjs = require("snarkjs");
const isPrime = require("is-prime");
const path = require("path");

async function verifyProof() {
    try {
        const projectDir = path.resolve(__dirname);
        
        
        const verificationKey = require(path.join(projectDir, "build", "verification_key.json")); 
        for (let i = 0; i < 4; i++) {
            const proof = require(path.join(projectDir, "build", `proof${i}.json`));
            const publicSignals = require(path.join(projectDir, "build", `public${i}.json`));
            const p = publicSignals[1];
            if (!isPrime(parseInt(p))) {
                console.error(`El numero ${p} no es primo.`);
                continue;
            }
            
            const isValid = await snarkjs.groth16.verify(
                verificationKey,
                publicSignals,
                proof
            );

            console.log(`Prueba ${i} valida? `, isValid ? "Siu" : "Nop");
        }
    } catch (error) {
        console.error("Error durante la verificacion:", error);
    }
  
    process.exit();
}

verifyProof();