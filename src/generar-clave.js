// Genera una clave aleatoria de 32 bytes (AES-256) y la muestra en Base64.
// Se copia al archivo .env local; no se guarda en ningún otro lado.
import { randomBytes } from 'node:crypto';

console.log(randomBytes(32).toString('base64'));
