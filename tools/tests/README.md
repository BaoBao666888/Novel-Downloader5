# Userscript Regression Tests

Run all offline tests from the repository root:

```bash
node --test tools/tests/*.test.cjs
```

## Novel Downloader

`nd-reader-rules.test.cjs` covers issue #32, the old/new reader domains,
catalog URL resolution and deduplication, page titles and missing catalogs.
It also tests the production content extraction and download callback to ensure
missing selectors and failed content checks never persist whole error pages.
DOM fixtures do not replace live checks of book metadata, full catalogs and
sample pages through Debug Bridge.

## TM Translate

Run the focused offline suite from the repository root:

```bash
node --test tools/tests/tm-translate.test.cjs tools/tests/tm-ner-engines.test.cjs
```

These tests do not contact NER services or download models. They cover Name
matching/casing, reader/export parity, engine parsers, Unicode input limits,
BERT windowing/BIO aggregation, HanLP pacing and quota handling, cancellation,
model integrity rejection and transport fallback.

Worker lifecycle tests use fixtures. They are not a substitute for real model
inference in a browser. Before releasing changes to an engine, also verify real
inference, model cache reuse, cancellation/restart, the Name review/save flow
and TXT/EPUB/HTML exports with isolated test data. Do not intentionally exhaust
an online provider's quota. Use fixtures for 429 and authorization failures.
