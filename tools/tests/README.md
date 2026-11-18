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

`tm-selection-ocr.test.cjs` covers selection-only replacement, pointer selection
preservation, unchanged surrounding text, stale DOM rejection and OCR message/
image normalization. It also checks the helper's source and release asset manifest.
`tm-mobile-package.test.cjs` covers unsupported screen-capture fallback, pointer
input, single-thread runtime configuration, checksums and safe asset restoration.
The offline suite does not require model/WASM binaries in the Git checkout.
Also test real recognition through
both external messaging and the page/content-script bridge after reloading the
unpacked extension in Chrome.

For OCR without the helper, test actual model inference with extension detection
disabled, including environments without OffscreenCanvas/SharedArrayBuffer.
API simulation and a narrow browser viewport are not real phone/device testing.

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
