#!/bin/bash
circom circuito.circom --r1cs --wasm --sym
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
echo "qweqwe" | snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="Primera contribucion" -v
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v
