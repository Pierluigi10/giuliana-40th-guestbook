# Deployment Checklist - Guestbook Giuliana 40°

## Timeline Critica

**Importante:** Esegui il deploy 3 giorni prima del compleanno, feature freeze 2 giorni prima.

## Pre-Deploy Verification

### 1. Build e Type Check

- [ ] Esegui `npm run type-check` - deve completare senza errori TypeScript
- [ ] Esegui `npm run build` - deve completare senza errori
- [ ] Esegui `npm run lint` - controlla warnings/errors
- [ ] Testa in modalità development: `npm run dev` - no errori in console

**Script automatico:** Esegui `./scripts/pre-deploy-check.sh` per verificare automaticamente

### 2. Database Setup su Supabase

- [ ] Tutte le migrations eseguite correttamente:
  - [ ] `001_initial_schema.sql` - tabelle users, content, reactions
  - [ ] `002_rls_policies.sql` - RLS policies per sicurezza
  - [ ] `003_seed_data.sql` - dati iniziali
- [ ] Admin user creato (Pierluigi):
  - Email: _________________
  - Role: `admin`
  - Status: `approved`
- [ ] VIP user creato (Giuliana):
  - Email: _________________
  - Role: `vip`
  - Status: `approved`
- [ ] Storage bucket `content-files` creato
- [ ] Storage policies configurate (vedi migration 002)

**Come verificare:**
```sql
-- Controlla utenti
SELECT id, email, role, status FROM profiles;

-- Controlla bucket storage
SELECT * FROM storage.buckets WHERE name = 'content-files';

-- Testa RLS policies
-- Prova ad accedere come guest non approvato (deve fallire)
```

### 3. Environment Variables su Vercel

- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurata
  - Valore: `https://[project-id].supabase.co`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurata
  - Trovalo in: Supabase Dashboard > Settings > API > anon public
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurata
  - Trovalo in: Supabase Dashboard > Settings > API > service_role
  - **ATTENZIONE:** Questa chiave NON deve mai essere esposta al client

**Come configurare su Vercel:**
1. Vai su dashboard.vercel.com
2. Seleziona il progetto
3. Settings > Environment Variables
4. Aggiungi le 3 variabili sopra
5. Redeploy il progetto

### 4. Security Tests

- [ ] XSS Protection testata:
  - Prova a inserire `<script>alert('test')</script>` in un messaggio
  - Deve essere sanitizzato (no popup)
- [ ] RLS Policies testate:
  - Utente guest non approvato NON può vedere gallery VIP
  - Utente guest NON può approvare contenuti
  - Utente VIP NON può vedere contenuti non approvati
- [ ] File upload limits:
  - File > 10MB devono essere rifiutati
  - Solo immagini (jpg, png, gif) e video (mp4, mov) accettati
- [ ] Rate limiting testato:
  - Non si possono caricare più di 1 contenuto al minuto

**Test manuale RLS:**
```javascript
// Prova a leggere content non approvato come VIP
// Deve restituire 0 risultati
const { data } = await supabase
  .from('content')
  .select('*')
  .eq('status', 'pending');
```

### 5. E2E Manual Test (Flusso Completo)

**Flusso Guest:**
- [ ] Registrazione nuovo guest
  - Vai su `/register`
  - Compila form con email/password
  - Verifica redirect a `/pending-approval`
- [ ] Approvazione admin
  - Login come admin su `/login`
  - Vai su `/approve-users`
  - Approva il guest appena registrato
- [ ] Login guest approvato
  - Logout admin
  - Login come guest su `/login`
  - Verifica redirect a `/upload`
- [ ] Upload contenuto
  - Carica testo + foto
  - Verifica upload progress bar
  - Conferma messaggio di successo
- [ ] Moderazione admin
  - Login come admin
  - Vai su `/approve-content`
  - Approva il contenuto appena caricato

**Flusso VIP:**
- [ ] Login VIP
  - Login come Giuliana su `/login`
  - Verifica redirect a `/gallery`
- [ ] Gallery view
  - Verifica che appare solo contenuto approvato
  - Testa filtri (Tutti/Testo/Foto/Video)
  - Testa pulsanti emoji reactions
  - Click su foto > verifica lightbox
  - Click su video > verifica playback

**Flusso Admin:**
- [ ] Dashboard admin
  - Vai su `/approve-users`
  - Verifica lista utenti pending
  - Testa approvazione bulk (se implementato)
- [ ] Content moderation
  - Vai su `/approve-content`
  - Verifica preview contenuti
  - Testa approve/reject

### 6. Mobile Test

- [ ] iPhone Safari
  - Registrazione funziona
  - Upload foto funziona (camera picker)
  - Gallery responsive
  - Reactions cliccabili
- [ ] Android Chrome
  - Stessi test di iPhone
- [ ] Layout responsive
  - Testa breakpoints: 320px, 375px, 768px, 1024px
  - Menu hamburger su mobile
  - Form leggibili su schermi piccoli

**Emulatori:**
- Chrome DevTools > Toggle device toolbar
- Testa: iPhone SE, iPhone 14 Pro, iPad, Samsung Galaxy S21

### 7. Performance Check

- [ ] Lighthouse test (Chrome DevTools)
  - Performance > 80 (mobile e desktop)
  - Accessibility > 90
  - Best Practices > 90
  - SEO > 90
- [ ] Lazy loading funziona
  - Immagini caricano on-scroll
  - Video non autoplay (risparmia banda)
- [ ] Bundle size accettabile
  - Esegui `npm run build`
  - Controlla output: First Load JS < 200kB

**Come eseguire Lighthouse:**
1. Apri Chrome DevTools (F12)
2. Tab "Lighthouse"
3. Seleziona "Mobile" + "Performance"
4. Click "Analyze page load"

### 8. Cross-Browser Test

- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)

**Funzionalità critiche da testare:**
- Login/Logout
- Upload file
- Gallery view
- Reactions

### 9. Storage e Limiti

- [ ] Storage Supabase verificato
  - Free tier: 500MB
  - Controlla usage: Supabase Dashboard > Storage > Usage
- [ ] Compressione immagini attiva
  - File caricati devono essere compressi client-side (se implementato)
- [ ] Monitoring configurato
  - Configura alert su Supabase se storage > 400MB

### 10. Deployment su Vercel

- [ ] Repository GitHub aggiornato
  ```bash
  git add .
  git commit -m "chore: pre-deployment final checks"
  git push origin main
  ```
- [ ] Vercel auto-deploy completato
  - Vai su dashboard.vercel.com
  - Verifica deployment status: "Ready"
  - Tempo deploy < 5 minuti
- [ ] Production URL accessibile
  - Visita `https://[project-name].vercel.app`
  - Homepage carica correttamente
- [ ] Tutte le funzionalità testati in produzione
  - Ripeti tests manuali E2E in produzione
  - Verifica env variables caricate

**Troubleshooting deploy:**
- Se deploy fallisce: controlla logs su Vercel
- Errori comuni: env variables mancanti, build errors TypeScript

### 11. Post-Deploy Verification

- [ ] Crea test users
  - 2-3 guest users di test
  - Carica 5-10 contenuti di test
- [ ] Testa notifiche (se implementate)
  - Email notifications funzionano
- [ ] Documenta credenziali admin
  - Salva email/password admin in password manager
  - Condividi link registrazione con primi amici
- [ ] Prepara guide utente
  - Invia istruzioni registrazione agli invitati
  - Prepara FAQ per domande comuni

### 12. Monitoring e Backup

- [ ] Configura monitoring Vercel
  - Analytics attivate
  - Error tracking attivo
- [ ] Backup database
  - Esporta schema Supabase
  - Salva migrations in repository
- [ ] Piano di rollback testato
  ```bash
  # In caso di emergenza
  git revert HEAD
  git push origin main
  # Vercel redeploy automaticamente
  ```

## Checklist Finale (T-3 giorni)

- [ ] Tutti i test sopra completati
- [ ] Admin e VIP users creati
- [ ] Environment variables configurate
- [ ] Deploy in produzione completato
- [ ] Test E2E in produzione superati
- [ ] Link registrazione condiviso con 2-3 amici beta tester

## Feature Freeze (T-2 giorni)

**Dopo questa data: SOLO bugfix critici, NO nuove features**

- [ ] Feature freeze comunicato al team (Pierluigi)
- [ ] Ultime modifiche mergeate
- [ ] Database backup completato
- [ ] Monitoraggio attivo

## D-Day Preparation (T-1 giorno)

- [ ] Verifica storage disponibile
- [ ] Controlla numero utenti registrati
- [ ] Testa gallery con contenuti reali
- [ ] Verifica performance con carico atteso
- [ ] Prepara piano emergenza

## Emergency Contacts

**Supporto Tecnico:**
- Vercel Support: https://vercel.com/support
- Supabase Support: https://supabase.com/support
- Next.js Discord: https://nextjs.org/discord

**Documentazione:**
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs

## Rollback Plan

**Se trovi bug critici in produzione:**

1. **Rollback immediato:**
   ```bash
   git log --oneline  # Trova commit ID precedente
   git revert HEAD    # Reverta ultimo commit
   git push origin main
   ```
   Vercel redeploy automaticamente in ~3 minuti

2. **Hotfix:**
   ```bash
   git checkout -b hotfix/critical-bug
   # Fix bug
   git commit -m "fix: resolve critical bug"
   git checkout main
   git merge hotfix/critical-bug
   git push origin main
   ```

3. **Notifiche utenti:**
   - Se necessario downtime, notifica utenti via email/SMS
   - Prepara messaggio: "Manutenzione temporanea, torniamo presto"

## Known Issues e Mitigazioni

| Rischio | Probabilità | Impatto | Mitigazione |
|---------|-------------|---------|-------------|
| Storage pieno (500MB) | Media | Alto | Compression immagini, limit 10MB, monitoring |
| Bulk uploads pre-evento | Alta | Medio | Rate limiting 1/min, guida utenti |
| Bug critico pre-evento | Bassa | Critico | Deploy T-3, feature freeze T-2 |
| Delay approvazioni admin | Media | Medio | Email notifications, dashboard mobile-friendly |
| Crash database | Molto bassa | Critico | Backup giornalieri, RLS policies testati |

## Success Metrics

**Target:**
- 30+ amici registrati
- 50+ contenuti caricati
- 0 bug critici
- Lighthouse Performance > 80
- 100% uptime durante evento

**Monitoraggio:**
- Dashboard Vercel Analytics
- Supabase Dashboard > Database > Statistics
- Google Analytics (se implementato)

## Quick Reference: Comandi Comuni

### Prima del Deploy
```bash
npm run build && npm run type-check && npm run lint
git status  # deve mostrare "clean"
git push origin main  # trigger Vercel deployment
```

### Controlla Deployment
```bash
# Vercel Dashboard
https://vercel.com/dashboard

# Production URL
https://[your-project].vercel.app

# Supabase Dashboard
https://supabase.com/dashboard
```

### Rollback
```bash
# Via Vercel dashboard: Click "Redeploy" su deployment precedente
# Via Git: git revert HEAD && git push origin main
```

### Visualizza Logs
```bash
# Vercel deployment logs: Dashboard → Deployments → Click deployment
# Supabase database logs: Dashboard → Logs
```

## Notes

- **Non fare deploy il giorno del compleanno** - troppo rischioso
- Testa tutto in produzione, non fidarti solo di local/staging
- Mantieni calma: il rollback è veloce (3 minuti)
- Backup database prima di ogni migration critica

---

**Compilato da:** ___________________
**Data:** ___________________
**Deployment completato:** ___________________
**Production URL:** ___________________
