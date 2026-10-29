# adoptar-cifrado-documentos

Módulo de prueba para la AO Integradora N.º 2 de Seguridad y Protección de los Datos.
Cifra y recupera un documento de identidad **ficticio** con AES-256-GCM, como se propone
para las fotos del DNI que suben los Adoptarios de AdoptAR (sección 4 del informe).

Es un módulo independiente: no modifica el código del proyecto AdoptAR.

## Requisitos

- Node.js 20.6 o superior (probado con Node 22). No usa dependencias externas:
  el cifrado lo hace el módulo `node:crypto` de Node.

## Instalación

```bash
git clone <url-del-repositorio>
cd adoptar-cifrado-documentos
```

## Configurar la clave

1. Generar una clave aleatoria de 32 bytes:
   ```bash
   npm run generar-clave
   ```
2. Copiar `.env.example` como `.env` y pegar la clave en `DOC_ENC_KEY`.

El archivo `.env` está en `.gitignore` y **no se sube nunca al repositorio**.

## Uso

```bash
npm run cifrar -- datos/dni-ficticio.png datos/salida/dni-ficticio.enc.json
npm run descifrar -- datos/salida/dni-ficticio.enc.json datos/salida/dni-recuperado.png
```

El archivo cifrado es un JSON con el id de la clave, el nonce, la etiqueta de
autenticación y los datos cifrados (en Base64, que solo cambia la representación).

## Verificación

```bash
npm test
```

Corre 6 pruebas con datos ficticios y claves generadas en el momento:

| ID | Tipo | Qué comprueba |
|----|------|---------------|
| P1 | Válido | Cifrar y descifrar devuelve un archivo idéntico (mismo SHA-256) |
| P2 | Válido | El archivo cifrado no contiene el contenido original |
| P3 | Válido | Cifrar dos veces da resultados distintos (nonce nuevo) |
| P4 | Inválido | Si se altera un byte, el descifrado falla |
| P5 | Inválido | Con otra clave no se puede descifrar |
| P6 | Límite | Se rechaza una clave que no tiene 32 bytes o que falta |

Para comprobar a mano que el archivo recuperado es igual al original:

```bash
# Linux / macOS
sha256sum datos/dni-ficticio.png datos/salida/dni-recuperado.png
# Windows (PowerShell)
Get-FileHash datos/dni-ficticio.png, datos/salida/dni-recuperado.png
```

## Datos de prueba

`datos/dni-ficticio.png` es una imagen inventada, sin datos reales.
No usar documentos de personas reales.

## Limitaciones

- La clave vive en una variable de entorno: si se compromete el equipo o el servidor
  donde corre, se compromete la clave.
- Protege el archivo guardado, no a quien lo ve descifrado con permisos válidos.
