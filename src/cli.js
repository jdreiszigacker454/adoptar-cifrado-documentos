// Uso:
//   npm run cifrar -- <archivo-original> <archivo-cifrado.json>
//   npm run descifrar -- <archivo-cifrado.json> <archivo-recuperado>
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { cargarClave, cifrar, descifrar } from './cifrado.js';

const [, , accion, entrada, salida] = process.argv;

try {
  if (!['cifrar', 'descifrar'].includes(accion) || !entrada || !salida) {
    throw new Error('Uso: cifrar|descifrar <entrada> <salida>');
  }
  const clave = cargarClave();
  mkdirSync(dirname(salida), { recursive: true });

  if (accion === 'cifrar') {
    const paquete = cifrar(readFileSync(entrada), clave);
    writeFileSync(salida, JSON.stringify(paquete, null, 2));
  } else {
    const paquete = JSON.parse(readFileSync(entrada, 'utf8'));
    writeFileSync(salida, descifrar(paquete, clave));
  }
  console.log(`OK: ${accion} ${entrada} -> ${salida}`);
} catch (error) {
  const mensaje = /authenticate data/.test(error.message)
    ? 'no se pudo verificar el archivo: fue alterado o la clave no es la correcta'
    : error.message;
  console.error(`ERROR: ${mensaje}`);
  process.exitCode = 1;
}
