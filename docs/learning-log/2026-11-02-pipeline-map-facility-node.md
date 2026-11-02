## 2026-11-02 — Pipeline Map step 4: FacilityNode + TankGauge

- **Built:** `FacilityNode`, a station marker whose **shape** shows the kind (square terminal, circle pump station, capsule tank farm, roofline refinery), label under it, alert badge (warning triangle / danger circle), and tank bars when it has tanks. `TankGauge`: one bar per tank, high tanks orange and named. Ben picked both from a rendered mockup.
- **Remember (accessibility): `role="img"` swallows its children.** Everything inside an image role is presentational, so a `TankGauge` nested in a node would lose its spoken summary silently. Fix: the node takes `tanks`, draws the gauge hidden, and puts "3 tanks, 74% full on average. T-3 96%, high" in its own name. A test checks there's exactly one image.
- **Remember: two states need two looks.** First render showed focus and selection as the same ring. Now selected = solid marker + yellow halo, focused = ring outside it. Yellow alone is 1.7:1 on white, so the solid fill carries the state; the halo is extra.
- **Remember: draw in pixels inside a scaled group.** `transform="translate(x y) scale(unitsPerPx)"` puts the node at its grid point, then everything inside is plain px. It's an SVG attribute, not inline style.
- Docs: https://www.w3.org/TR/wai-aria-1.2/#img
