# Guida Post-Deploy - Verifica e Configurazione URL

## Passo 1: Verifica l'URL Effettivo di Vercel

Dopo aver fatto il deploy su Vercel, segui questi passaggi:

### 1.1 Trova l'URL del Progetto

1. Vai su [Vercel Dashboard](https://vercel.com/dashboard)
2. Clicca sul tuo progetto
3. Nella schermata principale, vedrai l'URL del progetto sotto il nome
   - Esempio: `https://tanti-auguri-giuliana.vercel.app`
   - Oppure: `https://g-gift.vercel.app` (se il nome progetto è diverso)

**IMPORTANTE**: L'URL dipende dal nome del progetto su Vercel. Copia l'URL esatto che vedi.

### 1.2 Verifica che il Deploy Funzioni

Apri l'URL in un browser e verifica che:
- [ ] La homepage si carica correttamente
- [ ] La pagina di login è accessibile
- [ ] Non ci sono errori nella console del browser (F12)

---

## Passo 2: Configura le Variabili d'Ambiente su Vercel

### 2.1 Aggiungi NEXT_PUBLIC_APP_URL

1. Vai su [Vercel Dashboard](https://vercel.com/dashboard)
2. Clicca sul tuo progetto
3. Vai su **Settings** → **Environment Variables**
4. Clicca su **Add New**

Aggiungi questa variabile:

```
Name: NEXT_PUBLIC_APP_URL
Value: https://[IL-TUO-URL].vercel.app  ← INSERISCI QUI L'URL EFFETTIVO
Environment: Production + Preview
```

**Esempio**:
```
Name: NEXT_PUBLIC_APP_URL
Value: https://tanti-auguri-giuliana.vercel.app
Environment: Production + Preview
```

### 2.2 Verifica le Altre Variabili

Assicurati che siano presenti anche queste:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `RESEND_API_KEY`
- [ ] `ADMIN_EMAIL`
- [ ] `NODE_ENV=production`

### 2.3 Redeploy

Dopo aver aggiunto `NEXT_PUBLIC_APP_URL`:
1. Vai alla tab **Deployments**
2. Clicca sui tre puntini `...` del deployment più recente
3. Clicca su **Redeploy**
4. Attendi che il deploy sia completato (~2-3 minuti)

---

## Passo 3: Configura Supabase con l'URL Corretto

### 3.1 Configura Site URL

1. Vai su [Supabase Dashboard](https://supabase.com/dashboard)
2. Seleziona il tuo progetto
3. Vai su **Authentication** → **URL Configuration**
4. Aggiorna **Site URL** con l'URL Vercel effettivo:

```
https://[IL-TUO-URL].vercel.app
```

**Esempio**: `https://tanti-auguri-giuliana.vercel.app`

### 3.2 Configura Redirect URLs (Whitelist)

Nella stessa pagina, sezione **Redirect URLs**, aggiungi questi URL:

```
http://localhost:4000/auth/callback
http://localhost:4000/reset-password
https://[IL-TUO-URL].vercel.app/auth/callback
https://[IL-TUO-URL].vercel.app/reset-password
```

**Esempio concreto**:
```
http://localhost:4000/auth/callback
http://localhost:4000/reset-password
https://tanti-auguri-giuliana.vercel.app/auth/callback
https://tanti-auguri-giuliana.vercel.app/reset-password
```

### 3.3 (Opzionale) Per Preview Deployments

Se vuoi che anche i preview deployments funzionino, aggiungi anche:

```
https://[IL-TUO-URL]-*.vercel.app/auth/callback
https://[IL-TUO-URL]-*.vercel.app/reset-password
```

**Esempio**: `https://tanti-auguri-giuliana-*.vercel.app/auth/callback`

### 3.4 Salva le Modifiche

Clicca su **Save** in fondo alla pagina.

---

## Passo 4: Test Completo del Sistema

### 4.1 Test Registrazione e Email

1. Apri il tuo URL Vercel in modalità incognito
2. Vai su `/register`
3. Registrati con un nuovo email (usa un indirizzo che controlli)
4. Controlla la tua email
5. Verifica che il link nell'email punti al tuo dominio Vercel (NON localhost!)
   - ✅ Corretto: `https://tanti-auguri-giuliana.vercel.app/auth/callback?token=...`
   - ❌ Sbagliato: `http://localhost:4000/auth/callback?token=...`
6. Clicca sul link e verifica che il login funzioni

### 4.2 Test Reset Password

1. Vai su `/forgot-password`
2. Inserisci l'email di test
3. Controlla l'email ricevuta
4. Verifica che il link punti al dominio Vercel corretto
5. Clicca sul link e verifica che funzioni

### 4.3 Test Upload Contenuti

1. Fai login come guest approvato
2. Carica un'immagine o un testo
3. Verifica che l'admin riceva l'email di notifica
4. Approva il contenuto come admin
5. Verifica che sia visibile nella galleria VIP

---

## Passo 5: Aggiorna il File .env.local (Opzionale)

Per evitare confusione in sviluppo locale, puoi aggiungere anche nel tuo `.env.local`:

```bash
# App URL (in sviluppo usa localhost, in produzione usa il dominio Vercel)
NEXT_PUBLIC_APP_URL=http://localhost:4000
```

Questo è utile per testare in locale senza interferire con la produzione.

---

## Troubleshooting

### Problema: Le email contengono ancora "localhost"

**Soluzione**:
1. Verifica che `NEXT_PUBLIC_APP_URL` sia impostato su Vercel (Passo 2)
2. Verifica che tu abbia fatto il redeploy dopo aver aggiunto la variabile
3. Fai un hard refresh del browser (Ctrl+Shift+R / Cmd+Shift+R)
4. Prova con un nuovo utente registrato DOPO il redeploy

### Problema: I link nelle email danno errore "Invalid redirect URL"

**Soluzione**:
1. Verifica che l'URL sia esattamente nella whitelist di Supabase (Passo 3.2)
2. Assicurati di non avere spazi extra all'inizio o alla fine
3. Verifica che inizi con `https://` (non `http://`)
4. Attendi 1-2 minuti dopo aver salvato su Supabase (a volte ci vuole tempo)

### Problema: Il dominio Vercel è diverso da quello previsto

**Soluzione**:
Se Vercel ha assegnato un URL tipo `https://g-gift-xyz123.vercel.app` invece di `https://tanti-auguri-giuliana.vercel.app`:

1. Puoi rinominare il progetto su Vercel:
   - Vai su **Settings** → **General** → **Project Name**
   - Cambia il nome in `tanti-auguri-giuliana`
   - Il nuovo URL sarà `https://tanti-auguri-giuliana.vercel.app`
2. Oppure accetta l'URL assegnato e aggiorna tutti i riferimenti (Passo 2 e 3)

### Problema: Errori di build su Vercel

**Soluzione**:
1. Verifica che il build locale funzioni: `npm run build`
2. Controlla i log di Vercel per vedere l'errore specifico
3. Assicurati che tutte le variabili d'ambiente siano configurate
4. Verifica che non ci siano errori TypeScript: `npm run type-check`

---

## Checklist Finale

Prima di condividere il link con gli amici:

- [ ] URL Vercel verificato e funzionante
- [ ] `NEXT_PUBLIC_APP_URL` configurato su Vercel
- [ ] Redeploy completato dopo aver aggiunto la variabile
- [ ] Site URL aggiornato su Supabase
- [ ] Redirect URLs configurati su Supabase
- [ ] Test registrazione completato con successo
- [ ] Email di conferma ricevuta con URL corretto
- [ ] Click sul link email funziona e fa login
- [ ] Test reset password completato
- [ ] Test upload contenuto completato
- [ ] Admin riceve email di notifica
- [ ] Approvazione contenuto funziona
- [ ] Galleria VIP mostra contenuti approvati

---

## Riferimenti Rapidi

**Vercel Dashboard**: https://vercel.com/dashboard
**Supabase Dashboard**: https://supabase.com/dashboard

**File da consultare**:
- [DOMAIN_UPDATE_SUMMARY.md](DOMAIN_UPDATE_SUMMARY.md) - Riepilogo aggiornamenti dominio
- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - Checklist completa deployment
- [docs/SUPABASE_EMAIL_CONFIG.md](docs/SUPABASE_EMAIL_CONFIG.md) - Guida configurazione email

**Supporto**:
- Vercel: https://vercel.com/support
- Supabase: https://supabase.com/support
