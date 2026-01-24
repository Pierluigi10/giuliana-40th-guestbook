# Error Handling & Error Boundary

Sistema completo di gestione errori per l'applicazione Guestbook Giuliana 40.

## Panoramica

L'applicazione implementa una strategia di gestione errori multi-livello per garantire che gli utenti vedano sempre messaggi user-friendly invece di schermate bianche o errori tecnici.

## Componenti

### 1. Global Error Boundary (React Class Component)

**File**: `src/components/error-boundary.tsx`

Componente React Class-based che cattura errori JavaScript nel rendering React.

**Caratteristiche**:
- Cattura errori durante il rendering, lifecycle methods, e costruttori
- Mostra UI user-friendly con stile festivo (rosa, viola, oro)
- Offre pulsante "Riprova" per reset dello stato
- Mostra dettagli errore in development mode
- Supporta fallback UI personalizzato
- Logging degli errori in console (development)
- Preparato per integrazione con servizi esterni (Sentry, LogRocket, etc.)

**Utilizzo**:
```tsx
import { GlobalErrorBoundary } from '@/components/error-boundary'

<GlobalErrorBoundary>
  <YourComponent />
</GlobalErrorBoundary>
```

**Props**:
- `children`: ReactNode - contenuto da proteggere
- `fallback?`: ReactNode - UI personalizzato in caso di errore
- `onReset?`: () => void - callback custom per reset
- `showHomeButton?`: boolean - mostra/nascondi pulsante Home (default: true)

### 2. Next.js Error Pages

#### Root Error Page
**File**: `src/app/error.tsx`

Gestisce errori a livello root dell'applicazione.

#### Guest Area Error Page
**File**: `src/app/(guest)/error.tsx`

Gestisce errori nell'area guest (upload, etc.) con link specifici all'upload.

#### Admin Area Error Page
**File**: `src/app/(admin)/error.tsx`

Gestisce errori nell'area admin (moderazione, etc.) con link alla dashboard admin.

## Architettura

```
┌─────────────────────────────────────┐
│   Root Layout (layout.tsx)          │
│   ┌─────────────────────────────┐   │
│   │  GlobalErrorBoundary        │   │
│   │  ┌─────────────────────┐    │   │
│   │  │   App Content       │    │   │
│   │  └─────────────────────┘    │   │
│   └─────────────────────────────┘   │
└─────────────────────────────────────┘
         │
         ├─── error.tsx (root)
         │
         ├─── (guest)/error.tsx
         │
         └─── (admin)/error.tsx
```

## Messaggi Utente

Tutti i messaggi sono in **italiano** e user-friendly:

### Titolo
> **Ops! Qualcosa è andato storto 😔**

### Messaggio principale
> Non ti preoccupare, riprova tra un momento!
> I tuoi dati sono al sicuro e il problema verrà risolto presto.

### Messaggi specifici per area

**Guest Area**:
> Si è verificato un problema durante il caricamento.
> Non preoccuparti, i tuoi contenuti caricati sono al sicuro!

**Admin Area**:
> Si è verificato un problema nell'area amministratore.
> Non preoccuparti, tutti i dati sono al sicuro.

## Stile Visivo

Tutti gli error UI utilizzano lo **stile festivo** dell'app:
- Colori: Rose Gold (#D4A5A5), Blush Pink (#FFB6C1), Purple (#9D4EDD), Gold (#FFD700)
- Sfondo gradient: from-birthday-rose-gold/10 via-birthday-blush/5 to-birthday-purple/5
- Card bianca con border-2 border-birthday-rose-gold/30
- Shadow-2xl per profondità
- Animazioni: pulse sull'icona di errore
- Bottoni con gradient colorato

## Development vs Production

### Development Mode
- Mostra dettagli tecnici dell'errore
- Stack trace completo (collapsible)
- Error digest (per Next.js errors)
- Console logging attivo

### Production Mode
- Solo messaggi user-friendly
- Nessun dettaglio tecnico esposto
- Error tracking verso servizi esterni (TODO)

## Testing

### Pagina di Test
**File**: `src/app/test-error-boundary/page.tsx`

Pagina dedicata per testare l'Error Boundary in sviluppo.

**URL**: `/test-error-boundary`

**IMPORTANTE**: Rimuovere questa pagina prima del deploy in produzione!

**Come testare**:
1. Avvia il server di sviluppo: `npm run dev`
2. Naviga su `http://localhost:3000/test-error-boundary`
3. Clicca "Simula Errore"
4. Verifica che appaia la schermata di errore user-friendly
5. Testa i pulsanti "Riprova" e "Torna alla Home"

### Test Manuale

**Simulare un errore in qualsiasi componente**:
```tsx
'use client'

export default function MyComponent() {
  // Questo lancerà un errore catturato dall'Error Boundary
  throw new Error('Test error')

  return <div>Content</div>
}
```

## Integrazione con Error Tracking

### TODO: Sentry Integration

Aggiungi nel `componentDidCatch` di GlobalErrorBoundary:

```typescript
import * as Sentry from '@sentry/nextjs'

componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  // Log to Sentry
  Sentry.captureException(error, {
    contexts: {
      react: {
        componentStack: errorInfo.componentStack
      }
    }
  })
}
```

### TODO: Custom Analytics

```typescript
// Send to custom analytics endpoint
fetch('/api/log-error', {
  method: 'POST',
  body: JSON.stringify({
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  })
})
```

## Best Practices

1. **Non catturare errori async**: Error Boundary cattura solo errori durante il rendering. Per errori async usa try-catch.

2. **Granularità**: Usa Error Boundary a livelli appropriati:
   - GlobalErrorBoundary nel root layout per errori app-wide
   - Error Boundary specifici per sezioni critiche (upload, payment, etc.)

3. **Logging**: Sempre loggare errori per debugging, ma non esporre dettagli in produzione

4. **UX**: Fornire sempre azioni chiare (Riprova, Home, etc.)

5. **Testing**: Testare regolarmente che gli error boundary funzionino

## Troubleshooting

### Error Boundary non cattura l'errore

**Possibili cause**:
- Errore in event handler (usa try-catch)
- Errore async (usa try-catch)
- Errore in server component (Next.js error.tsx lo gestisce)

### Schermata bianca invece di error UI

**Verifica**:
1. Error Boundary è wrapped correttamente?
2. Build production funziona? (`npm run build`)
3. JavaScript abilitato nel browser?

## Files Rilevanti

```
src/
├── components/
│   └── error-boundary.tsx          # Global Error Boundary component
│
├── app/
│   ├── layout.tsx                  # Root layout con GlobalErrorBoundary
│   ├── error.tsx                   # Root error page
│   ├── (guest)/
│   │   └── error.tsx              # Guest area error page
│   ├── (admin)/
│   │   └── error.tsx              # Admin area error page
│   └── test-error-boundary/
│       └── page.tsx               # Test page (REMOVE IN PROD)
│
└── docs/
    └── ERROR_HANDLING.md          # Questa documentazione
```

## Checklist Pre-Deploy

- [ ] Error Boundary attivo nel root layout
- [ ] Error pages create per tutte le route groups
- [ ] Messaggi in italiano e user-friendly
- [ ] Test manuale completato
- [ ] `/test-error-boundary` RIMOSSO o protetto
- [ ] Error tracking configurato (Sentry, etc.)
- [ ] Build production funzionante
- [ ] Nessun dettaglio tecnico esposto in production

## Risorse

- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Next.js Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- [Sentry React](https://docs.sentry.io/platforms/javascript/guides/react/)
