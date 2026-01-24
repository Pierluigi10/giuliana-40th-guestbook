/**
 * Simple script to generate favicon message
 * Run with: node scripts/generate-favicons.js
 */

console.log(`
✨ Favicon SVG già creato!

Il nuovo favicon con palloncino "40" è disponibile in:
📁 /public/favicon.svg

Per generare i PNG/ICO, puoi usare uno di questi servizi online:
1. https://realfavicongenerator.net/ (consigliato)
2. https://favicon.io/favicon-converter/

Carica il file: /public/favicon.svg
Scarica: favicon.ico, apple-touch-icon.png, favicon-32x32.png
Copia nella cartella: /public/

Oppure, se hai ImageMagick installato:
  brew install imagemagick
  convert public/favicon.svg -resize 32x32 public/favicon-32x32.png
  convert public/favicon.svg -resize 180x180 public/apple-touch-icon.png

🎉 Il favicon SVG funziona già su tutti i browser moderni!
`)
