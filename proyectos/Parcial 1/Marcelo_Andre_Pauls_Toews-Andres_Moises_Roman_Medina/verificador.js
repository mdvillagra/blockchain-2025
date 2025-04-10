const snarkjs = require("snarkjs");
const fs = require("fs");

async function main() {
  const vk = JSON.parse(fs.readFileSync("verification_key.json"));
  const proof = JSON.parse(fs.readFileSync("proof.json"));
  const signalPublico = JSON.parse(fs.readFileSync("public.json"));

  const res = await snarkjs.groth16.verify(vk, signalPublico, proof);
  console.log(res ? "La prueba es valida" : "La prueba es invalido");
}

main();
