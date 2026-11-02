# Pipeline Map guide

How to draw a pipeline network with `PipelineMap`, `MapLegend` and `PipelineMapTable`,
and how to feed them from **any** backend. The components only draw; your app fetches
the data and maps it into one plain object, `PipelineNetwork`.

## TL;DR

```tsx
import {
  MapLegend,
  PipelineMap,
  PipelineMapTable,
  type PipelineNetwork,
} from '@fun-design-system/ui';

const products = ['SYN', 'DIL', 'SWT', 'CON']; // order = colors. Keep it stable.

function NetworkPage({ network }: { network: PipelineNetwork }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return (
    <>
      <PipelineMap
        aria-label="Mainline network"
        network={network}
        products={products}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <MapLegend
        products={products}
        productNames={{ SYN: 'Synthetic crude' }}
      />
      <PipelineMapTable
        network={network}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
    </>
  );
}
```

The map fills its container's width. Markers, line widths and gaps stay the same size
in pixels at any width.

## 1. The data shape

Units: volumes in **m³**, flow rates in **m³/h**, positions in **grid units** (not
pixels, not latitude/longitude; the map scales the grid to fit).

```ts
const network: PipelineNetwork = {
  facilities: [
    {
      id: 'A',
      label: 'Terminal A',
      kind: 'terminal',
      position: { x: 0, y: 1 },
    },
    {
      id: 'B',
      label: 'Station B',
      kind: 'pump-station',
      position: { x: 4, y: 1 },
      labelPlacement: 'above', // optional, see section 4
    },
    {
      id: 'D',
      label: 'Tank Farm D',
      kind: 'tank-farm',
      position: { x: 12, y: 1 },
      tanks: [{ id: 'T-1', label: 'T-1', volume: 82, capacity: 100 }], // optional
      alert: { level: 'warning', message: 'T-3 above 95%' }, // optional
    },
  ],
  segments: [
    {
      id: 'A-B',
      from: 'A',
      to: 'B', // flow always goes from → to
      flowRate: 900,
      maxFlowRate: 1200, // sets the line width
      status: 'running', // 'running' | 'restricted' | 'shutdown'
      batches: [
        // DOWNSTREAM-FIRST, see section 3
        { name: 'B-1041', product: 'SYN', volume: 3200 },
        { name: 'B-1042', product: 'DIL', volume: 5400 },
      ],
      waypoints: [{ x: 2, y: 1 }], // optional corners
    },
  ],
};
```

| Field                    | What it draws                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| `kind`                   | the marker **shape**: square terminal, circle pump station, capsule tank farm, roofline refinery |
| `status`                 | color **and** dash pattern (solid, long dash, dots)                                              |
| `flowRate / maxFlowRate` | line width (thin = low flow)                                                                     |
| `batches`                | a colored band beside the pipe, one slice per batch, sized by `volume`                           |
| `tanks`                  | one small bar per tank under the marker                                                          |
| `alert`                  | a badge: triangle = warning, circle = danger                                                     |

Positions are placed by hand: there is no auto-layout. A grid of whole numbers (one step
per station) is easiest to read and to keep tidy.

### Mapping from your backend

Do the mapping once, in one function, next to your API call. The component never sees
your API's shape.

```ts
function toNetwork(dto: ApiNetwork): PipelineNetwork {
  return {
    facilities: dto.sites.map((s) => ({
      id: s.code,
      label: s.displayName,
      kind: KIND_BY_TYPE[s.type],
      position: { x: s.gridX, y: s.gridY },
    })),
    segments: dto.lines.map((l) => ({
      id: l.code,
      from: l.upstreamSite,
      to: l.downstreamSite,
      flowRate: l.flowM3h,
      maxFlowRate: l.ratedM3h,
      status: STATUS_BY_CODE[l.state],
      batches: [...l.batches]
        .sort((a, b) => a.seq - b.seq)
        .map((b) => ({
          // check the order!
          name: b.batchNo,
          product: b.productCode,
          volume: b.m3InLine,
        })),
    })),
  };
}
```

## 2. Wiring the map, legend and table

- **`PipelineMap`** draws the network. Give it an `aria-label`: it names the map for
  screen readers.
- **`MapLegend`** explains every look on the map. Pass it **the same `products` array**,
  or the colors won't match.
- **`PipelineMapTable`** shows every number on the map as text in two real tables (Pipes,
  Facilities). It is the accessible version of the drawing, and it is also handy for
  copying and printing. Always render it somewhere on the page, even behind a "Show as
  table" toggle.

Selection can be **uncontrolled** (the map keeps it; use `defaultSelectedId`) or
**controlled** (you keep it; pass `selectedId` + `onSelect`). Use controlled when anything
else on the page reacts to it, like the table above or a details panel. `onSelect` gets
`null` when the user clears the selection.

To change what is drawn on top, pass the layers as children. SVG has no `z-index`: later
children cover earlier ones.

```tsx
<PipelineMap aria-label="Mainline" network={network} products={products}>
  <PipelineMapSegments />
  <PipelineMapFacilities />
</PipelineMap>
```

## 3. Gotchas

1. **Ids must be unique across facilities _and_ segments.** Selection, focus and the
   table all use one id space. A facility `'A'` and a segment `'A'` will fight.
   Prefixing helps: `site:A`, `line:A-B`.
2. **A segment whose `from` or `to` doesn't match a facility id is skipped**, with no
   error. If a pipe is missing, check the ids first.
3. **Batches are listed downstream-first.** `batches[0]` is the oldest batch, the one
   closest to `to` (it arrives first). Many systems store them in the order they were
   pumped (upstream-first): reverse them when you map.
4. **The order of `products` sets the colors, everywhere.** Slots 1–3 are three hues,
   slots 4–6 are the same hues with stripes, and anything past 6 (or missing from the
   list) is gray striped "Other". Keep the array fixed for your app (for example, sorted
   by volume moved per year). If you build it from "products in this response", colors
   will jump between refreshes.
5. **Volumes are what's inside _this_ segment.** A batch that spans two pipes appears in
   both, each with its own part of the volume.
6. **Status never relies on color alone**, and neither should your app. If you add your
   own badges or overlays, give them a shape or a pattern too.

## 4. Label placement

By default a facility's name sits **below** its marker. When a pipe leaves a facility
downward, the name lands on that pipe. Move it with `labelPlacement`:

```ts
{ id: 'B', label: 'Station B', kind: 'pump-station', position: { x: 4, y: 1 },
  labelPlacement: 'above' }  // 'below' (default) | 'above' | 'left' | 'right'
```

- Pick the side **with no pipe**: branch going down → `above`; facility at the end of a
  vertical line → `left` or `right`.
- The tank gauge always stays under the marker.
- `left` and `right` are **screen** sides. They don't flip in a right-to-left page.
- The map adds room on an edge only when a label there points out of the map (for
  example `left` on the left-most facility), so other maps keep their size.

## 5. Trace the flow

A trace answers "what feeds this, and what does it feed?". Everything upstream and
downstream of one facility or pipe stays bright; the rest fades.

```tsx
const [tracedId, setTracedId] = useState<string | null>(null);

<PipelineMap
  aria-label="Mainline"
  network={network}
  products={products}
  tracedId={tracedId}            // or defaultTracedId when you don't need to know
  onTraceChange={setTracedId}    // T on an item starts/stops; Escape clears
/>
<button onClick={() => setTracedId(selectedId)}>Trace selected</button>
```

- **Separate from selection.** You can trace Station C and select a pipe on the
  other side. Escape clears the trace first, then the selection.
- **From a pipe**, upstream starts at its `from` facility and downstream at its `to`.
- **Faded = lower opacity**, not a different color, so it reads in grayscale. A focused
  item always shows at full strength.
- **Screen readers** hear a summary when a trace starts ("Tracing from Station C.
  Upstream: 2 pipes, 2 facilities. Downstream: …"), and each traced item's name ends
  with "upstream", "downstream" or "trace start".
- Need the sets yourself (for a table filter, say)? `traceNetwork(network, id)` returns
  `{ origin, upstream, downstream }`.

## 6. Legend filters

Pass a filter to both the legend and the map, and the legend's Products and Pipe
status rows become toggle buttons.

```tsx
const [filter, setFilter] = useState<MapFilter>({});

<PipelineMap aria-label="Mainline" network={network} products={products} filter={filter} />
<MapLegend products={products} filter={filter} onFilterChange={setFilter} />
```

| Filter                                         | Bright                                    | Faded                                                |
| ---------------------------------------------- | ----------------------------------------- | ---------------------------------------------------- |
| `{ products: ['SYN'] }`                        | pipes carrying SYN, and their SYN batches | other pipes; other products' batches in bright pipes |
| `{ statuses: ['restricted', 'shutdown'] }`     | pipes in either status                    | running pipes                                        |
| `{ products: ['SYN'], statuses: ['running'] }` | pipes matching **both**                   | everything else                                      |

- **Fades, never hides.** The network keeps its shape, and faded items can still be
  focused, selected and traced.
- **Facilities aren't filtered.** Only pipes and batches are.
- **With a trace**, an item stays bright only if it is in the trace **and** matches the
  filter.
- **"Other"** toggles every product past the sixth. A product missing from `products`
  can't be filtered on: add it to the list.
- **Empty list = no filter** (`{ products: [] }` shows everything).
- **Keyboard:** each group is one Tab stop; ↑/↓ move, Space toggles. "Clear filters"
  appears while a filter is on. The map announces the result ("Filter on: 2 of 5 pipes
  match.").
- **Escape on the map doesn't clear a filter.** The legend owns it, so the user clears
  it where they set it.

## 7. Follow a batch

A batch is identified by its `name` across the whole network. A batch crossing a
station appears in two pipes, once in each, with the volume in each.

```tsx
const [batch, setBatch] = useState<string | null>(null);

<PipelineMap … followedBatch={batch} onFollowBatchChange={setBatch} />
<PipelineMapTable network={network} followedBatch={batch} onFollowBatch={setBatch} />
```

- **Bright:** the pipes holding that batch, and that batch in them. **Faded:** every
  other pipe and every other batch, including other batches of the same product.
- **Mouse:** click a batch's band (again to stop). The pipe gets selected too.
- **Keyboard:** focus a pipe and press `B` to follow its first batch; `B` again moves
  to the next, and after the last one it stops. In the table, every batch is a toggle
  button.
- **Screen readers** hear "Following B-1041, SYN: 96,000 m³ across 2 pipes.", and the
  pipes holding it end their name with "holds B-1041".
- **Use the same name in every pipe.** If your backend gives each part its own id,
  map them to one name in `toNetwork()`, or the batch will look like two.
- Combines with a trace and a filter by AND, like they do with each other.
- `findBatch(network, name)` gives you the parts and the total, e.g. for a panel.

## 8. Search and jump

`PipelineMapSearch` is a combobox of every facility and pipe. It hands you an id;
you tell the map to focus it through the map's **ref handle**.

```tsx
const mapRef = useRef<PipelineMapHandle>(null);

<PipelineMapSearch
  network={network}
  onPick={(id) => {
    setSelectedId(id);                // optional: select it too
    mapRef.current?.focusItem(id);    // move keyboard focus onto it
  }}
/>
<PipelineMap ref={mapRef} … selectedId={selectedId} onSelect={setSelectedId} />
```

- **Why a ref and not a prop?** Focus is an _action at a moment_, not a state to hold.
  A `focusedId` prop would have to be cleared after every jump, or jumping to the same
  item twice would do nothing. `focusItem(id)` just does it, and returns `false` for an
  unknown id.
- **The map's `ref` is the handle, not the `<svg>`.** Need the element? Wrap the map in
  a `<div ref>`.
- After a jump the item is the map's tab stop and shows its tooltip, so arrow keys carry
  on from there.
- The box clears after each pick, so you can search again straight away.
- `searchOptions(network)` builds the option list if you'd rather use your own search UI.

## 9. Details panel

`PipelineMapDetails` shows everything about the selected item next to the map: numbers,
tanks or batches, connected pipes and stations, and actions. Pass it the same state as
the map, and lay the two out however your page needs.

```tsx
<div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
  <PipelineMap ref={mapRef} … selectionFollowsFocus
    selectedId={selectedId} onSelect={setSelectedId}
    tracedId={tracedId} onTraceChange={setTracedId}
    followedBatch={batch} onFollowBatchChange={setBatch} />
  <PipelineMapDetails network={network}
    selectedId={selectedId} onSelect={setSelectedId}
    tracedId={tracedId} onTraceChange={setTracedId}
    followedBatch={batch} onFollowBatch={setBatch}
    onShowOnMap={(id) => mapRef.current?.focusItem(id)} />
</div>
```

- **Non-modal `<aside>`** (a "complementary" landmark named "Details"): the map stays
  usable, and screen-reader users can jump to the panel with their landmarks list.
- **`selectionFollowsFocus`** on the map makes arrow keys select as they move (like
  tabs), so the panel updates as you go. Without it, arrows only move and Enter/Space
  select.
- Each action shows only when you pass its callback (`onTraceChange`, `onFollowBatch`,
  `onSelect`, `onShowOnMap`).
- **Buttons never move focus on their own**, except "Show on map", because moving focus
  is what it asks for. "Trace flow" stays focused; the map announces the trace.
- `headingLevel` (default 2) fits the panel's heading into your page outline.

## 10. Keyboard and screen readers

| Key           | Does                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------- |
| Tab           | enters the map (it is **one** Tab stop), then leaves it                                     |
| Arrow keys    | move along the network: facility → the pipe leaving that way → the facility at its end      |
| Home / End    | first / last facility                                                                       |
| Enter / Space | select the focused item                                                                     |
| T             | traces the flow through the focused item (again to stop)                                    |
| B             | on a pipe: follows its next batch (stops after the last one)                                |
| Escape        | closes the tooltip, then stops following a batch, then clears the trace, then the selection |

- Hovering or focusing an item shows its details (batches, tank levels) in a tooltip.
  The same text is the item's screen-reader description.
- Each facility reads as one image with a full name, for example "Tank Farm D, tank
  farm. Warning: T-3 above 95%. 3 tanks, 74% full on average".
- Focus is a hollow ring; selection is a filled halo. They look different on purpose, so
  you can tell "where I am" from "what I picked".

## See also

- Storybook: _Pipeline Map / PipelineMap_ (the `ControlledSelection` story shows the
  wiring above) and _Pipeline Map / FacilityNode_ (`LabelPlacements`).
- Types: `packages/ui/src/components/pipeline-map/pipeline-model.ts`.
- Demo data: `pipeline-map.fixtures.ts` (made up, no real company data).
