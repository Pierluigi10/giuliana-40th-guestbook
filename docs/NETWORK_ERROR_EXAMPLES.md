# Esempi di Utilizzo Network Error Utilities

## Import Base

```typescript
import {
  analyzeNetworkError,
  retryWithBackoff,
  fetchWithRetry,
  uploadWithRetry,
  formatErrorMessage,
  isRetryable,
  getRetryDelay
} from '@/lib/network-errors'
import { toast } from 'sonner'
```

## Esempio 1: Simple Fetch con Retry

```typescript
async function fetchUserData() {
  try {
    const response = await fetchWithRetry('/api/users', {
      timeout: 10000,
      maxRetries: 2
    })
    const data = await response.json()
    return data
  } catch (error) {
    const errorInfo = analyzeNetworkError(error)
    toast.error('Caricamento dati non riuscito', {
      description: errorInfo.userMessage
    })
    throw error
  }
}
```

## Esempio 2: Upload con Progress e Retry

```typescript
async function uploadImage(file: File) {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  setLoading(true)
  setProgress(0)

  try {
    const supabase = createClient()
    const fileName = `${userId}/${crypto.randomUUID()}.jpg`

    // Upload con retry automatico
    const result = await uploadWithRetry(
      () => supabase.storage
        .from('images')
        .upload(fileName, file),
      {
        maxRetries: 2,
        onProgress: (p) => setProgress(p),
        onRetry: (attempt, error) => {
          console.log(`Retry attempt ${attempt}`)
          toast.info('Riprovo il caricamento... 🔄', {
            description: `Tentativo ${attempt} di 3`
          })
        }
      }
    )

    if (result.error) {
      const errorInfo = analyzeNetworkError(result.error)
      toast.error('Upload fallito', {
        description: errorInfo.userMessage
      })
      return
    }

    toast.success('Upload completato!')
  } catch (error) {
    const errorInfo = analyzeNetworkError(error)
    toast.error('Errore imprevisto', {
      description: errorInfo.userMessage
    })
  } finally {
    setLoading(false)
  }
}
```

## Esempio 3: Server Action con Error Handling

```typescript
async function handleSubmit() {
  const [loading, setLoading] = useState(false)

  setLoading(true)

  try {
    const result = await myServerAction(data)

    if (result.success) {
      toast.success('Operazione completata!')
    } else {
      // Analizza errore dal server
      const errorInfo = analyzeNetworkError(result.error)
      toast.error('Operazione fallita', {
        description: errorInfo.userMessage
      })
    }
  } catch (error) {
    // Errore imprevisto (network, parsing, etc)
    console.error('[Component] Unexpected error:', error)
    const errorInfo = analyzeNetworkError(error)
    toast.error('Si è verificato un errore', {
      description: errorInfo.userMessage
    })
  } finally {
    setLoading(false)
  }
}
```

## Esempio 4: Periodic Refresh con Error Handling

```typescript
function DataComponent() {
  const [data, setData] = useState(null)
  const [errorCount, setErrorCount] = useState(0)
  const MAX_ERRORS = 3

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetchWithRetry('/api/data', {
          timeout: 10000,
          maxRetries: 1
        })
        const newData = await response.json()
        setData(newData)
        setErrorCount(0) // Reset su successo
      } catch (error) {
        console.error('[DataComponent] Refresh failed:', error)
        setErrorCount(prev => prev + 1)

        // Mostra toast solo dopo N fallimenti
        if (errorCount >= MAX_ERRORS) {
          const errorInfo = analyzeNetworkError(error)
          toast.error('Aggiornamento dati non riuscito', {
            description: errorInfo.userMessage,
            duration: 3000
          })
        }
      }
    }, 30000) // ogni 30 secondi

    return () => clearInterval(interval)
  }, [errorCount])

  return <div>{/* UI */}</div>
}
```

## Esempio 5: Custom Retry Logic

```typescript
async function complexOperation() {
  try {
    const result = await retryWithBackoff(
      async () => {
        // Operazione complessa che può fallire
        const step1 = await fetch('/api/step1')
        const step2 = await fetch('/api/step2')
        const step3 = await fetch('/api/step3')
        return { step1, step2, step3 }
      },
      {
        maxRetries: 3,
        initialDelay: 1000, // 1s
        maxDelay: 10000, // max 10s
        onRetry: (attempt, error) => {
          console.log(`Retry ${attempt}:`, error)
          toast.info(`Riprovo... (tentativo ${attempt})`)
        }
      }
    )

    toast.success('Operazione completata!')
    return result
  } catch (error) {
    const errorInfo = analyzeNetworkError(error)
    toast.error('Operazione fallita', {
      description: errorInfo.userMessage
    })
    throw error
  }
}
```

## Esempio 6: Conditional Retry

```typescript
async function smartUpload(file: File) {
  try {
    const result = await uploadFile(file)
    return result
  } catch (error) {
    const errorInfo = analyzeNetworkError(error)

    // Decidi se riprovare in base al tipo di errore
    if (errorInfo.canRetry) {
      toast.info('Riprovo automaticamente...', {
        description: errorInfo.userMessage
      })

      // Aspetta il delay suggerito
      const delay = getRetryDelay(error)
      await new Promise(resolve => setTimeout(resolve, delay))

      // Riprova una volta
      try {
        const retryResult = await uploadFile(file)
        toast.success('Upload completato al secondo tentativo!')
        return retryResult
      } catch (retryError) {
        const retryErrorInfo = analyzeNetworkError(retryError)
        toast.error('Upload fallito definitivamente', {
          description: retryErrorInfo.userMessage
        })
        throw retryError
      }
    } else {
      // Errore non riproducibile (es. auth, validation)
      toast.error('Upload fallito', {
        description: errorInfo.userMessage
      })
      throw error
    }
  }
}
```

## Esempio 7: Bulk Operations con Error Tracking

```typescript
async function bulkApprove(ids: string[]) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  setLoading(true)
  setErrors([])

  const results = await Promise.allSettled(
    ids.map(id => approveContent(id))
  )

  const failed = results.filter(r => r.status === 'rejected')

  if (failed.length > 0) {
    const errorMessages = failed.map((f: any) => {
      const errorInfo = analyzeNetworkError(f.reason)
      return errorInfo.userMessage
    })

    // Raggruppa messaggi uguali
    const uniqueErrors = [...new Set(errorMessages)]
    setErrors(uniqueErrors)

    toast.error(`${failed.length} operazioni fallite`, {
      description: uniqueErrors[0] // Mostra primo errore
    })
  } else {
    toast.success(`${ids.length} contenuti approvati!`)
  }

  setLoading(false)
}
```

## Esempio 8: Form Submit con Retry Button

```typescript
function MyForm() {
  const [error, setError] = useState<NetworkErrorInfo | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setLoading(true)
    setError(null)

    try {
      await submitForm(data)
      toast.success('Form inviato!')
    } catch (err) {
      const errorInfo = analyzeNetworkError(err)
      setError(errorInfo)
      toast.error('Invio fallito', {
        description: errorInfo.userMessage
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form>
      {/* form fields */}

      {error && error.canRetry && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
          <p className="text-sm text-yellow-800 mb-2">
            {error.userMessage}
          </p>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="text-sm bg-yellow-600 text-white px-4 py-2 rounded"
          >
            Riprova
          </button>
        </div>
      )}

      <button type="submit" disabled={loading}>
        {loading ? 'Invio...' : 'Invia'}
      </button>
    </form>
  )
}
```

## Esempio 9: Format Error per Logging

```typescript
async function loggedOperation() {
  try {
    const result = await riskyOperation()
    return result
  } catch (error) {
    // Log tecnico
    console.error('[Component] Operation failed:', error)

    // Log user-friendly per monitoring
    const userMessage = formatErrorMessage(error, 'riskyOperation')
    // Output: "Controlla la connessione internet e riprova (riskyOperation)"

    // Invia a servizio di monitoring
    logToService({
      component: 'MyComponent',
      operation: 'riskyOperation',
      error: userMessage,
      timestamp: new Date()
    })

    toast.error('Operazione fallita', {
      description: userMessage
    })

    throw error
  }
}
```

## Esempio 10: Check Retryable Before Retry

```typescript
async function smartFetch(url: string) {
  try {
    return await fetch(url)
  } catch (error) {
    // Controlla se vale la pena riprovare
    if (isRetryable(error)) {
      console.log('Error is retryable, attempting retry...')
      const delay = getRetryDelay(error)
      await new Promise(resolve => setTimeout(resolve, delay))
      return await fetch(url) // retry once
    } else {
      console.log('Error is not retryable, failing immediately')
      throw error
    }
  }
}
```

## Best Practices

### 1. Sempre Loggare Errori
```typescript
catch (error) {
  console.error('[ComponentName] Operation failed:', error)
  const errorInfo = analyzeNetworkError(error)
  // ... rest of handling
}
```

### 2. Cleanup su Errore
```typescript
try {
  await uploadFile(fileName, file)
} catch (error) {
  // Cleanup file uploadato
  await supabase.storage.from('bucket').remove([fileName])
  throw error
}
```

### 3. User Feedback Progressivo
```typescript
toast.info('Riprovo il caricamento... 🔄', {
  description: `Tentativo ${attempt} di 3`
})
```

### 4. Mantieni Stato Precedente
```typescript
try {
  const newData = await fetchData()
  setData(newData)
} catch (error) {
  // Keep previous data visible
  console.error('Failed to refresh:', error)
}
```

### 5. Timeout Appropriati
```typescript
// Upload pesanti
timeout: 60000 // 60s

// API veloci
timeout: 10000 // 10s

// Operazioni critiche real-time
timeout: 5000 // 5s
```

## Debugging

### Console Logs Strutturati
```typescript
console.log('[ComponentName] Starting operation')
console.log('[ComponentName] Retry attempt:', attempt)
console.error('[ComponentName] Operation failed:', error)
console.log('[ComponentName] Operation completed')
```

### Error Info per Debug
```typescript
catch (error) {
  const errorInfo = analyzeNetworkError(error)
  console.debug('Error analysis:', {
    type: errorInfo.type,
    canRetry: errorInfo.canRetry,
    retryDelay: errorInfo.retryDelay,
    userMessage: errorInfo.userMessage,
    technicalMessage: errorInfo.message
  })
}
```
