# Security Implementation

Documentazione delle misure di sicurezza implementate per proteggere l'applicazione da upload malevoli e abusi.

## 📋 Panoramica

L'applicazione implementa una strategia di sicurezza multilivello per proteggere da:
- Upload di file non autorizzati
- Bypass dei limiti di dimensione
- Manipolazione degli URL
- Spam e abusi

## 🛡️ Validazioni Server-Side

### 1. Validazione URL Media

**File**: [`src/lib/media-validation.ts`](src/lib/media-validation.ts)

**Cosa verifica:**
- ✅ URL proviene dal dominio Supabase corretto
- ✅ URL contiene il percorso bucket corretto (`content-media`)
- ✅ Struttura percorso è valida: `{userId}/{filename}`
- ✅ Utente può caricare solo nella propria cartella

**Esempio:**
```typescript
const result = validateMediaUrl(mediaUrl)
if (!result.valid) {
  return { success: false, error: result.error }
}
```

### 2. Validazione Metadata Immagini

**Cosa verifica:**
- ✅ File esiste effettivamente nello storage
- ✅ Dimensione file ≤ 10MB
- ✅ MIME type è consentito (JPEG, PNG, GIF, WEBP)
- ✅ File appartiene all'utente che lo sta caricando

**Implementazione:**
```typescript
const validation = await validateImageMetadata(mediaUrl, userId)
if (!validation.valid) {
  return { success: false, error: validation.error }
}
```

### 3. Validazione Metadata Video

**Cosa verifica:**
- ✅ File esiste effettivamente nello storage
- ✅ Dimensione file ≤ 10MB
- ✅ MIME type è consentito (MP4, MOV, WEBM)
- ✅ File appartiene all'utente che lo sta caricando

## 🔒 Row Level Security (RLS)

### Database Policies

**File**: [`supabase/migrations/002_rls_policies.sql`](supabase/migrations/002_rls_policies.sql)

**Content Table:**
- ✅ Users can only INSERT (non UPDATE/DELETE altrui)
- ✅ Users can only read own + approved content
- ✅ Admin può approvare/rifiutare contenuti

**Storage Bucket:**
- ✅ File size limit: 10MB (configurato nel bucket)
- ✅ MIME types consentiti: solo immagini e video
- ✅ Users possono caricare solo nella propria cartella: `{userId}/`

### Storage RLS Policies

**File**: [`supabase/migrations/005_storage_bucket_and_policies.sql`](supabase/migrations/005_storage_bucket_and_policies.sql)

```sql
-- Users can only upload to their own folder
CREATE POLICY "Authenticated users can upload files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'content-media' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

## ⏱️ Rate Limiting

### Client-Side Rate Limit

**File**: [`src/lib/utils.ts`](src/lib/utils.ts#L13-L31)

- Limite: 1 upload al minuto
- Storage: localStorage
- Scopo: UX feedback immediato

**Note:** Facilmente bypassabile, usato solo per UX.

### Server-Side Rate Limit

**File**: [`src/actions/content.ts`](src/actions/content.ts#L19-L39)

- Limite: 1 upload al minuto
- Verifica: Query database per ultimo upload
- Protezione: Non bypassabile

```typescript
const { data: lastUpload } = await supabase
  .from('content')
  .select('created_at')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle()

if (lastUpload) {
  const elapsed = Date.now() - new Date(lastUpload.created_at).getTime()
  if (elapsed < 60000) {
    return { success: false, error: 'Rate limit exceeded' }
  }
}
```

## 🧪 Testing

### Test Validazione URL

```bash
# Installa tsx se non già presente
npm install -D tsx

# Esegui test
npx tsx scripts/test-media-validation.ts
```

### Test Manuale Upload

1. Prova a caricare un file > 10MB → Deve fallire
2. Prova a caricare un file con tipo non supportato → Deve fallire
3. Prova a modificare l'URL del file caricato → Deve fallire alla validazione server
4. Prova 2 upload consecutivi in < 1 minuto → Secondo deve fallire

## 📊 Limiti Attuali

| Risorsa | Limite | Note |
|---------|--------|------|
| File size (immagine) | 10MB | Configurato nel bucket + validazione server |
| File size (video) | 10MB | Configurato nel bucket + validazione server |
| Upload rate | 1/minuto | Validato server-side |
| Storage totale | 500MB | Piano gratuito Supabase |

## 🚫 Cosa NON è Implementato

### CAPTCHA
- **Motivo:** Gli utenti sono tutti amici invitati
- **Rischio:** Se il link viene condiviso pubblicamente, spam possibile
- **Mitigazione:** Monitoraggio manuale + rate limiting

### IP-based Rate Limiting
- **Motivo:** Complessità aggiuntiva non necessaria per evento privato
- **Rischio:** Utente può bypassare localStorage rate limit
- **Mitigazione:** Server-side rate limit basato su DB è sufficiente

## 🔍 Monitoraggio

### Metriche da Monitorare

1. **Storage usage**: Verifica che non si superi il limite gratuito
   ```bash
   # Vai su Supabase Dashboard > Storage > content-media
   ```

2. **Upload frequency**: Controlla se ci sono picchi anomali
   ```sql
   SELECT DATE(created_at), COUNT(*)
   FROM content
   GROUP BY DATE(created_at)
   ORDER BY DATE(created_at) DESC;
   ```

3. **Failed uploads**: Controlla log errori per tentativi malevoli
   ```bash
   # Vercel logs o console browser
   ```

## 🔐 Best Practices Implementate

- ✅ Defense in depth: validazione client + server + RLS
- ✅ Least privilege: users possono solo inserire nella propria cartella
- ✅ Input validation: tutti gli input validati server-side
- ✅ File type verification: MIME type verificato a livello storage
- ✅ Size limits: configurati sia nel bucket che nella validazione
- ✅ Rate limiting: server-side per prevenire abusi
- ✅ Cleanup automatico: file rimossi se il salvataggio DB fallisce

## 📝 Changelog

### 2026-01-24 - Server-Side Media Validation
- ✅ Aggiunta validazione server-side per immagini
- ✅ Aggiunta validazione server-side per video
- ✅ Validazione URL e ownership dei file
- ✅ Verifica MIME type e dimensione file via Storage API
- ✅ Documentazione sicurezza e test script

### Precedente
- ✅ RLS policies su database e storage
- ✅ Rate limiting client + server
- ✅ File size limits nel bucket Supabase
