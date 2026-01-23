# Come Risolvere il Problema delle Reactions

## Problema
Gli utenti guest non possono aggiungere reactions ai contenuti nella galleria.

## Causa
Il sistema aveva due restrizioni che impedivano ai guest di aggiungere reactions:
1. **Codice TypeScript** - controllava che solo VIP e Admin potessero aggiungere reactions
2. **Database RLS Policy** - la policy permetteva solo a VIP e Admin di inserire reactions

## Soluzione

### ✅ Parte 1: Codice TypeScript (GIÀ CORRETTO)
Il file `src/actions/reactions.ts` è stato già aggiornato per permettere a tutti gli utenti autenticati di aggiungere reactions.

### ⚠️  Parte 2: Database Policy (DA ESEGUIRE MANUALMENTE)

Devi eseguire questa migration SQL nel tuo database Supabase:

1. **Apri Supabase Dashboard**
   - Vai su https://supabase.com/dashboard
   - Seleziona il tuo progetto
   - Vai su **SQL Editor** nel menu laterale

2. **Copia e incolla questo SQL** nel SQL Editor:

```sql
-- Drop existing restrictive policy
DROP POLICY IF EXISTS "VIP and Admin can add reactions" ON reactions;

-- Create new policy allowing all authenticated users to add reactions
CREATE POLICY "Authenticated users can add reactions"
  ON reactions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM content
      WHERE content.id = reactions.content_id
      AND content.approved_at IS NOT NULL
    )
  );
```

3. **Clicca su "Run"** per eseguire la query

4. **Verifica** che la policy sia stata creata:

```sql
-- Verifica le policies della tabella reactions
SELECT * FROM pg_policies WHERE tablename = 'reactions';
```

Dovresti vedere:
- Policy "Authenticated users can add reactions" per INSERT
- Policy "Users can read reactions on approved content" per SELECT
- Policy "Users can delete their own reactions" per DELETE

## Verifica della Correzione

Dopo aver eseguito la migration:

1. **Riavvia l'applicazione** (se in sviluppo):
   ```bash
   npm run dev
   ```

2. **Testa le reactions**:
   - Accedi come guest
   - Vai nella galleria
   - Prova ad aggiungere una reaction a un contenuto
   - Verifica che funzioni senza errori

## File Modificati

- ✅ `src/actions/reactions.ts` - rimosso il controllo del ruolo
- ✅ `supabase/migrations/007_fix_reactions_permissions.sql` - nuova migration SQL
- ⚠️  Database Supabase - **DEVI ESEGUIRE MANUALMENTE** la migration

## Note Tecniche

La nuova policy permette a tutti gli utenti autenticati (guest, vip, admin) di:
- ✅ Aggiungere reactions solo ai contenuti approvati
- ✅ Rimuovere le proprie reactions
- ✅ Vedere tutte le reactions sui contenuti approvati

La sicurezza è mantenuta perché:
- Solo gli utenti autenticati possono aggiungere reactions
- Le reactions possono essere aggiunte solo a contenuti approvati
- Gli utenti possono eliminare solo le proprie reactions
