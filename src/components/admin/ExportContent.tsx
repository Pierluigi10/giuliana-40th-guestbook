'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, FileArchive, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function ExportContent() {
  const [isExporting, setIsExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState<'zip' | 'pdf' | null>(null)

  const handleExport = async (format: 'zip' | 'pdf') => {
    setIsExporting(true)
    setExportFormat(format)

    try {
      const response = await fetch(`/api/admin/export?format=${format}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Export failed')
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `guestbook-export-${new Date().toISOString().split('T')[0]}.${format === 'zip' ? 'zip' : 'pdf'}`
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Download file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success(
        format === 'zip'
          ? 'Export ZIP completato con successo!'
          : 'Export PDF completato con successo!'
      )
    } catch (error) {
      console.error('Export error:', error)
      toast.error(
        error instanceof Error
          ? `Errore durante l'export: ${error.message}`
          : "Errore durante l'export"
      )
    } finally {
      setIsExporting(false)
      setExportFormat(null)
    }
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 max-w-4xl">
        {/* ZIP Export */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileArchive className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>Export Completo (ZIP)</CardTitle>
                <CardDescription>
                  Scarica tutti i contenuti: messaggi, foto e video
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Il file ZIP include:
            </p>
            <ul className="text-sm space-y-2 mb-6 text-muted-foreground">
              <li>• File INDEX.txt con metadati di tutti i contenuti</li>
              <li>• Cartella text/ con tutti i messaggi di testo</li>
              <li>• Cartella images/ con tutte le foto</li>
              <li>• Cartella videos/ con tutti i video</li>
            </ul>
            <Button
              onClick={() => handleExport('zip')}
              disabled={isExporting}
              className="w-full"
              size="lg"
            >
              {isExporting && exportFormat === 'zip' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Esportazione in corso...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Scarica ZIP
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* PDF Export */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>Export Messaggi (PDF)</CardTitle>
                <CardDescription>
                  Scarica solo i messaggi di testo in formato PDF
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Il file PDF include:
            </p>
            <ul className="text-sm space-y-2 mb-6 text-muted-foreground">
              <li>• Tutti i messaggi di testo approvati</li>
              <li>• Informazioni autore per ogni messaggio</li>
              <li>• Data di creazione e approvazione</li>
              <li>• Formattato per stampa e lettura</li>
            </ul>
            <Button
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              className="w-full"
              size="lg"
              variant="outline"
            >
              {isExporting && exportFormat === 'pdf' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Esportazione in corso...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Scarica PDF
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 max-w-4xl">
        <CardHeader>
          <CardTitle>Note sull&apos;Export</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm space-y-2 text-muted-foreground">
            <li>
              • Solo i contenuti con status &quot;approved&quot; vengono esportati
            </li>
            <li>
              • L&apos;export può richiedere alcuni minuti se ci sono molti file
            </li>
            <li>
              • I file ZIP possono essere molto grandi se ci sono molti video
            </li>
            <li>
              • Il PDF include solo i messaggi di testo, non le immagini o i video
            </li>
            <li>
              • Gli export includono metadati completi (autore, data, ecc.)
            </li>
          </ul>
        </CardContent>
      </Card>
    </>
  )
}
