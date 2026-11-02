## 2026-11-02 — Pipeline Map step 7: MapLegend and PipelineMapTable

- **Built:** `MapLegend` (products incl. "Other" past 6, pipe statuses, line width, facility shapes) and `PipelineMapTable` (two `<table>`s, Pipes and Facilities, with every number from the map as text). Optional `selectedId` / `onSelect` keep the table and the map in sync. `FacilityKindMarker` now shared by the node and the legend. This completes the Pipeline Map plan.
- **Remember (the prediction): `<caption>` names the table itself.** A screen reader entering it says "Pipes, table, 6 rows, 4 columns", and the "list tables" menu shows "Pipes". A heading above the table is just text nearby: the table would be announced nameless. `getByRole('table', { name: 'Pipes' })` only works because of the caption.
- **Remember: `<th scope="row">` makes each row speak its name.** The route ("Station B → Station C") is the row header, so moving down the Flow column reads "Station B → Station C, 700 of 1,200" instead of a bare number.
- **Remember: draw the legend with the real pieces.** The swatches are a one-batch `BatchTrain`, real `PipeSegment`s and the shared marker shapes, so the key can't drift from the map. The screenshot still caught a sizing bug (a restricted dash didn't fit), which a token-only legend would have hidden too.
- Docs: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/caption
