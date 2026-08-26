# FieldScout v0.9.2 — TBN Integration

**🚀 Open the App: <https://ychsiao-tw.github.io/FieldScout/>**

FieldScout is a mobile-first, local-first biodiversity field scouting, trip-planning, navigation, and field-recording PWA for Taiwan.

It still runs as a **pure GitHub Pages app without a Firebase backend**.

## Occurrence sources

v0.9.2 searches:

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

All previous v0.9.1 capabilities remain available, including split map/list view, map-to-list synchronization, clustering, multiple basemaps, local PMTiles, advanced filters, multiple trips, GPX, GPS tracks, local photos, QC, dashboard, and backup/restore.
