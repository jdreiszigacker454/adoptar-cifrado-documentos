import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';
import { cargarClave, cifrar, descifrar } from '../src/cifrado.js';

// Claves generadas en cada ejecución: no hay secretos en el repositorio.
const claveA = cargarClave({ DOC_ENC_KEY: randomBytes(32).toString('base64'), DOC_KEY_ID: 'v1' });
const claveB = cargarClave({ DOC_ENC_KEY: randomBytes(32).toString('base64'), DOC_KEY_ID: 'v1' });
const original = readFileSync(new URL('../datos/dni-ficticio.png', import.meta.url));
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

test('P1 (válido): cifrar y descifrar devuelve el archivo idéntico', () => {
  const recuperado = descifrar(cifrar(original, claveA), claveA);
  assert.equal(sha256(recuperado), sha256(original));
});

test('P2 (válido): el archivo cifrado no contiene el contenido original', () => {
  const datos = Buffer.from(cifrar(original, claveA).datos, 'base64');
  const firmaPng = original.subarray(0, 8); // los PNG empiezan siempre con estos 8 bytes
  assert.equal(datos.indexOf(firmaPng), -1);
  assert.notEqual(sha256(datos), sha256(original));
});

test('P3 (válido): cifrar dos veces el mismo archivo da resultados distintos (nonce nuevo)', () => {
  const p1 = cifrar(original, claveA);
  const p2 = cifrar(original, claveA);
  assert.notEqual(p1.nonce, p2.nonce);
  assert.notEqual(p1.datos, p2.datos);
});

test('P4 (inválido): si se altera un byte del archivo cifrado, el descifrado falla', () => {
  const paquete = cifrar(original, claveA);
  const datos = Buffer.from(paquete.datos, 'base64');
  datos[100] ^= 0x01;
  paquete.datos = datos.toString('base64');
  assert.throws(() => descifrar(paquete, claveA), /unable to authenticate data/);
});

test('P5 (inválido): con otra clave no se puede descifrar', () => {
  const paquete = cifrar(original, claveA);
  assert.throws(() => descifrar(paquete, claveB), /unable to authenticate data/);
});

test('P6 (límite): una clave que no tiene 32 bytes se rechaza al cargarla', () => {
  assert.throws(() => cargarClave({ DOC_ENC_KEY: randomBytes(16).toString('base64') }), /32 bytes/);
  assert.throws(() => cargarClave({}), /Falta la variable DOC_ENC_KEY/);
});
