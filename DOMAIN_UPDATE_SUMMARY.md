# Aggiornamento Dominio - Riepilogo

## Dominio Aggiornato
**Nuovo dominio**: `https://tanti-auguri-giuliana.vercel.app`

## File Modificati

### 1. `.env.example`
- ✅ Aggiornato `NEXT_PUBLIC_APP_URL` a `https://tanti-auguri-giuliana.vercel.app`
- ✅ Aggiornati i commenti con il nuovo dominio
- ✅ Corretto localhost da `:3000` a `:4000`

### 2. `src/app/layout.tsx`
- ✅ Aggiornato fallback `baseUrl` a `https://tanti-auguri-giuliana.vercel.app`

### 3. `docs/SUPABASE_EMAIL_CONFIG.md`
- ✅ Aggiornati tutti gli esempi con il nuovo dominio
- ✅ Aggiornati gli URL di redirect per Supabase

### 4. `docs/EMAIL_NOTIFICATIONS_SETUP.md`
- ✅ Aggiornato esempio dominio in Resend

## Prossimi Passi

### 1. Configurare Vercel Environment Variables

**Guida dettagliata**: Vedi [docs/VERCEL_ENV_VARIABLES.md](docs/VERCEL_ENV_VARIABLES.md)

**Passi rapidi**:
1. Vai su [Vercel Dashboard](https://vercel.com/dashboard)
2. Clicca sul tuo progetto (cerca `tanti-auguri-giuliana` o il nome del progetto)
3. Clicca su **Settings** (tab in alto)
4. Nel menu laterale sinistro, clicca su **Environment Variables**
5. Clicca su **Add New** o **Add**

Aggiungi/aggiorna:
```
NEXT_PUBLIC_APP_URL = https://tanti-auguri-giuliana.vercel.app
```

**Importante**: 
- Seleziona **Production** e **Preview** environments
- Riavvia il deployment dopo aver aggiunto la variabile

### 2. Configurare Supabase Dashboard

Vai su [Supabase Dashboard](https://supabase.com/dashboard) → Il tuo progetto:

#### Authentication → URL Configuration

**Site URL:**
```
https://tanti-auguri-giuliana.vercel.app
```

**Redirect URLs (Whitelist):**
Aggiungi questi URL:
```
http://localhost:4000/auth/callback
http://localhost:4000/reset-password
https://tanti-auguri-giuliana.vercel.app/auth/callback
https://tanti-auguri-giuliana.vercel.app/reset-password
```

**Per preview deployments (opzionale):**
```
https://tanti-auguri-giuliana-*.vercel.app/auth/callback
https://tanti-auguri-giuliana-*.vercel.app/reset-password
```

### 3. Verificare il Deployment

1. Assicurati che `NEXT_PUBLIC_APP_URL` sia impostato in Vercel
2. Fai un nuovo deploy (push su main o redeploy manuale)
3. Verifica che le email di conferma usino il nuovo dominio:
   - Registra un nuovo utente di test
   - Controlla l'email ricevuta
   - Il link dovrebbe puntare a `https://tanti-auguri-giuliana.vercel.app/auth/callback`

### 4. Test Completo

- [ ] Registrazione nuovo utente → email contiene link corretto
- [ ] Click sul link email → redirect funziona
- [ ] Reset password → email contiene link corretto
- [ ] Click sul link reset → redirect funziona
- [ ] Open Graph tags funzionano (condivisione social)
- [ ] SEO meta tags corretti

## Note

- Il codice usa `process.env.NEXT_PUBLIC_APP_URL` se disponibile, altrimenti usa `window.location.origin`
- In sviluppo, se `NEXT_PUBLIC_APP_URL` non è impostato, userà `http://localhost:4000`
- In produzione, DEVE essere impostato `NEXT_PUBLIC_APP_URL` in Vercel

## Troubleshooting

Se le email contengono ancora `localhost`:
1. Verifica che `NEXT_PUBLIC_APP_URL` sia impostato in Vercel
2. Verifica che gli URL siano nella whitelist di Supabase
3. Riavvia il deployment su Vercel

Se i link non funzionano:
1. Verifica che gli URL siano esattamente nella whitelist di Supabase
2. Controlla che non ci siano spazi o caratteri speciali
3. Assicurati che il dominio sia corretto (con `https://`)
