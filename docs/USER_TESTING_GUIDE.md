# 🧪 Guida Test Utente Non-Tech
## "Il Test dello Zio" - Validazione UX Pre-Launch

**Tempo:** 10-15 minuti
**Obiettivo:** Verificare che l'app sia intuitiva per utenti poco tech-savvy

---

## 👤 Profilo Tester Ideale

- **Età:** 40+ anni
- **Tech-savviness:** Usa WhatsApp e Facebook, ma non è esperto di app
- **Dispositivo:** Il suo smartphone (non un device di test)
- **Motivazione:** È invitato al compleanno di Giuliana

---

## 📱 Setup Test

1. **Preparazione:**
   - Apri l'app sulla homepage (https://tanti-auguri-giuliana.vercel.app)
   - Consegna il telefono sbloccato al tester
   - **NON dare istruzioni** - osserva in silenzio

2. **Scenario:**
   > "Ciao! Questo è un guestbook digitale per il compleanno di Giuliana. Prova a lasciare un messaggio o una foto per lei. Fai come ti viene naturale!"

3. **Osservazione silenziosa:**
   - Annota dove l'utente esita o si ferma
   - Non intervenire (a meno di "red flag" - vedi sotto)
   - Prendi nota dei punti di confusione

---

## ✅ Checklist Osservazione

### Homepage
- [ ] Capisce cosa fare appena vede la homepage?
- [ ] Nota il bottone di registrazione/login?
- [ ] Legge il testo descrittivo o clicca subito?

### Registrazione
- [ ] Riesce a compilare il form senza aiuto?
- [ ] Capisce che deve confermare l'email?
- [ ] Nota i messaggi di errore (se sbaglia)?

### Upload
- [ ] Trova facilmente il form di upload dopo login?
- [ ] Capisce come selezionare foto/video?
- [ ] Capisce il limite di caratteri (per messaggi di testo)?
- [ ] Nota la progress bar durante l'upload?

### Feedback & Success
- [ ] Nota i messaggi di successo (toast)?
- [ ] Capisce che il contenuto è stato caricato?
- [ ] Ha dubbi se "è andato a buon fine"?

---

## 🚨 Red Flags (Quando Intervenire)

**Intervieni SOLO se:**
- ❌ Utente bloccato per **> 30 secondi** senza agire
- ❌ Utente clicca **3+ volte** sullo stesso bottone (pensa sia rotto)
- ❌ Utente chiede **esplicitamente aiuto** ("Non funziona", "Cosa devo fare?")
- ❌ Utente sta per chiudere l'app frustrato

**Come intervenire:**
- Usa frasi neutre: "Cosa stai cercando di fare?" (non "Devi fare X")
- Annota il problema: questo è un bug UX da fixare!

---

## 📊 Metriche di Successo

### ✅ Test Superato Se:
- [ ] Utente completa registrazione in < 3 minuti
- [ ] Utente carica almeno 1 contenuto (foto/messaggio)
- [ ] Utente nota il messaggio di successo
- [ ] **Zero richieste di aiuto** durante il flow principale

### ⚠️ Test Parziale Se:
- [ ] Utente completa task ma con 1-2 momenti di esitazione
- [ ] Chiede aiuto 1 volta ma poi procede autonomamente

### ❌ Test Fallito Se:
- [ ] Utente si blocca e non sa come procedere
- [ ] Chiede aiuto 3+ volte
- [ ] Abbandona frustrato prima di completare

---

## 💬 Post-Test: Domande Chiave

Dopo il test, chiedi:

1. **"Com'è andata? Qualcosa ti è sembrato confuso?"**
   - Lascia parlare liberamente
   - Annota feedback spontaneo

2. **"Ti è piaciuta l'esperienza?"**
   - Sentiment generale

3. **"Cosa cambieresti?"** (solo se è molto tech-savvy)
   - Suggerimenti di miglioramento

4. **"Consiglieresti ad altri amici di usarla?"**
   - Indicatore di NPS (Net Promoter Score)

---

## 🐛 Bug Log Template

Usa questo template per annotare problemi:

```
PROBLEMA #1
- Dove: [Homepage/Registrazione/Upload/etc.]
- Cosa è successo: [Descrizione]
- Reazione utente: [Confuso/Frustrato/Bloccato]
- Gravità: [Alta/Media/Bassa]
- Fix proposto: [Idea di soluzione]
```

**Esempio:**
```
PROBLEMA #1
- Dove: Upload foto
- Cosa è successo: Utente ha cliccato "Invia" senza foto, errore non chiaro
- Reazione utente: Ha cliccato altre 2 volte pensando fosse rotto
- Gravità: Media
- Fix proposto: Disabilitare bottone se no file + tooltip
```

---

## 🎯 Checklist Pre-Test (Setup Tecnico)

Prima di iniziare il test, verifica:

- [ ] App deployata e funzionante su produzione
- [ ] Database Supabase online
- [ ] Storage bucket accessibile
- [ ] Email di conferma configurate (Resend)
- [ ] Rete WiFi stabile (test su 4G se possibile)
- [ ] Telefono con batteria > 50%

---

## 📈 Quando Rifare il Test

Rifai il test ogni volta che:
- Cambi il flow di registrazione/upload
- Ricevi feedback da utenti che "non hanno capito"
- Aggiungi nuove feature critiche (es. reactions, filtri)
- Prima del deploy finale (ultima validazione)

---

## 🎁 Bonus: Il "Test della Nonna"

**Il test definitivo:**
Se tua nonna (o la mamma di qualcuno non tech-savvy) riesce a caricare una foto senza chiedere aiuto, l'app è **veramente** user-friendly! 🏆

---

**📝 Ultimo consiglio:** Registra lo schermo del telefono (con permesso) durante il test. Rivedere il video dopo aiuta a notare micro-esitazioni che non avresti visto in real-time.

---

*Guida creata per il progetto Giuliana's 40th Birthday Guestbook*
*Ultima revisione: 2026-01-24*
