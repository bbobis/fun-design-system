## 2026-11-03 — BatchSchedule

- **Built:** `BatchSchedule`: one row per line, batches as bars across the days. It has the Pipeline Map's product colors and stripes, statuses (planned dashed, active, complete, at-risk red ring + ⚠), a "Now" line, bars cut at the window edges, lanes for overlapping batches, and a sideways scroller with pinned line names. The logic lives in `schedule-model.ts` (pure functions, tested on their own).
- **Remember: days aren't 24 hours.** Day columns are midnights computed in the ops time zone (`toZoned(date.add({ days: i }), tz)` from `@internationalized/date`). Sun Nov 1, 2026 is **25 hours** in Edmonton because clocks go back. `start + i × 24h` would push every column after it an hour off.
- **Remember: roving tabindex for a big set of controls.** The whole schedule is one Tab stop: only the "current" bar has `tabIndex=0`, the rest `-1`, and arrow keys move focus (and the 0) between them. A long schedule doesn't cost keyboard users 50 Tab presses.
- **Remember: lane packing.** Sort by start, put each batch on the first lane that's free by its start time, else open a new lane. Back-to-back batches (end = next start) share a lane.
- Docs: https://react-spectrum.adobe.com/internationalized/date/ZonedDateTime.html
