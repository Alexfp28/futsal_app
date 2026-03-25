# Acta de Partido - Setup Instructions

## What was implemented

### 1. ✅ Fixed Classification Table Scoring Bug
**File**: `src/components/intranet/ClasificacionTable.vue`

**Issue**: The display was inflating/deflating points by treating goal difference (`dg`) as "bonus points"

**Fix**:
- `totalPuntos` now correctly displays `row.pts` directly (which SQL already calculates as 3*W + 1*D)
- Removed "Pts extra" column from desktop table and mobile cards
- Updated legend to remove "bonus points" concept
- Classification now shows correct standings

### 2. ✅ Created Database Migration for Acta de Partido
**File**: `supabase/migration_acta_partido.sql`

**New columns on `partidos` table**:
- `hora_inicio` (TIME) - actual match start time
- `hora_fin` (TIME) - actual match end time
- `arbitro` (TEXT) - referee name (optional)
- `redactado_por` (TEXT) - who filled the report
- `confirmado` (BOOLEAN) - confirmation checkbox

**New RLS policy**:
- `estadisticas_partido_jugador` now has a SELECT policy for public read (needed for ranking views)

### 3. ✅ Expanded Match Registration into Full Acta de Partido Form
**File**: `src/components/intranet/ClasificacionTable.vue`

**New form sections**:
1. Partido programado selector (optional) - connects scheduled matches
2. Fecha field (split from datetime - now just date)
3. Hora inicio + Hora fin (time fields)
4. Player statistics per team:
   - Dynamic rows with player dropdown + goals/assists/yellow cards/red cards
   - Add/remove buttons for each player
5. Observaciones/Incidencias (textarea - for delays, injuries, conflicts, etc.)
6. Árbitro (optional text)
7. Redactado por (who fills the report)
8. Confirmation checkbox ("Confirmo que toda la información es correcta")

**Save button** is disabled until confirmation is checked.

### 4. ✅ Connected Scheduled Matches with Result Registration
**File**: `src/components/intranet/ClasificacionTable.vue`

**New functionality**:
- When opening the panel, scheduled matches (`estado='programado'`) are fetched
- User can select a scheduled match from dropdown
- Auto-fills: teams, date, location from the selected match
- When saving:
  - If scheduled match selected: **UPDATE** the existing match record
  - If no scheduled match: **INSERT** a new match record
- Player statistics are inserted into `estadisticas_partido_jugador` table after match save

---

## How to Apply These Changes

### Step 1: Run the Database Migration

1. Go to Supabase Dashboard
2. Open SQL Editor
3. Copy the contents of `supabase/migration_acta_partido.sql`
4. Run the migration

```sql
-- This will:
-- - Add 5 new columns to partidos table
-- - Add SELECT policy to estadisticas_partido_jugador
```

**Important**: Run this before deploying the frontend code!

### Step 2: Deploy the Frontend Code

The Vue component changes are ready to deploy:

```bash
npm run dev        # Test locally
npm run build      # Check for build errors (should pass)
# Then push to Vercel or your deployment platform
```

### Step 3: Test the Changes

1. **Test scoring fix**: Visit intranet and check Clasificación table - points should be +3 for win, +1 for draw (no inflated values)

2. **Test Acta de Partido form**:
   - As admin, click "Registrar resultado" button
   - Verify you see:
     - "Partido programado (opcional)" dropdown at top
     - Time start/end fields below date
     - Player statistics sections with dynamic rows
     - Observaciones, Árbitro, Redactado por fields
     - Confirmation checkbox at bottom
   - Try to save without confirmation - button should be disabled
   - Check confirmation box - button should enable

3. **Test scheduled match connection**:
   - Create a season with scheduled matches (using Admin > Partidos > Nueva Temporada)
   - Open "Registrar resultado" panel
   - Verify scheduled matches appear in dropdown
   - Select one and verify teams/date/location auto-fill
   - Fill in stats and save
   - Verify in Supabase that:
     - The `partidos` record was UPDATED (not inserted as new)
     - New rows exist in `estadisticas_partido_jugador` table

4. **Test player statistics storage**:
   - After saving an acta with player stats
   - Query `estadisticas_partido_jugador` table
   - Verify records exist with correct `partido_id`, `jugador_id`, and stat values

---

## Database Changes Summary

### Before
- `partidos` table had: id, equipo_local_id, equipo_visitante_id, fecha, lugar, goles_local, goles_visitante, estado
- No way to track: start/end times, referee, who filled the report, detailed player stats per match

### After
- `partidos` table adds: hora_inicio, hora_fin, arbitro, redactado_por, confirmado
- `estadisticas_partido_jugador` allows non-admin reads (for ranking views)
- Player-level stats are now storable and queryable

---

## New Vue Component State

**Added to ClasificacionTable.vue**:

```javascript
// Scheduled matches
const scheduledMatches = ref([]);
const selectedScheduledMatch = ref(null);

// Player rosters per team
const jugadoresLocal = ref([]);
const jugadoresVisitante = ref([]);

// Match statistics (one row per player per team)
const statsLocal = ref([]);  // Each: { jugador_id, goles, asistencias, tarjetas_amarillas, tarjetas_rojas }
const statsVisitante = ref([]);
```

**Expanded form fields**:
```javascript
const form = ref({
  // ... existing fields ...
  hora_inicio: "",
  hora_fin: "",
  arbitro: "",
  observaciones: "",
  redactado_por: "",
  confirmado: false,
});
```

---

## API Calls Made During Save

When user clicks "Guardar resultado":

1. **Insert/Update partido**:
   - If `selectedScheduledMatch`: UPDATE partidos WHERE id = selectedScheduledMatch
   - Else: INSERT new partido record
   - Saves all 5 new fields + existing ones

2. **Bulk insert player statistics**:
   - Filter out empty stats (all counts = 0)
   - INSERT into estadisticas_partido_jugador with partido_id + jugador_id + counts

3. **Refresh classification**:
   - Refetch clasificacion view to show updated standings

---

## Validation & Error Handling

**Form validation** (before save):
- Both teams must be selected
- Teams cannot be the same
- Date must be provided
- Confirmation must be checked

**Warnings** (shown but don't block save):
- If sum of individual player goals doesn't match goles_local/visitante (shown as info)

**RLS Security**:
- Only admins can insert/update partidos (`canManage = isAdmin`)
- Only admins can insert estadisticas_partido_jugador (RLS policy)
- All users can read estadisticas_partido_jugador (new SELECT policy) for ranking views

---

## Next Steps (Optional Enhancements)

- Allow captains to also fill actas (currently admin-only via `canManage`)
- Add validation warning if sum of player goals ≠ match total goals
- Add MVP rating field to player stats
- Show match report in a detail view (currently view-only in calendar modal)
- Bulk edit player stats after match creation

---

## Files Modified

| File | Changes |
|------|---------|
| `src/components/intranet/ClasificacionTable.vue` | 400+ lines - scoring fix + full acta form + scheduled match connection |
| `supabase/migration_acta_partido.sql` | NEW - database migration for 5 columns + RLS policy |

---

## Commit Hash

```
1d52feb - feat: Acta de Partido + fix clasificacion scoring + scheduled match connection
```

All changes are in this single commit for easy review/rollback.
