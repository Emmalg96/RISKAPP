# RISKAPP — HER2 Risk Traceability Dashboard

Standalone web app for browsing the **Explorer** sheet from the HER2 traceability workbook: risks, product requirements (PR), and protocols with filters for **DP52 / DP61**, **euRMW / dRMW**, **RiskSource**, **RiskScope**, and search.

**Default layout — By PR:** one block per `ProductRequirement` with **linked risks** (left), **PR text** (center), and **linked protocols** (right). Use **All rows** to restore the previous one-card-per-explorer-row view.

This repository contains **only** the HER2 dashboard (no PCS verification tooling).

## Prerequisites

- **Node.js** 20+ and **npm**
- **Python 3** with `openpyxl` (for refreshing JSON from Excel)

## Windows setup (Emma)

Use a short path without spaces when possible, e.g. `C:\dev\RISKAPP`.

```powershell
cd C:\dev
git clone https://github.com/egoodrick23/RISKAPP.git
cd RISKAPP
npm install
pip install -r requirements.txt
npm run dev
```

Open [http://127.0.0.1:43123/](http://127.0.0.1:43123/) — the dashboard is the home page.

If the GitHub remote is not available yet, use the Origin URL from your team’s RISKAPP repo once published.

### Refresh data from Excel

Place or update the workbook at:

`data\source\HER2_Risk_Traceability_PROJECT_AWARE_DRAFT.xlsx`

Then export the **Explorer** sheet to JSON:

```powershell
npm run her2:export
```

Or pass explicit paths (works on Windows with forward or backslashes):

```powershell
python scripts/export_her2_explorer.py "C:\path\to\HER2_Risk_Traceability_PROJECT_AWARE_DRAFT.xlsx" "public\data\her2-explorer.json"
```

Runtime data: `public/data/her2-explorer.json` (407 rows in the bundled export).

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Dev server on port **43123** |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run test` | Unit tests for filter logic |
| `npm run her2:export` | Regenerate JSON from the xlsx |

## Project layout

- `src/components/her2-risk-dashboard.tsx` — UI (PR hub layout + filters; toggle **By PR** / **All rows**)
- `src/lib/her2-explorer.ts` — Types, filters, and PR grouping helpers
- `scripts/export_her2_explorer.py` — Excel → JSON export
- `data/source/` — Source workbook (not required at runtime if JSON is present)
- `public/data/her2-explorer.json` — Dataset loaded by the app

## Ported from

Reference implementation: `pcs-validate` branch `cursor/her2-risk-dashboard-b4a1` (for history only — **do not** add HER2 features back into pcs-validate).
