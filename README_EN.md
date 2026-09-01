# FieldScout v1.1.1

FieldScout is a mobile-first, local-first biodiversity fieldwork PWA that connects data exploration, site scouting, Trip planning, navigation, and field records in one application.

[Open the live app](https://ychsiao-tw.github.io/FieldScout/) · [繁體中文說明](README_ZH.md) · [Repository](https://github.com/YCHsiao-TW/FieldScout)

> **Taxon search → occurrence review → candidate sites → Trip planning → field execution → specimen/observation records → export and backup**

## Quick start

1. Select a country or Global, choose the interface language, and enter an email to open a local workspace.
2. Search for a taxon in Explore, then review GBIF/iNaturalist occurrences, filters, and candidate sites.
3. Add occurrences, candidates, Custom Points, or GPX waypoints to a Trip.
4. Use Field to navigate one target at a time, update visit status, record a GPS Track, and create field records.
5. Export CSV/GeoJSON/GPX files and create Backup JSON regularly.

The five main pages have distinct roles:

| Page | Purpose |
|---|---|
| Explore | Search taxa, review and filter occurrences, inspect monthly activity, rank candidates |
| Trips | Create Trips, manage targets, order routes, navigate, import, and export |
| Field | Run the current Trip, navigate target by target, set visit status, record GPS Tracks |
| Records | Create and manage specimen/observation records and local photos |
| Settings | Language, specimen numbering, Backup/Restore, and local Profile management |

## Workspaces, countries, and language

- Select any ISO country or **Global (no country restriction)**.
- Non-Taiwan workspaces are separated by `email + country`, allowing one email to maintain independent country workspaces.
- Taiwan workspaces retain compatibility with the existing email-based local workspace.
- The email only derives a workspace ID in the current browser. It is not authentication and is not sent to a FieldScout-owned server.
- The interface supports Traditional Chinese and English. Language is independent of country and can be changed at startup or in Settings.
- Trips, records, photos, settings, and cache are stored in IndexedDB; there is no automatic cross-device synchronization.

## Explore and data sources

### Taxon resolution

- **GBIF taxonomy** supplies scientific-name matching and classification.
- **iNaturalist taxonomy** supplies autocomplete, scientific names, and common-name suggestions.
- **TaiCOL** assists name resolution only in Taiwan workspaces; it is not an occurrence source.

### Occurrence search

- GBIF is filtered with the selected ISO country code; Global omits the country filter.
- iNaturalist resolves the selected country to a Place and filters with `place_id`; Global omits the Place restriction.
- FieldScout automatically paginates through GBIF and iNaturalist instead of imposing its former 300/200-record application limits.
- Search progress reports fetched records, valid coordinates, and completion for each source, and the search can be cancelled at any time. Previous results are retained when a new search is cancelled before producing usable data.
- The [GBIF Search API](https://techdocs.gbif.org/en/openapi/v1/occurrence) has an official 100,000-record pagination ceiling. [iNaturalist API](https://www.inaturalist.org/pages/developers) availability remains subject to its service, rate limits, and network conditions. Use each source's formal download workflow for very large research datasets.
- The sources run independently, so one can remain usable if the other is temporarily unavailable.
- If the failed source has a complete prior cache, FieldScout marks it with `◷` and supplements the live response without overwriting that complete cache with a partial result.
- If neither source is reachable, FieldScout can load the most recent local occurrence cache.
- Coordinates outside valid latitude/longitude bounds are discarded during normalization.

### Merging and provenance

FieldScout performs a practical merge using scientific name, date, and coordinates rounded to about four decimal places. Merged records retain:

- GBIF/iNaturalist source labels and original-record URLs
- dataset name, UUID, URL, license, and recorder when supplied
- locality, event date, basis of record, and coordinate uncertainty
- source photos and media licenses
- obscured, withheld, and generalized-data indicators

This reduces screen duplication; it does not prove that records from separate platforms are biologically identical.

### Filtering, sorting, and display

Filters include:

- start/end date and month
- 1, 5, 10, 25, or 50 km radius when current GPS is available
- GBIF/iNaturalist source
- observation/preserved specimen
- maximum coordinate uncertainty
- records with photos
- locality/place text
- current map extent, reapplied after map movement or zoom

Sort by nearest distance, newest, oldest, best coordinate precision, or multi-source support. A 12-month chart displays record counts and can apply or clear a month filter; it does not represent biological abundance.

Map markers and occurrence cards remain synchronized and selected. The map progressively adds every filtered point in background batches instead of stopping at 200. To keep phones responsive, the list builds 200 cards at a time and loads the next batch near the bottom or through the Load more list records button. Separate map and list counts make their progress explicit; filters, monthly counts, candidate ranking, bulk Trip addition, and CSV/GeoJSON exports still use the complete loaded result set. The detail view exposes source images, metadata, licenses, sensitive-data flags, original records, and Google Maps.

## Candidate-site ranking

Occurrences are grouped into coordinate cells of about 0.01 degrees, producing up to 20 candidate sites with a separate Top 5. “Why recommended?” opens the score breakdown.

| Component | Maximum | Meaning |
|---|---:|---|
| Record density | 25 | Valid records in the candidate cell, logarithmically scaled |
| Recency | 20 | Newest valid record no later than the current year |
| Month support | 20 | Share matching the selected month; the current month is used when no filter is selected |
| Distance/access proxy | 15 | Straight-line distance from current GPS; a neutral default is used without GPS |
| Coordinate quality | 10 | True median of non-negative coordinate uncertainty; even samples average the two middle values |
| Multi-source support | 10 | One source earns 5 points; both GBIF and iNaturalist earn 10 |

Scores are constrained to 0–100. Invalid coordinates, future years, and invalid months cannot push a component beyond its range.

This is a field-scouting heuristic, not a Species Distribution Model. Do not interpret it as habitat suitability, occurrence probability, occupancy, or abundance.

## Maps and Custom Points

### Basemaps

- **OpenStreetMap** for roads, place names, and general context.
- **OpenTopoMap** for contours and terrain.
- **Esri World Imagery** for satellite interpretation of edges, farmland, valleys, and development.

Map tiles and Leaflet components require a network connection; FieldScout does not provide offline map packages.

### Persistent Custom Point Library

Custom Points remain in the current workspace and can be reused across Trips. Fields include name, latitude, longitude, point type, priority, target taxon, and notes.

Types include Scout site, Sampling site, Parking, Trailhead, Road/access, and Other. Priorities are High, Medium, and Low.

Coordinates can come from:

- current device GPS
- current map center
- map selection with a draggable marker
- manually entered latitude/longitude
- pasted coordinates such as `24.21783, 120.97621`

The Point Library supports map focus, editing, adding to the current Trip, and deletion. Edits synchronize to linked Trip Points. Deleting a library point preserves existing Trip Points as snapshots so past plans are not broken.

## Trips

A Trip Point may originate from an occurrence, candidate site, Custom Point, or GPX waypoint. Labels continue from A through Z to AA, AB, and so on; FieldScout itself does not limit the number of Trip Points.

### Trip Manager

- Create multiple named Trips, switch the active Trip, and rename it.
- Store target taxon, date, planned/active/completed state, and notes.
- Review target counts and linked field-record counts.
- Deleting a Trip preserves field records and clears their `tripId`/`tripPointId`, preventing dangling references.

### Targets and ordering

Each Trip Point supports `unvisited`, `arrived`, `surveyed`, `inaccessible`, and `revisit`, reflected in both the list and map marker.

Ordering controls include:

- a nearest-neighbor heuristic that starts from current GPS when available and reduces straight-line backtracking
- North-to-South order
- manual move up/down
- remove all targets while preserving and unlinking related records

Nearest-neighbor ordering is not road optimization. Google Maps performs road routing after the route is opened.

### Routes, import, and export

- Multi-stop Google Maps URLs are segmented by conservative stop count and URL length, with each new segment continuing from the preceding endpoint.
- Field uses one-target Google Maps navigation and is not constrained by multi-waypoint URL limits.
- Trips export to CSV, GeoJSON, and GPX waypoints.
- GPX waypoints can be imported into the current Trip.
- Trip CSV/GeoJSON preserves fields including source, customPointId, customType, priority, and visitStatus.

## Field

The Field page runs the active Trip:

- Switch Trips and A/B/C… targets; inspect coordinates, source, visit status, and linked-record count.
- Refresh device GPS and see positioning accuracy and straight-line distance to the target.
- Open one-target Google Maps navigation.
- Mark Arrived, Surveyed, Inaccessible, or Revisit.
- Track processed targets, a progress bar, and the next unfinished target; `surveyed` and `inaccessible` count toward progress.
- Start a quick field record pre-linked to the current Trip Point, with target taxon and coordinates prefilled, then return to Field after saving.
- Start and stop a GPS Track stored with the current Trip. Track points contain latitude, longitude, timestamp, and accuracy and export as GPX.

## Specimen and observation records

Each field record can store:

- specimen/record ID and count
- taxon, microhabitat, method, and notes
- latitude, longitude, and GPS accuracy
- country code, Trip, and Trip Point
- local photos
- created and updated timestamps

Records can be created, edited, deleted, focused on the map, opened in Google Maps, and viewed with their photos. Coordinates may come from current field GPS or the selected Trip Point; the two represent actual and planned locations respectively.

Saving a record linked to an `unvisited` or `arrived` target automatically changes that target to `surveyed`.

### Numbering and photos

- Settings defines a prefix and next counter. Automatic IDs are zero-padded to five digits, for example `ABARA05001`.
- Photos are resized in the browser to a maximum dimension of 1600 px, re-encoded as JPEG, and stored in IndexedDB. They are not uploaded automatically.

### QC

Current checks cover:

- missing specimen/record ID
- missing GPS or coordinates outside valid bounds
- GPS accuracy over 1000 m
- duplicate specimen/record IDs
- count below 1
- a Taiwan-range warning in Taiwan workspaces only

QC is an input check, not taxonomic validation or complete Darwin Core validation.

## Export, backup, and restore

### Data exports

| Data | Formats |
|---|---|
| Currently filtered occurrences | CSV, GeoJSON |
| Current Trip | CSV, GeoJSON, GPX waypoints |
| Field records | CSV, GeoJSON |
| GPS Track | GPX track |
| Obscured-coordinate records | CSV |

Every CSV field is quoted, and string values beginning with `=`, `+`, `@`, or a non-numeric `-` are neutralized to prevent spreadsheet formula execution. Negative numeric coordinates remain intact.

The obscured-coordinate CSV applies a user-selected radius and deterministic displacement derived from the Profile and record ID. The same record and radius produce the same result without modifying the original coordinates. This is a sharing aid, not a replacement for an institutional sensitive-species policy.

### Backup JSON

A backup contains the current Profile, settings, Custom Points, Trips, field records, photos, and occurrence cache. It does not include offline maps.

Restore performs the following safeguards:

1. Reject files larger than 100 MB.
2. Validate the version, Profile, data arrays, unique IDs, and photo data URLs.
3. Convert each photo and enforce a 15 MB per-photo limit.
4. After all validation succeeds, write settings, Trips, records, photos, and cache in one IndexedDB transaction; a failure cannot leave a half-imported backup.

Backups may contain an email, exact coordinates, specimen IDs, notes, photos, and unpublished sites. Treat them as sensitive research data and do not publish them directly.

## Local data and limitations

- FieldScout has no account server, backend database, or automatic cloud synchronization.
- Switching device or browser, and using Private Browsing, does not automatically restore a workspace.
- Clearing site data may delete IndexedDB. Export a backup and primary data formats before and after important fieldwork.
- Search, taxonomy, source images, map tiles, and Google Maps depend on network access and third-party services.
- Third-party downtime, rate limits, CORS changes, or API schema changes may temporarily disable one source.
- GBIF's official 100,000-record ceiling, iNaturalist service constraints, and records changing during a search can still make results differ from a source's formal database download.
- Distance is straight-line distance; GPS accuracy, source obscuring, and coordinate uncertainty all affect interpretation.
- Large photo collections consume browser storage, and iOS may manage storage quotas automatically.

Settings can switch Profiles or permanently delete the current Profile's settings, Trips, records, photos, and cache from this browser. Export a backup first.
