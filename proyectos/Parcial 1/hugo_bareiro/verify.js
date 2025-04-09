const snarkjs = require("snarkjs");
const fs = require("fs");

async function main() {
    const vKey = JSON.parse(fs.readFileSync("verification_key.json"));
    const proof = JSON.parse(fs.readFileSync("proof.json"));
    const publicSignals = JSON.parse(fs.readFileSync("public.json"));

    const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);

    if (res) {
        console.log("✅ Proof is valid");
    } else {
        console.log("❌ Invalid proof");
    }
}

main().catch((err) => {
    console.error("Error verifying proof:", err);
});
