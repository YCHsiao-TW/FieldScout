# FieldScout v0.17.2

**Mobile-first biodiversity field scouting, trip planning, navigation, and field-recording PWA**

Live App:  
https://ychsiao-tw.github.io/FieldScout/

GitHub Repository:  
https://github.com/YCHsiao-TW/FieldScout

[繁體中文 README](README_ZH.md)

---

## v0.17.2 i18n Stable

Because v0.17.1 could still freeze on some iOS Safari sessions, v0.17.2 **removes the MutationObserver translation architecture entirely**. Translation is now explicit and targeted after UI rendering. No IndexedDB migration is required.


## v0.17.1 i18n Hotfix

Fixes an iOS Safari freeze that could occur when switching interface language in v0.17.0.

The translation `MutationObserver` could observe its own text writes. The old implementation rewrote `nodeValue` even when the translated target was already present, allowing a self-triggering observer loop.

v0.17.1:

- writes text only when current text differs from the target
- avoids redundant translated-attribute writes
- adds a language-switch busy guard
- caches `Intl.DisplayNames`
- renders dynamic sections only once after a language switch

No IndexedDB migration is required.


# v0.17.0 Bilingual UI

The same FieldScout application now supports:

- **Traditional Chinese**
- **English**

Country and interface language are independent. For example, a Japan workspace can use Traditional Chinese, while a Taiwan workspace can use English.

Language can be selected on the startup screen and changed later under:

**Settings → Language & interface**

The choice is stored as `settings.uiLanguage` and is included in backups.

Translation covers the main navigation, filters, Trips, Field workflow, record controls, visit statuses, candidate explanations, Custom Point tools, QC labels, and common runtime messages.

Biological/source data such as scientific names, localities, dataset names, specimen IDs, and user notes are not intentionally translated.

iNaturalist autocomplete follows the UI language (`zh-TW` or `en`).

Stored machine values remain language-independent.


## Contents

1. [What is FieldScout?](#1-what-is-fieldscout)
2. [Core features in v0.17.0](#2-core-features-in-v0160)
3. [Quick start](#3-quick-start)
4. [Country-scoped workspaces](#4-country-scoped-workspaces)
5. [Data sources and basemaps](#5-data-sources-and-basemaps)
6. [Explore](#6-explore)
7. [Candidate-site ranking](#7-candidate-site-ranking)
8. [Trips](#8-trips)
9. [Field](#9-field)
10. [Custom Point Library](#10-custom-point-library)
11. [Field records](#11-field-records)
12. [Export, backup, and sensitive data](#12-export-backup-and-sensitive-data)
13. [Local-first architecture](#13-local-first-architecture)
14. [Known limitations](#14-known-limitations)
15. [GitHub Pages deployment and updates](#15-github-pages-deployment-and-updates)

---

# 1. What is FieldScout?

FieldScout is a **mobile-first, local-first biodiversity fieldwork tool**.

It is not merely an occurrence viewer and it is not a Species Distribution Model. Its goal is to connect the practical workflow used before, during, and after fieldwork:

> **search a taxon → inspect occurrences → rank candidate sites → build a Trip → order the route → navigate in the field → record specimens / observations → export and back up the data**

The current release runs entirely as a static PWA on **GitHub Pages**. It does not require Firebase, a backend server, or authenticated user accounts.

The main pages are:

**Explore | Trips | Field | Records | Settings**

| Page | Role |
|---|---|
| Explore | taxon search, occurrences, filters, monthly chart, candidate sites |
| Trips | Trip management, targets, route ordering, GPX / CSV / GeoJSON |
| Field | navigation, target status, GPS Track, quick field recording |
| Records | specimen / observation records, GPS, photos, QC |
| Settings | local workspace, specimen numbering, backup / restore |

---

# 2. Core features in v0.17.0

## Country-scoped workspaces

Choose Taiwan, another ISO country, or Global when opening FieldScout.

Occurrence searches are scoped to that workspace.

## Persistent Custom Point Library

Reusable field sites can now be stored independently from Trips.

## Trip Manager

Rename, activate, inspect, create, and delete Trips from both Trips and Field.

## Dedicated Field page

Field execution is separated from planning.

## Satellite imagery

Available basemaps:

- OpenStreetMap
- OpenTopoMap
- Esri World Imagery

Legacy Offline PMTiles support has been removed.

---

# 3. Quick start

## Open a workspace

1. Select a country
2. Enter an email
3. Open FieldScout

This is **not account authentication**. The values only identify a local IndexedDB workspace.

## Search a taxon

In **Explore**:

1. enter a scientific or common name
2. choose an autocomplete result
3. run the search
4. review GBIF and iNaturalist occurrence records

## Build a Trip

From an occurrence or candidate card, choose:

**Add to Trip**

## Run the Trip

Open **Field**:

1. select the Trip
2. select the current A / B / C target
3. refresh GPS
4. open Google Maps navigation
5. mark arrival / surveyed / inaccessible / revisit
6. create a field record

---

# 4. Country-scoped workspaces

## Taiwan backward compatibility

Taiwan continues to use the legacy email-only workspace ID.

This preserves existing Taiwan:

- Trips
- records
- photos
- settings
- specimen counter
- occurrence cache

after upgrading to v0.16.0.

## Other countries

Other countries use:

`email + country`

to create separate local workspaces.

One email can therefore have separate Taiwan, Japan, Australia, or other workspaces.

## Global

Global removes the country filter and is useful for broad geographic exploration.

## Search behavior

### GBIF

Occurrence searches use an ISO 3166-1 alpha-2 country filter.

### iNaturalist

FieldScout resolves the selected country to an iNaturalist Place and then filters observations using `place_id`.

If iNaturalist place resolution fails temporarily, GBIF can still work independently.

### TaiCOL

TaiCOL participates in taxonomy/name matching only for Taiwan workspaces.

Other countries primarily use:

- GBIF taxonomy
- iNaturalist taxonomy

## QC

The Taiwan-specific geographic QC warning is only applied to Taiwan workspaces.

---

# 5. Data sources and basemaps

## GBIF

Used for:

- coordinates
- dates
- locality
- basis of record
- coordinate uncertainty
- dataset metadata
- source media when available

## iNaturalist

Used for:

- observations
- taxon autocomplete
- recent records
- source photos
- source links
- country Place filtering

## TaiCOL

Used for Taiwan name resolution and taxonomy assistance.

It is not the main occurrence source.

## TBIA / TBN

TBIA and TBN occurrence queries are not currently enabled in the static GitHub Pages release because browser-direct API access was not sufficiently reliable in earlier testing.

They can be reconsidered if FieldScout later gains a backend/API proxy.

## Basemaps

### OpenStreetMap

Best for roads and general map context.

### OpenTopoMap

Useful for terrain and mountainous fieldwork.

### Esri World Imagery

Useful for vegetation boundaries, roads, agriculture, streams, development, and landscape context.

FieldScout does not rely on undocumented Google satellite tile URLs.

---

# 6. Explore

Explore is responsible for data discovery and site selection.

## Occurrence cards

Merged GBIF / iNaturalist records may show:

- scientific name
- common name
- date
- locality
- coordinates
- uncertainty
- source
- basis of record
- dataset
- source image
- source link

## Basic deduplication

Records are merged using a combination of:

- scientific name
- date
- coordinates rounded to approximately four decimals

This is a workflow-level merge, not a guarantee that records are biologically identical.

## Marker ↔ list synchronization

Selected markers and cards remain highlighted until another record is selected or filtered out.

## Filters

Current filters include:

- date range
- month
- distance
- source
- basis of record
- maximum coordinate uncertainty
- photo availability
- locality text
- current map viewport

## Monthly occurrence chart

The 12-month chart displays occurrence record counts.

It is interactive:

- tap a month to filter
- tap it again to clear
- use All Months to reset

These are **record counts, not abundance estimates**.

---

# 7. Candidate-site ranking

Candidate sites use an explainable **fieldwork heuristic**, not an SDM.

Current score components:

| Component | Maximum |
|---|---:|
| occurrence density | 25 |
| recency | 20 |
| target-month support | 20 |
| distance / accessibility proxy | 15 |
| coordinate quality | 10 |
| multi-source support | 10 |

Total: 100.

Each candidate can open **Why recommended?** to inspect the score breakdown.

The distance component is straight-line distance from the current position. It is not road distance, walking time, or habitat suitability.

---

# 8. Trips

Trip Points may originate from:

- occurrences
- candidate sites
- custom points
- GPX waypoints

## Trip Manager

Edit Trips can:

- rename a Trip
- set it active
- show date
- show target count
- show linked record count
- create a Trip
- delete a Trip

Deleting a Trip removes the Trip and its targets but **preserves field records**. Their `tripId` / `tripPointId` links are cleared.

## Visit status

Trip Points support:

- `unvisited`
- `arrived`
- `surveyed`
- `inaccessible`
- `revisit`

## Route ordering

### Optimize order

Uses a nearest-neighbor heuristic.

When current GPS is available, ordering begins from the user's position.

This is not road-routing optimization.

### North → South

Sorts by latitude.

### Manual ordering

Targets can still be moved up or down.

## Remove all

All targets can be cleared from the active Trip without deleting field records.

## Google Maps routes

FieldScout Trips themselves have **no 10-point limit**.

Multi-stop Google Maps URLs are segmented conservatively according to stop count and URL length.

Field navigation uses one target at a time and is not affected by multi-waypoint limits.

## GPX

Supports:

- GPX waypoint import
- Trip GPX export
- GPS Track GPX export

---

# 9. Field

Field is the execution page for an active Trip.

It shows:

- current A / B / C target
- target name
- status
- coordinates
- source
- linked record count
- straight-line distance
- GPS accuracy
- Trip progress
- next unfinished target

Actions include:

- Google Maps navigation
- arrived
- surveyed
- inaccessible
- revisit
- previous target
- next target
- refresh GPS

## Quick field record

Selecting **+ Record**:

1. opens Records
2. binds the current Trip Point
3. prefills the Trip target taxon when available
4. uses the Trip Point coordinate
5. obtains the next specimen ID if the field is empty
6. returns to Field after saving

## GPS Track

GPS Track lives in Field rather than Trips.

Track points store:

- latitude
- longitude
- timestamp
- accuracy

and can be exported to GPX.

---

# 10. Custom Point Library

Custom Points are persistent workspace-level locations rather than one-off Trip Points.

## Stored fields

- name
- latitude
- longitude
- type
- priority
- target taxon
- notes
- country workspace

Types include:

- scout site
- sampling site
- parking
- trailhead
- access / road entrance
- other

Priority:

- high
- medium
- low

## Coordinate input

Coordinates can come from:

- current GPS
- current map center
- map click
- draggable marker refinement
- manual latitude / longitude
- pasted `lat, lon`

Example:

`24.21783, 120.97621`

## Reuse across Trips

One Custom Point can be added to multiple Trips.

Editing a linked library point updates its linked Trip Points.

Deleting the library point does **not** delete existing Trip Points. Those become independent snapshots.

---

# 11. Field records

Records may store:

- specimen / record ID
- count
- taxon
- microhabitat
- method
- notes
- latitude / longitude
- GPS accuracy
- photos
- Trip
- Trip Point
- country code
- timestamps

## Coordinate source

Records can use:

- live field GPS
- linked Trip Point coordinates

These should be understood differently:

- Trip Point = planned target
- live GPS = actual observation / collection position

## Trip Point ↔ Record

A record can be linked to a specific A / B / C target.

If an unvisited/arrived target receives a linked record, FieldScout marks it as surveyed.

## Specimen numbering

Settings can define:

- Prefix
- next counter

For example:

`ABARA` + `5001`

produces:

`ABARA05001`

## Photos

Photos are resized and re-encoded as JPEG in the browser before being stored in IndexedDB.

They are not automatically uploaded.

## QC

Current checks include:

- missing record ID
- missing GPS
- GPS accuracy > 1000 m
- duplicated specimen ID
- count < 1
- Taiwan-only geographic sanity check

---

# 12. Export, backup, and sensitive data

## Occurrences

Export:

- CSV
- GeoJSON

## Trips

Export:

- CSV
- GeoJSON
- GPX

Custom-point metadata may include:

- `customPointId`
- `customType`
- `priority`

## Records

Export:

- CSV
- GeoJSON
- obscured-coordinate CSV

## Sensitive coordinates

FieldScout can generate deterministic obscured coordinates without overwriting original GPS values.

## Backup JSON

Backup may include:

- local profile
- settings
- Custom Point Library
- Trips
- records
- photos
- occurrence cache

A backup can therefore contain sensitive field information such as precise coordinates, notes, specimen IDs, and photographs.

Treat backup files as **research data**, not public repository files.

---

# 13. Local-first architecture

FieldScout currently uses:

- static frontend
- GitHub Pages
- Leaflet
- IndexedDB
- Service Worker
- public APIs

It does not currently use:

- authenticated accounts
- cloud database
- automatic cloud sync
- server-side API proxy

IndexedDB stores include:

- `profiles`
- `settings`
- `trips`
- `records`
- `photos`
- `cache`

Custom Points are currently stored in:

`settings.customPoints`

The startup email is only a local workspace key. Changing device or browser does not synchronize data.

---

# 14. Known limitations

## Candidate ranking is not an SDM

Do not interpret the score as habitat suitability, abundance, occupancy, or occurrence probability.

## Route optimization is not road routing

Nearest-neighbor uses straight-line distances. Google Maps handles actual road navigation.

## Third-party APIs can fail

FieldScout depends on GBIF, iNaturalist, TaiCOL, and map providers.

Rate limits, outages, CORS changes, or API schema changes can temporarily affect functionality.

## iNaturalist country Place resolution

International iNaturalist searches require country-to-Place resolution.

If this fails, iNaturalist may be unavailable for that search while GBIF remains usable.

## Search result limits

The current release is intended for field scouting, not exhaustive database downloads.

Typical single-search caps are approximately:

- GBIF: 300
- iNaturalist: 200

## Browser storage

Large numbers of photos can consume significant IndexedDB storage, especially on iOS.

Export backups regularly.

---

# 15. GitHub Pages deployment and updates

Repository:  
https://github.com/YCHsiao-TW/FieldScout

Live site:  
https://ychsiao-tw.github.io/FieldScout/

## Files normally updated in the repository root

- `index.html`
- `app.js`
- `api.js`
- `db.js`
- `utils.js`
- `ranking.js`
- `styles.css`
- `sw.js`
- `manifest.webmanifest`
- `README.md`
- `README_ZH.md`
- `README_EN.md`

## Cache-busting test URL

After deploying v0.16.0:

`https://ychsiao-tw.github.io/FieldScout/?v=0172`

The query string is only for cache busting. It does not create a separate data workspace.

## Do not clear Safari site data casually

Clearing site data may also delete:

- IndexedDB
- Trips
- records
- photos
- settings
- Custom Point Library

Export a Backup JSON first if a full reset is ever necessary.

---

## Project layout

```text
FieldScout/
├── index.html
├── app.js
├── api.js
├── db.js
├── ranking.js
├── utils.js
├── styles.css
├── sw.js
├── manifest.webmanifest
├── README.md
├── README_ZH.md
└── README_EN.md
```

The legacy `offline/` directory is no longer required and has been removed.

---

## Design principles

FieldScout currently follows these principles:

1. prioritize real field workflows over feature accumulation
2. keep data local and inspectable
3. preserve provenance for public occurrence records
4. keep candidate ranking explainable
5. distinguish planned targets from actual field records
6. never overwrite original coordinates when generating obscured exports
7. keep the static GitHub Pages architecture simple until a backend is truly needed

FieldScout is best described as a:

> **biodiversity field scouting and field-recording decision-support tool**

rather than an SDM platform, automatic identification system, or cloud specimen database.
