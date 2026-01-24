# Network Error Handling - Guida Tecnica

## Panoramica

Il sistema di gestione degli errori di rete è stato migliorato per fornire agli utenti feedback chiari e informativi quando si verificano problemi di connessione o errori del server.

## Componenti Principali

### 1. Utility Module: `/src/lib/network-errors.ts`

Modulo centralizzato che fornisce:

- **Analisi intelligente degli errori**: Classifica automaticamente gli errori in categorie specifiche
- **Retry logic con exponential backoff**: Riprova automaticamente le operazioni fallite
- **Messaggi user-friendly in italiano**: Converte errori tecnici in messaggi comprensibili
- **Fetch con timeout**: Previene operazioni che impiegano troppo tempo

#### Tipi di Errori Gestiti

```typescript
- connection: Problemi di connessione internet
- timeout: Operazione troppo lenta
- server: Errori del server (5xx)
- authentication: Sessione scaduta (401, 403)
- rate_limit: Troppi tentativi (429)
- validation: Errori di validazione (4xx)
- unknown: Errori generici
```

#### Funzioni Principali

**`analyzeNetworkError(error)`**
- Analizza un errore e restituisce informazioni strutturate
- Determina se l'errore è riproducibile (canRetry)
- Suggerisce un delay per il retry

**`retryWithBackoff(operation, options)`**
- Esegue un'operazione con retry automatico
- Usa exponential backoff per evitare sovraccarico
- Callback onRetry per feedback all'utente

**`fetchWithRetry(url, options)`**
- Wrapper per fetch con timeout e retry
- Gestisce automaticamente gli abort controller
- Timeout configurabile (default 30s)

**`uploadWithRetry(supabaseUpload, options)`**
- Specializzato per upload Supabase
- Gestisce retry su errori di storage
- Supporta callback di progresso

## Componenti Aggiornati

### Upload Components

#### ImageUpload (`/src/components/upload/ImageUpload.tsx`)
- ✅ Retry automatico su errori di upload (max 2 tentativi)
- ✅ Messaggi di errore specifici per tipo di problema
- ✅ Toast notifications durante i retry
- ✅ Cleanup automatico dei file su fallimento
- ✅ Gestione errori di compressione

#### VideoUpload (`/src/components/upload/VideoUpload.tsx`)
- ✅ Retry automatico su errori di upload (max 2 tentativi)
- ✅ Messaggi di errore specifici
- ✅ Toast notifications durante i retry
- ✅ Cleanup automatico dei file

#### TextUpload (`/src/components/upload/TextUpload.tsx`)
- ✅ Gestione errori server actions
- ✅ Messaggi user-friendly su fallimento

### Gallery Components

#### ContentCard (`/src/components/gallery/ContentCard.tsx`)
- ✅ Gestione errori per reactions (add/remove)
- ✅ Gestione errori per delete
- ✅ Messaggi specifici per ogni tipo di errore

### Admin Components

#### ContentModerationQueue (`/src/components/admin/ContentModerationQueue.tsx`)
- ✅ Gestione errori approve/reject singoli
- ✅ Gestione errori bulk operations
- ✅ Feedback chiaro durante operazioni multiple

#### AdminStats (`/src/components/admin/AdminStats.tsx`)
- ✅ Fetch con retry e timeout
- ✅ Bottone "Riprova" su fallimento
- ✅ Toast error con messaggio specifico

#### StorageMonitor (`/src/components/admin/StorageMonitor.tsx`)
- ✅ Fetch con retry e timeout
- ✅ Gestione errori durante refresh stats

#### ExportContent (`/src/components/admin/ExportContent.tsx`)
- ✅ Timeout esteso (60s) per operazioni lunghe
- ✅ Retry con backoff per export falliti

### VIP Components

#### StatsDashboard (`/src/components/vip/StatsDashboard.tsx`)
- ✅ Refresh periodico con gestione errori
- ✅ Toast error solo dopo 3 fallimenti consecutivi
- ✅ Mantiene stats precedenti su errore
- ✅ Fetch con retry e timeout

## Messaggi di Errore User-Friendly

### Esempi di Messaggi

| Tipo Errore | Messaggio Tecnico | Messaggio Utente |
|-------------|-------------------|------------------|
| Connection | `fetch failed` | "Controlla la connessione internet e riprova" |
| Timeout | `AbortError` | "Il caricamento sta impiegando più tempo del solito. Riprova tra un momento" |
| Server 5xx | `500 Internal Server Error` | "C'è un problema temporaneo con il server. Riprova tra un momento" |
| Rate Limit | `429 Too Many Requests` | "Troppi tentativi. Attendi un momento prima di riprovare" |
| Auth | `401 Unauthorized` | "Sessione scaduta. Effettua di nuovo l'accesso" |

## Configurazione Retry Logic

### Upload (Image/Video)
```typescript
maxRetries: 2
initialDelay: 1000ms
onRetry: mostra toast "Riprovo il caricamento... 🔄"
```

### Fetch API (Stats, Admin)
```typescript
maxRetries: 2
timeout: 10000ms (10s)
exponential backoff: 1s, 2s, 4s
```

### Export Operations
```typescript
maxRetries: 1
timeout: 60000ms (60s) - operazioni lunghe
```

### Periodic Refresh (StatsDashboard)
```typescript
timeout: 10000ms
maxRetries: 1
failureThreshold: 3 (toast solo dopo 3 fallimenti)
```

## Best Practices Implementate

1. **Logging Strutturato**: Tutti gli errori sono loggati con prefisso componente
   ```typescript
   console.error('[ImageUpload] Storage upload error:', error)
   ```

2. **Cleanup su Errore**: File uploadati vengono rimossi su fallimento
   ```typescript
   await supabase.storage.from('content-media').remove([fileName])
   ```

3. **User Feedback Progressivo**: Toast notifications durante retry
   ```typescript
   toast.info('Riprovo il caricamento... 🔄', {
     description: `Tentativo ${attempt} di 3`
   })
   ```

4. **Fallback Graceful**: Mantiene stato precedente su errore (es. stats)
   ```typescript
   previousStats.current = stats // mantieni vecchi dati
   ```

5. **Timeout Appropriati**: Timeout diversi per operazioni diverse
   - Upload: 30s default
   - Fetch API: 10s
   - Export: 60s

## Testing degli Errori

### Simulare Errori di Rete

1. **Connection Error**: Disconnetti WiFi durante upload
2. **Timeout**: Throttle network a 2G in DevTools
3. **Server Error**: Mock API route che ritorna 500
4. **Rate Limit**: Mock API route che ritorna 429

### Test Checklist

- [ ] Upload immagine con WiFi disconnesso → Mostra messaggio connessione
- [ ] Upload video con network throttled → Mostra toast retry
- [ ] Stats refresh con server down → Toast error dopo 3 tentativi
- [ ] Export con timeout → Messaggio timeout user-friendly
- [ ] Reaction con session scaduta → Messaggio "Effettua di nuovo l'accesso"

## Miglioramenti Futuri

1. **Offline Mode**: Caching locale con service worker
2. **Network Status Indicator**: Badge che mostra stato connessione
3. **Background Sync**: Riprova upload automaticamente quando torna online
4. **Progressive Upload**: Chunk upload per file grandi
5. **Telemetry**: Traccia frequenza errori per monitoraggio

## Metriche da Monitorare

- Tasso di successo upload (target: >95%)
- Numero medio di retry necessari (target: <1.2)
- Tempo medio di upload (target: <5s per immagini, <15s per video)
- Frequenza errori per tipo (connection vs server vs timeout)

## Risorse

- [MDN Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [Exponential Backoff](https://en.wikipedia.org/wiki/Exponential_backoff)
- [Error Handling Best Practices](https://www.patterns.dev/posts/error-handling)
