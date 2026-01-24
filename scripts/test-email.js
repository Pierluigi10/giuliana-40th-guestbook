#!/usr/bin/env node
/**
 * Test script per verificare la configurazione di Resend API
 *
 * Usage:
 *   node scripts/test-email.js
 *
 * Questo script:
 * 1. Carica le variabili d'ambiente da .env.local
 * 2. Verifica la presenza di RESEND_API_KEY e ADMIN_EMAIL
 * 3. Invia un'email di test all'admin
 * 4. Mostra il risultato con suggerimenti in caso di errore
 */

const path = require('path')
const fs = require('fs')

// Carica dotenv manualmente per .env.local
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local')

  if (!fs.existsSync(envPath)) {
    console.error('❌ File .env.local non trovato!')
    console.log('\nCrea il file .env.local nella root del progetto con:')
    console.log('  RESEND_API_KEY=re_xxx...')
    console.log('  ADMIN_EMAIL=tua-email@example.com')
    process.exit(1)
  }

  const envContent = fs.readFileSync(envPath, 'utf-8')
  const lines = envContent.split('\n')

  lines.forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      const value = valueParts.join('=').trim()
      if (key && value) {
        process.env[key.trim()] = value.replace(/^["']|["']$/g, '')
      }
    }
  })
}

// Maschera la API key per mostrarla in modo sicuro
function maskApiKey(key) {
  if (!key) return 'N/A'
  if (key.length < 10) return '***'
  return `${key.substring(0, 7)}...${key.substring(key.length - 4)}`
}

async function testEmail() {
  console.log('🔍 Test configurazione Resend API\n')

  // Carica .env.local
  loadEnvFile()

  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL

  console.log('📋 Configurazione:')
  console.log(`  RESEND_API_KEY: ${maskApiKey(RESEND_API_KEY)}`)
  console.log(`  ADMIN_EMAIL: ${ADMIN_EMAIL || 'N/A'}\n`)

  // Verifica variabili d'ambiente
  if (!RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY non configurata!')
    console.log('\n💡 Soluzione:')
    console.log('  1. Vai su https://resend.com/api-keys')
    console.log('  2. Crea una nuova API key')
    console.log('  3. Aggiungi in .env.local: RESEND_API_KEY=re_xxx...')
    process.exit(1)
  }

  if (!ADMIN_EMAIL) {
    console.error('❌ ADMIN_EMAIL non configurata!')
    console.log('\n💡 Soluzione:')
    console.log('  Aggiungi in .env.local: ADMIN_EMAIL=tua-email@example.com')
    process.exit(1)
  }

  // Importa Resend (richiede installazione: npm install resend)
  let Resend
  try {
    Resend = require('resend').Resend
  } catch (error) {
    console.error('❌ Resend package non installato!')
    console.log('\n💡 Soluzione:')
    console.log('  npm install resend')
    process.exit(1)
  }

  const resend = new Resend(RESEND_API_KEY)

  // Invia email di test
  console.log('📧 Invio email di test...\n')

  try {
    const data = await resend.emails.send({
      from: 'Guestbook Giuliana <onboarding@resend.dev>',
      to: [ADMIN_EMAIL],
      subject: '🧪 Test Email - Guestbook Giuliana',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10B981;">✅ Email di test inviata con successo!</h2>

          <p>Questa è un'email di test per verificare la configurazione di Resend API.</p>

          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Configurazione:</strong></p>
            <ul>
              <li>API Key: ${maskApiKey(RESEND_API_KEY)}</li>
              <li>Admin Email: ${ADMIN_EMAIL}</li>
              <li>Timestamp: ${new Date().toLocaleString('it-IT', {
                dateStyle: 'long',
                timeStyle: 'long'
              })}</li>
            </ul>
          </div>

          <p>Se ricevi questa email, significa che Resend è configurato correttamente! 🎉</p>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Test automatico generato da scripts/test-email.js
          </p>
        </div>
      `,
    })

    console.log('✅ Email inviata con successo!\n')
    console.log('📨 Dettagli:')
    console.log(`  Email ID: ${data.id}`)
    console.log(`  Destinatario: ${ADMIN_EMAIL}`)
    console.log(`  Mittente: Guestbook Giuliana <onboarding@resend.dev>`)
    console.log('\n💡 Controlla la tua casella email!')
    console.log('   Nota: Le email da onboarding@resend.dev potrebbero finire in spam.')
    console.log('   Per email in produzione, configura un dominio custom su Resend.\n')

  } catch (error) {
    console.error('❌ Errore durante l\'invio dell\'email!\n')
    console.error('Dettagli errore:', error.message)

    if (error.statusCode) {
      console.error('Status Code:', error.statusCode)
    }

    console.log('\n💡 Suggerimenti per risolvere:')

    if (error.message.includes('API key')) {
      console.log('  - Verifica che la RESEND_API_KEY sia corretta')
      console.log('  - Controlla su https://resend.com/api-keys che la key sia attiva')
    } else if (error.message.includes('email')) {
      console.log('  - Verifica che ADMIN_EMAIL sia un indirizzo email valido')
      console.log('  - Controlla che l\'email non sia bloccata da Resend')
    } else if (error.statusCode === 429) {
      console.log('  - Rate limit raggiunto, attendi qualche minuto')
    } else {
      console.log('  - Controlla la tua connessione internet')
      console.log('  - Verifica lo stato di Resend su https://status.resend.com')
      console.log('  - Controlla i log completi su https://resend.com/emails')
    }

    console.log('\n📚 Documentazione:')
    console.log('  https://resend.com/docs\n')

    process.exit(1)
  }
}

// Esegui il test
testEmail().catch(error => {
  console.error('\n❌ Errore inaspettato:', error)
  process.exit(1)
})
