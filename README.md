# FieldScout v0.9.2 — TBN Integration

> **Taiwan Biodiversity Field Scouting Tool / 臺灣生物多樣性野外探點工具**

**🚀 Live App:** [https://ychsiao-tw.github.io/FieldScout/](https://ychsiao-tw.github.io/FieldScout/)

[繁體中文](README_ZH.md) | [English](README_EN.md)

FieldScout is a mobile-first, local-first biodiversity field scouting, trip-planning, navigation, and field-recording PWA for Taiwan.

## v0.9.2

Occurrence sources now include:

- TBIA
- **TBN — Taiwan Biodiversity Network API v2.6**
- GBIF
- iNaturalist

TBN records preserve dataset-level metadata including dataset UUID/name, license, source links, coordinate uncertainty, and sensitive-data indicators.

Records belonging to the official TBN dataset:

**TBN-DP 臺灣蛛式會社 (蜘蛛公民科學調查)**  
Dataset UUID: `3edadeb1-36e6-4dc0-9a4c-8c6ca9c44618`

are additionally labelled:

**`TBN · 臺灣蛛式會社`**

and can be filtered separately.

FieldScout respects TBN's public-API generalization/obscuring of sensitive biodiversity records and does not attempt to reconstruct hidden coordinates.

Full documentation:

- [繁體中文](README_ZH.md)
- [English](README_EN.md)
