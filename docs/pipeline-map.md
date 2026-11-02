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

## 6. Keyboard and screen readers

| Key           | Does                                                                                   |
| ------------- | -------------------------------------------------------------------------------------- |
| Tab           | enters the map (it is **one** Tab stop), then leaves it                                |
| Arrow keys    | move along the network: facility → the pipe leaving that way → the facility at its end |
| Home / End    | first / last facility                                                                  |
| Enter / Space | select the focused item                                                                |
| T             | traces the flow through the focused item (again to stop)                               |
| Escape        | closes the tooltip if one is open, then clears the trace, then clears the selection    |

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
