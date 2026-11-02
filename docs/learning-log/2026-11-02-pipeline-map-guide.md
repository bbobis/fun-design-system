## 2026-11-02 — Pipeline Map how-to guide

- **Built:** `docs/pipeline-map.md`, a guide for app developers. It covers the `PipelineNetwork` data shape, a `toNetwork()` mapping example, wiring the map, legend and table with one shared selection, the gotchas, label placement, and the keyboard map.
- **Remember: a guide documents the traps, not the props.** JSDoc already lists the props. The guide is for the things that fail silently: shared ids across facilities and segments, a segment with an unknown `from`/`to` that just isn't drawn, batches that must be listed downstream-first, and a `products` order that changes colors if it isn't fixed.
- **Remember: keep the backend mapping in one function (an anti-corruption layer).** It's like a Spring DTO → domain mapper. The component only knows `PipelineNetwork`, so swapping Spring for .NET changes `toNetwork()` and nothing else.
- Docs: https://learn.microsoft.com/en-us/azure/architecture/patterns/anti-corruption-layer
