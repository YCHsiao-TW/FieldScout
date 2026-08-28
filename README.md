# FieldScout v0.12.0

> **A mobile-first biodiversity field scouting and field-recording PWA for Taiwan**  
> **以手機為優先的臺灣生物多樣性野外探點、行程規劃與採集紀錄工具**

**🚀 Live App / 直接開啟 App:**  
https://ychsiao-tw.github.io/FieldScout/

[繁體中文](README_ZH.md) | [English](README_EN.md)

---

## v0.12.0 highlights

- heuristic route optimization
- Trip Point ↔ Field Record linking
- visit-status map markers
- locality and current-map-bounds filtering
- explainable candidate ranking
- linked collection counts per target site

## What is FieldScout?

FieldScout is a lightweight, local-first Progressive Web App designed for biodiversity fieldwork in Taiwan.

The workflow is:

**search taxon → review occurrence records → rank candidate sites → add field targets → plan route → navigate → record field observations/specimens → export data**

FieldScout currently runs entirely on **GitHub Pages**, with no Firebase or backend required.

### Current data sources

- **TaiCOL** — taxonomic/name resolution
- **GBIF** — occurrence records
- **iNaturalist** — occurrence records and source photos
- **OpenStreetMap / OpenTopoMap / CyclOSM** — basemaps

TBIA and TBN occurrence queries are currently disabled in the static version because direct browser access was not sufficiently reliable. They can be reconsidered when a backend/API proxy is added.

---

## Highlights

- Mobile-first split-screen map and list
- Marker clustering
- Marker ↔ list synchronization
- Taxon autocomplete and name resolution
- GBIF + iNaturalist occurrence search
- Candidate-site ranking with Top 5 recommendations
- Advanced filters and sorting
- Seasonal/monthly occurrence summary
- Interactive monthly occurrence chart
- Source-image thumbnails and galleries
- Multiple named field trips
- Route sorting: north → south / nearest → farthest
- Google Maps multi-stop navigation
- GPX import/export
- GPS track recording
- Local email profiles
- IndexedDB persistence
- Batch collection-site mode
- Automatic specimen numbering
- Local field photos
- Data-quality checks
- CSV / GeoJSON export
- Coordinate-obscured export
- JSON backup / restore
- Optional offline raster PMTiles

---

## Current architecture

FieldScout is intentionally local-first:

- static frontend
- GitHub Pages deployment
- IndexedDB for local data
- Service Worker for PWA shell
- no account authentication
- no cloud sync
- no server-side database

The email entered at startup is only a **local profile key**. It is not an authenticated account.

For full documentation, see:

- [繁體中文 README](README_ZH.md)
- [English README](README_EN.md)
