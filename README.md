# FieldScout v0.16.0

> **Mobile-first biodiversity field scouting, trip planning, navigation, and field-recording PWA**  
> **以手機為優先的生物多樣性探點、行程規劃、野外導航與採集紀錄工具**

**Live App / 線上版**  
https://ychsiao-tw.github.io/FieldScout/

**Repository / 原始碼**  
https://github.com/YCHsiao-TW/FieldScout

[繁體中文完整說明](README_ZH.md) · [Full English documentation](README_EN.md)

---

## What FieldScout does / FieldScout 做什麼

FieldScout connects the whole fieldwork workflow in one local-first web app:

**taxon search → occurrence review → candidate-site ranking → Trip planning → Field execution → specimen / observation records → export / backup**

**物種搜尋 → occurrence 檢視 → 候選探點排名 → 行程規劃 → 野外執行 → 標本／觀察紀錄 → 匯出／備份**

The current release runs as a static PWA on **GitHub Pages**. No Firebase, server-side database, or account login is required.

---

## v0.16.0 at a glance

- **Country-scoped workspaces** — choose Taiwan, another country, or Global at startup.
- **GBIF + iNaturalist occurrence search** scoped to the selected country.
- **TaiCOL name resolution for Taiwan workspaces**; other countries use GBIF + iNaturalist taxonomy.
- **Explore** — filters, monthly occurrence chart, candidate ranking, source images.
- **Trips** — multiple named Trips, Trip Manager, route ordering, GPX/CSV/GeoJSON.
- **Field** — current target, status, GPS distance, Google Maps navigation, GPS Track.
- **Records** — specimen / observation records, photos, GPS, QC, Trip Point linking.
- **Custom Point Library** — reusable field sites with GPS / map-click / manual coordinates.
- **Basemaps** — OpenStreetMap, OpenTopoMap, Esri World Imagery.
- **Local-first storage** — IndexedDB, JSON backup / restore, no automatic cloud sync.

---

## Important concepts

### Local workspace, not an account

The startup email is **not authentication**. It is used only to derive a local workspace key in this browser.

- Taiwan keeps the legacy email-only workspace ID for backward compatibility.
- Other countries use `email + country`.
- Changing device/browser does not automatically sync data.
- Clearing browser site data may delete Trips, records, photos, and settings.

### Candidate ranking is not an SDM

Candidate sites are ranked with a fieldwork heuristic using occurrence density, recency, month support, distance, coordinate quality, and multi-source support.

It is a **decision-support score**, not habitat suitability or a Species Distribution Model.

---

## Recommended update workflow

When replacing files on GitHub Pages, upload the current release files to the repository root.

After deployment, use a cache-busting URL to confirm the new version:

`https://ychsiao-tw.github.io/FieldScout/?v=0160`

Do **not** clear Safari site data just to refresh the UI unless you have exported a backup first, because IndexedDB data may be removed.

---

## Documentation

For installation, workflow details, exports, privacy, limitations, and architecture:

- [繁體中文完整 README](README_ZH.md)
- [Full English README](README_EN.md)
