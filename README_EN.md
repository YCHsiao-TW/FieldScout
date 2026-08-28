# FieldScout v0.9.7 — Entry Recovery

**🚀 Open the App: <https://ychsiao-tw.github.io/FieldScout/>**


## v0.9.7 stable sources and compact images

- removed TBIA occurrence queries
- removed TBN occurrence queries
- removed Taiwan Spider Society source filtering
- occurrence search now uses **GBIF + iNaturalist**
- TaiCOL remains available for name resolution
- occurrence thumbnails reduced to 56 × 56 px
- smaller map-popup images
- detail gallery limited to four compact thumbnails; tap to open the source image
- media-license metadata is retained

TBIA/TBN can be reconsidered later when a backend/API proxy is available.
## v0.9.7 entry recovery

This release removes the forced IndexedDB v1 → v2 upgrade from the critical entry path, stores offline PMTiles in the existing cache store, closes DB connections after transactions, reports blocked databases, falls back when MarkerCluster is unavailable, and uses network-first versioned JavaScript modules to avoid stale service-worker code.

## v0.9.7 route planner

The Trips screen is now route-first. Add A, B, C target sites from Explore and FieldScout renders the ordered route and generates a Google Maps multi-stop navigation link. Larger trips are split into practical route segments. Each site still has one-stop navigation, and Up/Down controls change the route order.

## v0.9.7 hotfix

All Add-to-Trip entry points now share a defensive trip workflow. If no trip exists, FieldScout automatically creates today's trip. Legacy trip data are normalized, coordinates are coerced to numbers, duplicates are reported, and errors are surfaced in the status bar.

FieldScout is a mobile-first, local-first biodiversity field scouting, trip-planning, navigation, and field-recording PWA for Taiwan.

It still runs as a **pure GitHub Pages app without a Firebase backend**.

## Occurrence sources

v0.9.7 searches:

- TBIA
- **Taiwan Biodiversity Network (TBN) Open API v2.6**
- GBIF
- iNaturalist

TBN records preserve dataset-level provenance and licensing metadata.

## Taiwan Spider Society

TBN's official spider-citizen-science dataset is:

**TBN-DP 臺灣蛛式會社 (蜘蛛公民科學調查)**

Dataset UUID:

`3edadeb1-36e6-4dc0-9a4c-8c6ca9c44618`

Records from this dataset receive both source tags:

- `TBN`
- `臺灣蛛式會社`

and can be filtered separately.

Original Taiwan Spider Society site:

<https://spider.tbn.org.tw/>

TBN dataset:

<https://www.tbn.org.tw/dataset/3edadeb1-36e6-4dc0-9a4c-8c6ca9c44618>

## Sensitive records

FieldScout respects TBN Open API's public-data generalization and obscuring.

It does not attempt to reconstruct coordinates that TBN intentionally withholds or generalizes.

TBN records without public coordinates are not plotted.

## Export provenance

Occurrence CSV / GeoJSON now preserve:

- dataset UUID
- dataset name
- dataset URL
- license
- sensitive category
- data-generalization flag
- original source URLs

## TBN result limit

TBN API v2.6 supports up to 1000 records per response.

The current static FieldScout release retrieves the first 1000 TBN records for a taxon and reports when more records exist. A future backend can implement robust pagination and caching.

## Other features

All previous v0.9.7 capabilities remain available, including split map/list view, map-to-list synchronization, clustering, multiple basemaps, local PMTiles, advanced filters, multiple trips, GPX, GPS tracks, local photos, QC, dashboard, and backup/restore.
