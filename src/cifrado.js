import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITMO = 'aes-256-gcm';
const LARGO_NONCE = 12; // 96 bits, el tamaño recomendado para GCM

// Lee la clave desde las variables de entorno y controla que tenga 32 bytes.
export function cargarClave(env = process.env) {
  if (!env.DOC_ENC_KEY) {
    throw new Error('Falta la variable DOC_ENC_KEY (ver .env.example)');
  }
  const clave = Buffer.from(env.DOC_ENC_KEY, 'base64');
  if (clave.length !== 32) {
    throw new Error(`DOC_ENC_KEY debe tener 32 bytes y tiene ${clave.length}`);
  }
  return { clave, idClave: env.DOC_KEY_ID || 'v1' };
}

// Cifra el contenido de un archivo. Cada llamada usa un nonce nuevo.
// El id de la clave va como dato asociado: si alguien lo cambia, el descifrado falla.
export function cifrar(contenido, { clave, idClave }) {
  const nonce = randomBytes(LARGO_NONCE);
  const cifrador = createCipheriv(ALGORITMO, clave, nonce);
  cifrador.setAAD(Buffer.from(idClave, 'utf8'));
  const datos = Buffer.concat([cifrador.update(contenido), cifrador.final()]);

  // Base64 solo cambia la representación para guardarlo como JSON; no protege nada.
  return {
    idClave,
    algoritmo: ALGORITMO,
    nonce: nonce.toString('base64'),
    etiqueta: cifrador.getAuthTag().toString('base64'),
    datos: datos.toString('base64'),
  };
}

// Descifra y verifica la etiqueta de autenticación.
// Si el archivo fue alterado o la clave no es la correcta, lanza un error.
export function descifrar(paquete, { clave, idClave }) {
  if (paquete.idClave !== idClave) {
    throw new Error(`El archivo se cifró con la clave "${paquete.idClave}" y la cargada es "${idClave}"`);
  }
  const descifrador = createDecipheriv(ALGORITMO, clave, Buffer.from(paquete.nonce, 'base64'));
  descifrador.setAAD(Buffer.from(paquete.idClave, 'utf8'));
  descifrador.setAuthTag(Buffer.from(paquete.etiqueta, 'base64'));
  return Buffer.concat([
    descifrador.update(Buffer.from(paquete.datos, 'base64')),
    descifrador.final(), // acá falla si la etiqueta no coincide
  ]);
}
