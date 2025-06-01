const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");

async function verifyProof(inputFile) {
    try {
        const proofPath = `circuit/proofs/${inputFile.replace(".json", "_proof.json")}`;
        const publicPath = `circuit/proofs/${inputFile.replace(".json", "_public.json")}`;

        if (!fs.existsSync(proofPath) || !fs.existsSync(publicPath)) {
            console.log(`${inputFile}: Invalido`);
            return;
        }

        const vKey = JSON.parse(fs.readFileSync("circuit/compiled/verification_key.json"));
        const proof = JSON.parse(fs.readFileSync(proofPath));
        const publicSignals = JSON.parse(fs.readFileSync(publicPath));

        const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);
        console.log(`${inputFile}: ${isValid ? "Valido" : "Invalido"}`);
    } catch {
        console.log(`${inputFile}: Invalido`);
    }
}

async function main() {
    const inputDir = "circuit/inputs";
    const inputFiles = fs.readdirSync(inputDir).filter(f => f.endsWith(".json"));

    for (const file of inputFiles) {
        await verifyProof(file);
    }
}

main();
