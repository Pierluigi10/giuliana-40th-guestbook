# Configurazione Email Supabase

Questa guida spiega come configurare correttamente gli URL di redirect per le email di conferma e reset password in Supabase.

## Problema Comune

Se ricevi email con link che puntano a `localhost` invece del tuo dominio di produzione, significa che:

1. Gli URL di redirect non sono configurati correttamente nel Supabase Dashboard
2. La variabile d'ambiente `NEXT_PUBLIC_APP_URL` non è impostata correttamente

## Soluzione

### Step 1: Configurare NEXT_PUBLIC_APP_URL

Nel file `.env.local` (o nelle variabili d'ambiente di Vercel), imposta:

```env
# Per produzione
NEXT_PUBLIC_APP_URL=https://tanti-auguri-giuliana.vercel.app

# Per sviluppo (opzionale, usa localhost se non impostato)
NEXT_PUBLIC_APP_URL=http://localhost:4000
```

**Importante**: In produzione, DEVI impostare questa variabile con il tuo dominio reale.

### Step 2: Configurare Supabase Dashboard

1. Vai al [Supabase Dashboard](https://supabase.com/dashboard)
2. Seleziona il tuo progetto
3. Vai a **Authentication** → **URL Configuration**

#### Site URL
Imposta il tuo URL di produzione:
```
https://tanti-auguri-giuliana.vercel.app
```

#### Redirect URLs (Whitelist)
Aggiungi TUTTI gli URL che userai per i redirect:

**Per sviluppo:**
```
http://localhost:4000/auth/callback
http://localhost:4000/reset-password
```

**Per produzione:**
```
https://tanti-auguri-giuliana.vercel.app/auth/callback
https://tanti-auguri-giuliana.vercel.app/reset-password
```

**Per preview deployments (Vercel):**
```
https://tanti-auguri-giuliana-*.vercel.app/auth/callback
https://tanti-auguri-giuliana-*.vercel.app/reset-password
```

> **Nota**: Il carattere `*` è un wildcard che permette a tutti i preview deployments di funzionare.

### Step 3: Verificare Email Templates

1. Vai a **Authentication** → **Email Templates**
2. Verifica che i template contengano:
   - **Confirm signup**: `{{ .ConfirmationURL }}`
   - **Reset password**: `{{ .ConfirmationURL }}`

### Step 4: Abilitare Email Confirmation

1. Vai a **Authentication** → **Settings**
2. Assicurati che **Enable email confirmations** sia attivo
3. Salva le modifiche

## Come Funziona il Codice

Il codice usa questa logica:

```typescript
// Usa NEXT_PUBLIC_APP_URL se disponibile (produzione)
// Altrimenti usa window.location.origin (sviluppo)
const redirectUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
```

- **In sviluppo**: Se `NEXT_PUBLIC_APP_URL` non è impostato, usa `http://localhost:4000`
- **In produzione**: Usa `NEXT_PUBLIC_APP_URL` che deve essere il tuo dominio reale

## Verifica

### Test in Sviluppo

1. Registra un nuovo utente
2. Controlla la console del browser o la risposta di Supabase
3. Copia il link di conferma e incollalo nel browser
4. Dovrebbe funzionare con `localhost:4000`

### Test in Produzione

1. Assicurati che `NEXT_PUBLIC_APP_URL` sia impostato in Vercel
2. Registra un nuovo utente
3. Controlla l'email ricevuta
4. Il link dovrebbe puntare al tuo dominio di produzione, non a localhost

## Troubleshooting

### Problema: Email contiene ancora localhost

**Causa**: `NEXT_PUBLIC_APP_URL` non è impostato o Supabase non ha gli URL corretti nella whitelist.

**Soluzione**:
1. Verifica che `NEXT_PUBLIC_APP_URL` sia impostato in Vercel (Environment Variables)
2. Verifica che gli URL siano nella whitelist di Supabase
3. Riavvia il deployment su Vercel dopo aver aggiunto la variabile

### Problema: Link non funziona / Errore "Invalid redirect URL"

**Causa**: L'URL non è nella whitelist di Supabase.

**Soluzione**:
1. Aggiungi l'URL esatto alla whitelist in Supabase Dashboard
2. Assicurati che non ci siano spazi o caratteri speciali
3. Per preview deployments, usa il wildcard `*`

### Problema: Email non arriva

**Causa**: Email confirmation non è abilitata o c'è un problema con il provider email.

**Soluzione**:
1. Verifica che "Enable email confirmations" sia attivo
2. Controlla la cartella spam
3. In sviluppo, Supabase mostra il link nella risposta JSON (controlla la console)

## File Coinvolti

- `src/components/auth/RegisterForm.tsx` - Usa `emailRedirectTo`
- `src/components/auth/ForgotPasswordForm.tsx` - Usa `redirectTo` per reset password
- `src/app/auth/callback/route.ts` - Gestisce il callback dopo la conferma email

## Riferimenti

- [Supabase Auth Configuration](https://supabase.com/docs/guides/auth/server-side/email-based-auth-with-pkce-flow-for-ssr)
- [Supabase URL Configuration](https://supabase.com/docs/guides/auth/redirect-urls)
