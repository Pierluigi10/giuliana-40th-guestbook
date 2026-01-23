# Come Aggiungere Environment Variables in Vercel

## Metodo 1: Tramite Dashboard Web (Raccomandato)

### Step 1: Accedi a Vercel
1. Vai su [https://vercel.com](https://vercel.com)
2. Clicca su **"Log in"** o **"Sign in"** (in alto a destra)
3. Accedi con il tuo account (GitHub, GitLab, Bitbucket, o email)

### Step 2: Trova il Tuo Progetto
1. Una volta dentro il dashboard, vedrai una lista di progetti
2. Cerca il progetto che corrisponde al tuo dominio `tanti-auguri-giuliana.vercel.app`
   - Il nome potrebbe essere:
     - `tanti-auguri-giuliana`
     - `g_gift`
     - `giuliana-guestbook`
     - O qualsiasi altro nome che hai dato al progetto
3. **Clicca sul nome del progetto** per aprirlo

### Step 3: Accedi alle Settings
Una volta dentro il progetto, vedrai diverse tab/opzioni in alto:
- **Overview** (default)
- **Deployments**
- **Analytics**
- **Settings** ← **CLICCA QUI**

### Step 4: Environment Variables
Dentro **Settings**, vedrai un menu laterale a sinistra con:
- General
- Git
- **Environment Variables** ← **CLICCA QUI**
- Domains
- Integrations
- etc.

### Step 5: Aggiungi la Variabile
1. Clicca su **"Add New"** o **"Add"** (pulsante in alto)
2. Compila i campi:
   - **Key**: `NEXT_PUBLIC_APP_URL`
   - **Value**: `https://tanti-auguri-giuliana.vercel.app`
   - **Environment**: Seleziona:
     - ✅ **Production**
     - ✅ **Preview** (opzionale ma consigliato)
     - ❌ **Development** (non necessario, usa .env.local in locale)
3. Clicca su **"Save"** o **"Add"**

### Step 6: Verifica
Dovresti vedere la nuova variabile nella lista:
```
NEXT_PUBLIC_APP_URL = https://tanti-auguri-giuliana.vercel.app
```

## Metodo 2: Tramite Vercel CLI

Se preferisci usare la CLI:

```bash
# Installa Vercel CLI (se non l'hai già)
npm i -g vercel

# Accedi
vercel login

# Aggiungi la variabile
vercel env add NEXT_PUBLIC_APP_URL production
# Quando chiede il valore, inserisci: https://tanti-auguri-giuliana.vercel.app

# Per Preview (opzionale)
vercel env add NEXT_PUBLIC_APP_URL preview
# Stesso valore: https://tanti-auguri-giuliana.vercel.app
```

## Metodo 3: Se Non Vedi il Progetto

Se non trovi il progetto nella lista:

### Opzione A: Cerca per Dominio
1. Vai su [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Usa la barra di ricerca in alto per cercare `tanti-auguri-giuliana`
3. Oppure cerca nel tuo team/organizzazione

### Opzione B: Verifica il Team
1. In alto a destra, clicca sul menu del team (accanto al tuo nome)
2. Assicurati di essere nel team corretto
3. Se hai più team, potrebbe essere in un altro

### Opzione C: Crea Nuovo Progetto
Se il progetto non esiste ancora:
1. Clicca su **"Add New"** → **"Project"**
2. Connetti il repository GitHub/GitLab
3. Vercel rileverà automaticamente Next.js
4. Durante la configurazione, puoi aggiungere le environment variables

## Screenshot/Descrizione Visiva

La struttura del menu dovrebbe essere così:

```
Vercel Dashboard
├── [Nome Team] (in alto a destra)
├── Projects List
│   └── [Il Tuo Progetto] ← CLICCA QUI
│       ├── Overview
│       ├── Deployments
│       ├── Analytics
│       └── Settings ← CLICCA QUI
│           ├── General
│           ├── Git
│           ├── Environment Variables ← CLICCA QUI
│           ├── Domains
│           └── ...
```

## Troubleshooting

### "Non vedo Environment Variables nel menu"
- Assicurati di essere dentro **Settings** (non Overview o Deployments)
- Controlla il menu laterale a sinistra, non quello in alto
- Se usi un account gratuito, la funzione è disponibile

### "Il progetto non esiste"
- Verifica di essere loggato con l'account corretto
- Controlla se il progetto è in un team/organizzazione diversa
- Se è un progetto nuovo, potrebbe non essere ancora deployato

### "Non ho accesso"
- Verifica di avere i permessi (Owner o Developer)
- Se è un progetto di un team, chiedi al team owner

### "La variabile non funziona dopo il deploy"
1. Assicurati di aver selezionato **Production** environment
2. Fai un **nuovo deploy** dopo aver aggiunto la variabile
3. Vai su **Deployments** → clicca sui tre puntini → **Redeploy**

## Verifica che Funzioni

Dopo aver aggiunto la variabile e fatto un nuovo deploy:

1. Vai su **Deployments**
2. Clicca sull'ultimo deployment
3. Vai su **Build Logs** o **Runtime Logs**
4. Cerca `NEXT_PUBLIC_APP_URL` per verificare che sia caricata

Oppure, nel codice, puoi verificare che `process.env.NEXT_PUBLIC_APP_URL` contenga il valore corretto.

## Link Diretti

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel Documentation - Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
