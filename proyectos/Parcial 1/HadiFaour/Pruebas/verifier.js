[31;22m[ERROR] [39;1msnarkJS[0m: Error: ENOENT: no such file or directory, open '../Pruebas/public.json'
    at Object.openSync (node:fs:596:3)
    at Object.readFileSync (node:fs:464:35)
    at Object.zkeyExportSolidityCalldata [as action] (/usr/local/lib/node_modules/snarkjs/build/cli.cjs:13118:51)
    at clProcessor (/usr/local/lib/node_modules/snarkjs/build/cli.cjs:483:37)
    at Object.<anonymous> (/usr/local/lib/node_modules/snarkjs/build/cli.cjs:12792:1)
    at Module._compile (node:internal/modules/cjs/loader:1364:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1422:10)
    at Module.load (node:internal/modules/cjs/loader:1203:32)
    at Module._load (node:internal/modules/cjs/loader:1019:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:128:12) {
  errno: -2,
  syscall: 'open',
  code: 'ENOENT',
  path: '../Pruebas/public.json'
}
