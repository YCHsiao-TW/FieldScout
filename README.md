# FieldScout

**FieldScout** is a mobile-first biodiversity field scouting and field-recording web application for Taiwan.

It is designed for researchers, students, citizen scientists, and field workers who want to move from:

**finding biodiversity records → choosing field sites → navigating to sites → recording field observations/collections → exporting data**

FieldScout runs directly in a mobile browser and can be installed to the iPhone or Android home screen as a PWA.

Live site:

https://ychsiao-tw.github.io/FieldScout/

---

## Current version

**v0.5.0**

FieldScout is no longer restricted to spiders.

You can search for any biological taxon supported by the connected biodiversity databases, including animals, plants, fungi, and other taxa.

Examples:

- *Pardosa pseudoannulata*
- *Bufo bankorensis*
- *Formosanus* spp.
- 臺灣獼猴
- 山羌
- 臺灣百合
- 黑面琵鷺

---

## Main features

### 1. Multi-source taxon search

FieldScout accepts scientific names or common names.

The current search workflow uses multiple biodiversity services:

1. **TaiCOL** — taxonomic name resolution for Taiwan
2. **TBIA** — Taiwan biodiversity occurrence data
3. **GBIF** — international biodiversity occurrence data
4. **iNaturalist** — recent observation records

The application attempts to resolve the searched name first and then retrieves occurrence records for Taiwan.

If one browser-accessible API fails, FieldScout can fall back to another source.

---

### 2. Occurrence map

Search results are displayed on an interactive map.

Each occurrence record can show:

- scientific name
- locality
- event / observation date
- data source
- latitude and longitude
- coordinate uncertainty when available
- basis of record when available

Users can switch between:

- all Taiwan records
- records within 1 km
- records within 5 km
- records within 10 km
- records within 25 km

around the current GPS location.

---

### 3. One-click trip planning

Occurrence records can be added to a field trip individually or in bulk.

The **Add all to trip** function adds all occurrence records currently visible under the selected distance filter.

Duplicate records are automatically skipped.

---

### 4. Candidate field-site ranking

FieldScout groups nearby occurrence records and produces candidate field sites.

The current ranking is a transparent heuristic based on:

- local occurrence density
- record recency
- distance from the current GPS location

The ranking score is intended as a field-planning aid, not as a species distribution model.

---

### 5. Google Maps navigation

Any point with valid coordinates can open directly in Google Maps.

Navigation links are available for:

- occurrence records
- candidate field sites
- trip points
- field collection records

This makes FieldScout usable as a bridge between biodiversity databases and real field navigation.

---

### 6. Field collection / observation records

Users can create field records directly on their phone.

Current fields include:

- specimen ID
- count
- taxon
- microhabitat
- collection method
- notes
- GPS latitude
- GPS longitude
- GPS accuracy
- created time
- updated time

Field records can be:

- created
- edited
- updated
- deleted
- shown on the map
- opened in Google Maps

Existing records are stored locally in the browser.

---

### 7. Data export

FieldScout currently supports CSV and GeoJSON export.

#### Search results

Search occurrence records can be exported as:

- CSV
- GeoJSON

Exported fields include:

- occurrence ID
- scientific name
- locality
- event date
- latitude
- longitude
- source
- basis of record
- coordinate uncertainty
- source URL

#### Field records

Field collection / observation records can be exported as:

- CSV
- GeoJSON

#### Trip points

Trip points can also be exported as:

- CSV
- GeoJSON

---

## Mobile use

FieldScout is designed primarily for smartphones.

Open:

https://ychsiao-tw.github.io/FieldScout/

On iPhone:

**Safari → Share → Add to Home Screen**

FieldScout can then be opened like a normal mobile app.

GPS access requires HTTPS, which GitHub Pages provides.

---

## Offline behavior

FieldScout currently provides partial offline support through a service worker.

The application interface can be cached, and field records remain stored locally in the browser.

However:

- biodiversity API queries still require internet access
- OpenStreetMap tiles currently require internet access

A future version is planned to support offline Taiwan map packages.

---

## Data storage

Current versions store user-created data in browser `localStorage`.

This means:

- records remain on the same browser/device
- no account is required
- no central database currently receives private field records
- clearing browser storage may remove locally stored records

Users should periodically export important field records.

Cloud synchronization is planned for a future version.

---

## External data and licensing

FieldScout does not claim ownership of records retrieved from external biodiversity databases.

Occurrence data remain subject to the licenses and attribution requirements of their original providers.

Potential sources include:

- Taiwan Biodiversity Information Alliance (TBIA)
- Taiwan Catalogue of Life (TaiCOL)
- Global Biodiversity Information Facility (GBIF)
- iNaturalist

FieldScout should preserve source information whenever records are displayed or exported.

---

## Current limitations

FieldScout is still an early-stage field research prototype.

Current limitations include:

- TBIA browser requests may be affected by CORS
- API availability depends on external services
- search results are currently limited to the number returned by live browser queries
- candidate-site ranking is heuristic
- no full species distribution modelling yet
- no account system
- no cloud synchronization
- no collaborative projects
- no full offline basemap
- no automatic environmental-layer analysis
- no sensitive-species coordinate policy yet

---

# Roadmap

## High-priority next features

### 1. Search filters

Add filters for:

- date range
- month / season
- record source
- observation vs specimen
- records with photos
- coordinate uncertainty
- elevation range
- county / municipality

This is one of the highest-priority improvements because it directly improves field-site selection.

---

### 2. Better taxonomic search UI

Add autocomplete while typing.

Display:

- accepted scientific name
- common name
- taxonomic rank
- family / order
- TaiCOL taxon ID
- synonym information

This would reduce searches caused by spelling mistakes and synonyms.

---

### 3. Environmental information for each point

Automatically retrieve environmental context for occurrence and candidate sites.

Potential variables:

- elevation
- slope
- aspect
- land cover
- temperature
- precipitation
- vegetation
- distance to stream
- distance to road / trail

---

### 4. Advanced candidate-site ranking

Future versions could offer multiple ranking modes.

#### Target mode

> Where am I most likely to find this taxon?

Possible factors:

- occurrence density
- recent observations
- seasonal match
- habitat similarity
- elevation match
- accessibility

#### Exploration mode

> Where would collecting new data be most informative?

Possible factors:

- geographic sampling gaps
- environmental sampling gaps
- low historical sampling intensity
- distance from known records
- habitat similarity

---

### 5. Offline Taiwan map

Provide downloadable Taiwan map packages using vector tiles / PMTiles.

The goal is:

- open FieldScout before entering the field
- download a field region
- keep using the map without mobile signal

---

### 6. Field-trip management

Instead of a single "today trip", support saved projects such as:

- Trip name
- date
- target taxa
- team members
- planned sites
- visited sites
- trip notes

Users could reopen previous trips and duplicate them for future surveys.

---

### 7. Photos and media

Allow photos to be attached to field records.

Potential use cases:

- habitat photograph
- specimen photograph
- live individual photograph
- collection-site photograph
- voucher label photograph

---

### 8. Import

Allow users to import:

- CSV
- GeoJSON
- GPX

This would allow users to bring existing laboratory or GIS field points into FieldScout.

---

### 9. GPX support

Add:

- GPX export
- GPX import
- route / track recording

This would improve compatibility with handheld GPS units and GIS software.

---

### 10. Cloud sync and accounts

Optional user accounts could provide:

- cross-device synchronization
- backup
- shared projects
- team field trips
- collaborative records

Local-only mode should remain available for privacy-sensitive work.

---

### 11. Data-quality checks

Field records could automatically flag:

- missing coordinates
- low GPS accuracy
- duplicate specimen IDs
- impossible dates
- coordinates outside Taiwan
- taxon names that cannot be resolved

---

### 12. Sensitive coordinates

Future public/community versions should support coordinate sensitivity.

Possible fields:

- private latitude / longitude
- public latitude / longitude
- coordinate uncertainty
- sensitive flag
- obscuring radius

External records that are already obscured should never be reverse-engineered.

---

### 13. Community records

A future public FieldScout could allow users to submit records.

Possible workflow:

1. user submits record
2. automatic validation
3. evidence requirement
4. publication to public map
5. attribution and license metadata

Community records should remain clearly separated from external database records.

---

## Suggested architecture for later versions

Current GitHub Pages versions are intentionally lightweight and serverless.

A larger FieldScout could use:

### Frontend

- TypeScript
- React
- MapLibre GL JS
- PWA
- IndexedDB

### Backend

- Python
- FastAPI

### Database

- PostgreSQL
- PostGIS

### Data sources

- TaiCOL
- TBIA
- GBIF
- iNaturalist
- additional biodiversity databases

This would allow FieldScout to support large datasets, spatial analysis, user accounts, synchronization, and more advanced site-ranking models.

---

## Project philosophy

FieldScout is intended to be a **field decision-support tool**, not simply another biodiversity map.

The central workflow is:

```text
search biodiversity data
        ↓
understand known distribution
        ↓
identify candidate field sites
        ↓
navigate to the field
        ↓
collect / observe
        ↓
record evidence and coordinates
        ↓
export reusable research data
```

The long-term goal is to connect biodiversity databases, field planning, and field data collection in one mobile-first workflow.

---

## Development status

FieldScout is under active development.

Current version:

**v0.5.0**

Primary deployment:

**GitHub Pages**

https://ychsiao-tw.github.io/FieldScout/

---

## License

A software license has not yet been finalized.

Before public release or external contribution, the repository should adopt an explicit open-source license such as MIT, Apache-2.0, or another license appropriate for the project.

External biodiversity data retain their original licenses and attribution requirements.
