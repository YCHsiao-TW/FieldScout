# FieldScout v0.12.0

**Mobile-first biodiversity field scouting, route planning, navigation, and field recording for Taiwan**

**🚀 Open the App:**  
https://ychsiao-tw.github.io/FieldScout/

## v0.9.8 runtime hotfix

Fixes a malformed JavaScript fragment left in `renderTaxon()` in v0.9.7. The syntax error prevented the ES module from parsing and stopped FieldScout from booting. Service-worker and module cache versions are also bumped.

[繁體中文 README](README_ZH.md)

---

## v0.12.0 Field Mode

- removed the Dashboard tab
- top navigation is now Explore / Trips / Records / Settings
- moved the interactive monthly occurrence chart into Explore
- visible record counts for every month
- tapping a month applies/removes the month filter
- added an All months reset button
- the chart now appears before the Top 5 candidate sites for field-planning context


## 1. What is FieldScout?

FieldScout is a mobile-first, local-first Progressive Web App designed to support biodiversity fieldwork.

Its primary workflow is:

**search taxon → inspect occurrence records → rank candidate sites → add field targets → plan route → navigate → record observations/specimens → export data**

The current release runs entirely on **GitHub Pages** and does not require Firebase or a backend.

---

## 2. Live App

FieldScout:

https://ychsiao-tw.github.io/FieldScout/

Repository:

https://github.com/YCHsiao-TW/FieldScout

---

## 3. Current data sources

### TaiCOL

Used for:

- taxonomic name resolution
- scientific-name matching
- taxonomy assistance

TaiCOL is not currently used as the main occurrence source.

### GBIF

Used for public Taiwan occurrence records, including:

- coordinates
- dates
- basis of record
- coordinate uncertainty
- dataset metadata
- source media when available

### iNaturalist

Used for:

- Taiwan occurrence records
- taxon autocomplete
- recent observations
- original observation photos
- source observation links

### Maps

Available basemaps:

- OpenStreetMap Standard
- OpenTopoMap
- CyclOSM
- optional offline raster PMTiles

### TBIA / TBN

TBIA and TBN occurrence queries are currently disabled in the static GitHub Pages release.

The issue is not the value of those datasets. Direct browser access was not sufficiently reliable in real use, particularly because static frontends remain dependent on third-party CORS and API behavior.

The current strategy is:

> **keep the stable GBIF + iNaturalist occurrence workflow.**

TBIA and TBN can be reconsidered when a backend/API proxy is introduced.

---

## 4. Taxon search

FieldScout is not restricted to spiders.

It can be used for:

- spiders
- insects
- amphibians
- reptiles
- fish
- plants
- other taxa

Search results combine public occurrence records from GBIF and iNaturalist with basic deduplication.

Occurrence cards may contain:

- scientific name
- common name
- date
- locality
- coordinates
- coordinate uncertainty
- source
- dataset
- basis of record
- original source link
- source image when available

---

## 5. Map interface

FieldScout uses a mobile-first split-screen layout:

- upper section: map
- lower section: independently scrollable controls and lists

### Marker clustering

Large occurrence sets are clustered automatically to reduce map clutter.

### Marker ↔ list synchronization

Tapping a map marker:

1. finds the matching occurrence card
2. scrolls it into view
3. highlights the card
4. opens the marker popup

Tapping **Map** on a record card:

1. centers the map
2. opens the matching popup
3. highlights the card

### Marker popup actions

Popups provide:

- Google Maps navigation
- Add to trip
- compact source-image preview when available

---

## 6. Candidate-site ranking

Candidate sites are generated using a **heuristic ranking**, not a Species Distribution Model.

The current ranking considers:

- occurrence density
- recency
- target-month support
- distance from the current location
- coordinate uncertainty
- multi-source support

The interface prioritizes:

## Top 5 recommended candidate sites

The top five candidates are pinned above the raw occurrence list.

Remaining candidates are available under an expandable:

**Other candidate sites**

The ranking is intended for field scouting and decision support. It should not be interpreted as a formal habitat-suitability model.

---

## 7. Filters and sorting

Occurrence records can be filtered by:

- start date
- end date
- month
- distance radius
- source
- basis of record
- maximum coordinate uncertainty
- photo availability

Sorting options include:

- nearest first
- newest first
- oldest first
- best coordinate precision
- stronger multi-source support

---

## 8. Interactive monthly occurrence chart

The Dashboard summarizes occurrence records by month.

Each month displays:

- month
- record count
- relative bar height

The chart is interactive:

- tap a month → return to Explore and apply that month filter
- tap the selected month again → clear the filter

This chart represents **occurrence record counts**, not biological abundance.

---

## 9. Source images

When GBIF or iNaturalist exposes public source media, FieldScout shows compact previews.

Current image UI:

- occurrence card: 56 × 56 px thumbnail
- marker popup: compact preview
- occurrence details: up to four thumbnails
- tap thumbnail: open the original source image

FieldScout preserves media-license metadata whenever possible.

Images remain the property of their original providers and should be reused according to the source license.

---

## 10. Field Trips

Any occurrence or candidate site can be added to a Field Trip.

If no trip exists, FieldScout automatically creates a trip for the current date.

Trips can include:

- occurrence records
- candidate sites
- custom points
- GPX waypoints

---

## 11. Route planning

Trip targets are displayed as an ordered route:

A → B → C → D

FieldScout generates a Google Maps multi-stop route from that order.

### Route sorting

Two quick sorting modes are available:

**North → South**

Sorts targets by latitude from north to south.

**Nearest → Farthest**

Uses the current GPS position and sorts targets by straight-line distance.

Manual **Up / Down** controls remain available for fine adjustment.

Google Maps uses the resulting FieldScout order as its waypoint order.

Large trips are automatically split into multiple route segments when necessary.

---

## 12. Google Maps navigation

Each target has a single-point navigation link.

The entire trip can also open as a multi-stop route.

Google Maps uses:

- current location as origin
- the final FieldScout point as destination
- preceding FieldScout points as ordered waypoints

---

## 13. GPX

FieldScout supports:

### GPX import

Import existing waypoints into the current trip.

### GPX export

Export:

- Field Trip waypoints
- recorded GPS tracks

These files can be used in:

- QGIS
- Garmin software
- GPX viewers
- GIS workflows

---

## 14. GPS track recording

FieldScout can record a field GPS track.

Track points include:

- latitude
- longitude
- timestamp
- GPS accuracy

Tracks can be exported as GPX.

---

## 15. Local Profiles

FieldScout asks for an email address at startup.

The email creates a **Local Profile**.

Within the same browser/device, entering the same email reopens the same:

- Trips
- field records
- local photos
- settings
- specimen counter
- occurrence cache

Different emails create independent local workspaces.

### Important limitation

This is not authentication.

FieldScout does not verify the email address and does not send it to its own server.

Therefore:

- changing devices does not synchronize data
- changing browsers does not synchronize data
- clearing browser site data may remove local data

Real authentication and cross-device synchronization require a future backend.

---

## 16. IndexedDB

FieldScout stores its main local data in IndexedDB.

IndexedDB is used for:

- profiles
- settings
- trips
- field records
- photos
- occurrence cache
- offline map data

This provides more capacity and better structured-data support than relying entirely on localStorage.

---

## 17. Field records

FieldScout can create local specimen or observation records.

Fields include:

- specimen / record ID
- taxon
- count
- microhabitat
- collection / observation method
- notes
- GPS
- GPS accuracy
- photo
- timestamps

Records can be:

- created
- edited
- deleted

---

## 18. Batch collection-site mode

When collecting many specimens at one locality, FieldScout can start a shared collection site.

The app records GPS once.

Subsequent specimen records can reuse that location instead of acquiring GPS for every individual record.

---

## 19. Automatic specimen IDs

Users can configure:

- prefix
- next counter value

Example:

Prefix:

`ABARA`

Next number:

`5001`

Generated IDs:

`ABARA05001`

`ABARA05002`

`ABARA05003`

---

## 20. Local photos

Field-record photos are processed in the browser.

They are:

1. re-encoded as JPEG
2. resized
3. saved into IndexedDB

They are not uploaded automatically.

---

## 21. Data-quality checks

FieldScout performs basic QC on local field records.

Current checks include:

- missing specimen ID
- missing GPS
- excessive GPS uncertainty
- coordinates possibly outside Taiwan
- duplicate specimen IDs
- invalid counts

The Dashboard summarizes detected issues.

---

## 22. Export

### Occurrence records

- CSV
- GeoJSON

### Field records

- CSV
- GeoJSON
- obscured-coordinate CSV

### Trips

- CSV
- GeoJSON
- GPX

---

## 23. Sensitive coordinates

FieldScout can export field records with obscured coordinates.

For example:

`1000 m`

FieldScout generates deterministic offset coordinates while preserving the original local record.

This is useful for preliminary sharing of sensitive biological records.

---

## 24. Backup and restore

FieldScout can export a complete:

**FieldScout Backup JSON**

The backup contains:

- Local Profile
- settings
- trips
- field records
- local photos
- occurrence cache

The backup can later be imported to restore the workspace.

Until cloud sync exists, regular backups are recommended.

---

## 25. Offline support

FieldScout is a PWA.

Current offline capabilities include:

- app shell
- saved Trips
- field records
- local photos
- occurrence cache
- optional raster PMTiles

### Offline PMTiles

Users can import their own:

`.pmtiles`

through:

**Settings → Offline map**

The repository does not bundle a Taiwan basemap because:

- map licensing varies
- large archives do not belong in the repository
- users may require different zoom levels and regions

---

## 26. GitHub Pages deployment

Repository:

https://github.com/YCHsiao-TW/FieldScout

In GitHub:

**Settings → Pages**

Select:

`Deploy from a branch`

Branch:

`main`

Folder:

`/(root)`

Live URL:

https://ychsiao-tw.github.io/FieldScout/

---

## 27. Current architecture

```text
FieldScout
│
├── GitHub Pages
│
├── HTML / CSS / JavaScript
│
├── Leaflet
│   ├── OSM
│   ├── OpenTopoMap
│   ├── CyclOSM
│   └── PMTiles
│
├── Taxonomy
│   ├── TaiCOL
│   ├── GBIF
│   └── iNaturalist
│
├── Occurrence
│   ├── GBIF
│   └── iNaturalist
│
├── IndexedDB
│   ├── Local Profiles
│   ├── Trips
│   ├── Records
│   ├── Photos
│   └── Cache
│
└── Google Maps navigation
```

---

## 28. Current limitations

Because FieldScout currently runs as a static GitHub Pages app:

- no real account authentication
- no cross-device synchronization
- no multi-user collaboration
- no cloud photo storage
- no central community database
- no server-side API proxy
- no server-side coordinate privacy
- no server-side cache
- third-party APIs remain dependent on CORS and external service availability

---

## 29. Future backend

A future Firebase-based architecture can add:

### Authentication

- Google login
- Gmail account authentication

### Firestore

- cloud Trips
- field records
- settings
- shared projects

### Cloud Storage

- field photos
- specimen photos
- habitat photos

### Firebase Functions / API proxy

This would be the appropriate place to reconsider TBIA and TBN.

A backend proxy can provide:

- stable server-side API requests
- caching
- normalization
- pagination
- CORS handling
- rate-limit management

### Community features

Possible future features include:

- public records
- shared projects
- contributor attribution
- moderation
- sensitive-coordinate policies

---

## 30. Project scope

FieldScout is not:

- a Species Distribution Model
- an automated taxonomic identification system
- an official biodiversity database
- a navigation service itself

FieldScout is:

> **an interface that turns public biodiversity records into practical field scouting, route planning, navigation, and recording workflows.**

Candidate-site ranking should be interpreted as fieldwork decision support rather than ecological-model output.

---

## 31. Version

Current release:

**FieldScout v0.12.0**

Current architecture:

**Static / GitHub Pages / Local-first**

A future major release can introduce the backend layer.
