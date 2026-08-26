# FieldScout v0.9.0 — GitHub Pages Stable Edition

FieldScout is a mobile-first biodiversity field scouting, trip-planning,
navigation, and field-recording tool for Taiwan.

This release is intended as the **final stable static edition before a future backend**.

## Local profiles

Users enter an email address when FieldScout opens.

Within the same browser/device:

- the same email opens the same trips, field records, photos, settings, and cache
- different emails have independent local workspaces

This is **not authentication**. The email is only a local IndexedDB profile key.
Cross-device synchronization requires a future backend.

## Major features

### Map and search

- fixed split-screen map + list
- marker ↔ list-card linking
- Leaflet marker clustering
- unrestricted taxa
- TaiCOL / TBIA / GBIF / iNaturalist
- simultaneous TBIA + GBIF + iNaturalist occurrence queries
- deduplication and multi-source tags
- taxonomy autocomplete
- date/month/radius/source/basis/uncertainty/photo filters
- sorting by distance, date, coordinate quality, or multi-source support
- seasonal occurrence summary
- candidate-site Ranking v2

### Trips

- multiple named trips
- date, target taxon, status, notes
- occurrence / candidate / custom map-center points
- add-all filtered points
- visit states
- arrival time and arrival distance
- Google Maps navigation
- CSV / GeoJSON / GPX export
- GPX waypoint import
- GPS track recording + GPX export

### Field records

- IndexedDB persistence
- create / edit / delete
- specimen ID, count, taxon, microhabitat, method, notes
- GPS and accuracy
- local photos
- batch collection-site mode
- automatic specimen numbering
- QC checks
- CSV / GeoJSON
- obscured-coordinate CSV export

### Dashboard

- trip count
- trip-point count
- visited points
- field-record count
- taxon count
- median GPS accuracy
- 12-month occurrence bar chart
- QC summary

### Backup / restore

Complete JSON backup includes:

- profile
- settings
- trips
- field records
- local photos
- occurrence cache

## Offline

Current offline support includes:

- PWA shell caching
- IndexedDB data
- locally saved photos and occurrence cache
- optional raster PMTiles basemap

A Taiwan PMTiles archive is intentionally not bundled.

## Limitations

Because this is still a pure GitHub Pages application:

- TBIA may be affected by browser CORS
- email profiles are not real authentication
- no automatic cross-device synchronization
- no shared projects
- no cloud photos
- no community database
- no server-side sensitive-coordinate handling
- no reliable server-side API aggregation

These features are reserved for a future Firebase/backend release.

## Deployment

Deploy repository root through:

`Settings → Pages → Deploy from a branch → main → /(root)`

## Future backend

The next major architecture can add:

- Firebase Authentication
- Firestore synchronization
- Cloud Storage
- API proxy
- shared projects
- community records
- private/public coordinate separation

The current frontend field workflow can be retained.
