# Guida al Testing degli Errori di Rete

## Setup Testing Environment

### Chrome DevTools
1. Apri DevTools (F12)
2. Vai su **Network** tab
3. Usa il dropdown throttling per simulare connessioni lente

### Throttling Presets
- **Offline**: Simula assenza di connessione
- **Slow 3G**: Simula connessione mobile lenta
- **Fast 3G**: Simula connessione mobile normale

## Scenari di Test

### 1. Upload Immagine - Connessione Offline

**Setup:**
1. Vai su `/upload`
2. DevTools → Network → **Offline**
3. Seleziona un'immagine

**Passi:**
1. Clicca "Regala un ricordo"
2. Osserva il comportamento

**Risultato Atteso:**
- ✅ Toast "Riprovo il caricamento... 🔄" (3 volte)
- ✅ Toast error finale: "Errore durante il caricamento del file 📤"
- ✅ Descrizione: "Controlla la connessione internet e riprova"
- ✅ Progress bar torna a 0
- ✅ File non rimane in storage

**Risultato Effettivo:** _________________

---

### 2. Upload Video - Timeout

**Setup:**
1. Vai su `/upload`
2. DevTools → Network → **Slow 3G**
3. Seleziona un video grande (>5MB)

**Passi:**
1. Clicca "Carica Video"
2. Osserva retry automatici

**Risultato Atteso:**
- ✅ Progress bar avanza lentamente
- ✅ Toast "Riprovo il caricamento... 🔄" se fallisce
- ✅ Eventuale timeout con messaggio: "Il caricamento sta impiegando più tempo del solito"

**Risultato Effettivo:** _________________

---

### 3. Gallery Stats Refresh - Server Error

**Setup:**
1. Vai su `/gallery`
2. Apri DevTools → Network
3. Blocca richieste a `/api/vip/stats` (Ctrl+F per trovare)

**Passi:**
1. Aspetta 30 secondi (refresh automatico)
2. Osserva comportamento dopo 3 refresh falliti

**Risultato Atteso:**
- ✅ Nessun toast per primi 2 fallimenti
- ✅ Dopo 3° fallimento: Toast error "Aggiornamento statistiche non riuscito"
- ✅ Statistiche precedenti rimangono visibili
- ✅ Applicazione continua a funzionare

**Risultato Effettivo:** _________________

---

### 4. Admin Stats - Connection Error

**Setup:**
1. Login come admin
2. Vai su `/dashboard`
3. DevTools → Network → **Offline**

**Passi:**
1. Refresh pagina
2. Clicca "Riprova" se appare

**Risultato Atteso:**
- ✅ Skeleton loading iniziale
- ✅ Toast error con messaggio: "Controlla la connessione internet"
- ✅ Bottone "Riprova" visibile
- ✅ Click su "Riprova" tenta nuovo fetch

**Risultato Effettivo:** _________________

---

### 5. Content Moderation - Approve Error

**Setup:**
1. Login come admin
2. Vai su `/approve-content`
3. DevTools → Network → Blocca `/api/content/approve`

**Passi:**
1. Clicca "✅ Approva" su un contenuto
2. Osserva messaggio di errore

**Risultato Atteso:**
- ✅ Spinner durante loading
- ✅ Toast error: "Errore approvazione"
- ✅ Descrizione specifica del problema
- ✅ Contenuto rimane nella lista

**Risultato Effettivo:** _________________

---

### 6. Reactions - Rate Limit

**Setup:**
1. Login come utente
2. Vai su `/gallery`
3. Mock API per simulare 429 (richiede modifica temporanea)

**Passi:**
1. Clicca rapidamente su diverse reactions
2. Osserva comportamento

**Risultato Atteso:**
- ✅ Prime reactions funzionano
- ✅ Su rate limit: Toast "Troppi tentativi"
- ✅ Descrizione: "Attendi un momento prima di riprovare"

**Risultato Effettivo:** _________________

---

### 7. Export Content - Long Operation

**Setup:**
1. Login come admin
2. Vai su `/export`
3. Assicurati ci siano molti contenuti (>50)

**Passi:**
1. Clicca "Scarica ZIP Completo"
2. DevTools → Network → **Slow 3G**
3. Osserva timeout (60s)

**Risultato Atteso:**
- ✅ Spinner "Esportazione in corso..."
- ✅ Operazione completa entro 60s
- ✅ Se timeout: Messaggio "Il caricamento sta impiegando più tempo del solito"
- ✅ Download file se successo

**Risultato Effettivo:** _________________

---

### 8. Text Upload - Server Action Error

**Setup:**
1. Login come utente
2. Vai su `/upload` → Tab Messaggio
3. Simula errore server (temporaneamente modifica server action)

**Passi:**
1. Scrivi un messaggio
2. Clicca "Regala le tue parole"

**Risultato Atteso:**
- ✅ Spinner durante submit
- ✅ Toast error con messaggio user-friendly
- ✅ Testo rimane nel campo (non viene cancellato)
- ✅ Utente può riprovare

**Risultato Effettivo:** _________________

---

### 9. Bulk Approve - Multiple Errors

**Setup:**
1. Login come admin
2. Vai su `/approve-content`
3. Seleziona 5+ contenuti
4. DevTools → Network → **Offline**

**Passi:**
1. Clicca "✅ Approva X"
2. Osserva messaggio di errore

**Risultato Atteso:**
- ✅ Spinner su bottone
- ✅ Toast error: "Errore approvazione multipla"
- ✅ Descrizione: "Controlla la connessione internet"
- ✅ Selezione rimane attiva
- ✅ Utente può riprovare

**Risultato Effettivo:** _________________

---

### 10. Delete Content - Authentication Error

**Setup:**
1. Login come utente
2. Vai su `/gallery`
3. Simula token scaduto (wait 1 hour o modifica token)

**Passi:**
1. Clicca sul pulsante elimina su tuo contenuto
2. Conferma eliminazione

**Risultato Atteso:**
- ✅ Toast error: "Errore eliminazione"
- ✅ Descrizione: "Sessione scaduta. Effettua di nuovo l'accesso"
- ✅ Contenuto non viene eliminato
- ✅ Suggerimento di ri-autenticarsi

**Risultato Effettivo:** _________________

---

## Checklist Completa

### Upload Components
- [ ] ImageUpload - Connection error
- [ ] ImageUpload - Timeout
- [ ] ImageUpload - Server error
- [ ] VideoUpload - Connection error
- [ ] VideoUpload - Timeout
- [ ] TextUpload - Server action error

### Gallery Components
- [ ] ContentCard - Reaction add error
- [ ] ContentCard - Reaction remove error
- [ ] ContentCard - Delete error
- [ ] ContentCard - Authentication error

### Admin Components
- [ ] ContentModerationQueue - Approve error
- [ ] ContentModerationQueue - Reject error
- [ ] ContentModerationQueue - Bulk approve error
- [ ] ContentModerationQueue - Bulk reject error
- [ ] AdminStats - Fetch error
- [ ] AdminStats - Retry button
- [ ] StorageMonitor - Fetch error
- [ ] ExportContent - Timeout
- [ ] ExportContent - Server error

### VIP Components
- [ ] StatsDashboard - Periodic refresh error
- [ ] StatsDashboard - Multiple failures handling

## Note per il Testing

### Tools Utili
1. **Chrome DevTools Network Throttling**
2. **Redux DevTools** per osservare state changes
3. **React DevTools** per debug components
4. **Console logs** con prefisso componente (es. `[ImageUpload]`)

### Mock API Responses

Per testare specifici status codes, puoi temporaneamente modificare le API routes:

```typescript
// In /api/admin/stats/route.ts (esempio)
export async function GET() {
  // Simula 500 error
  return NextResponse.json(
    { error: 'Server error' },
    { status: 500 }
  )
}
```

### Metrics da Raccogliere

Durante il testing, annota:
- ⏱️ Tempo medio prima del retry
- 🔄 Numero di retry necessari
- ✅ Tasso di successo dopo retry
- 📱 Differenze tra desktop/mobile
- 🌐 Problemi specifici con browser diversi

## Post-Testing

### Report Bugs
Se trovi problemi:
1. Descrivi scenario esatto
2. Screenshot del toast error
3. Console logs rilevanti
4. Network tab screenshot
5. Browser e versione

### Suggerimenti Miglioramento
Feedback su:
- Chiarezza messaggi
- Tempistiche retry
- UX durante errori
- Azioni suggerite agli utenti
