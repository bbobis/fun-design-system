## 2026-11-03 — AlarmList

- **Built:** `AlarmList` on React Aria `GridList`: priority 1–4 as shape + number (◆ ▲ ■ ●), unacknowledged rows bold with a start bar, cleared-but-unacknowledged rows kept (muted, "Cleared"), a row Ack button, toolbar Acknowledge (selected or all) and Shelve ▾, shelved alarms counted not listed, and live announcements for new alarms. The order comes from `sortAlarms`: active, then priority, then newest.
- **Remember: no flashing.** SCADA screens often blink unacknowledged alarms. On the web that's a seizure risk (WCAG 2.3.1: no more than 3 flashes a second) and needs a way to stop it (2.2.2). It also pulls the eye away from the next alarm. Bold + a solid bar + the word "Unacknowledged" carry the same message.
- **Remember: two live regions.** `role="alert"` (assertive) interrupts, so it's only for priority 1–2. `role="status"` (polite) waits for a pause, for 3–4. Both are always in the DOM, and only their text changes. Nothing is announced on the first render: alarms already there aren't news.
- **Remember: interactive children in a GridList row.** ↑/↓ move between rows; →/← walk through the row's focusable children (checkbox, then Ack). One Tab stop for the whole list.
- Docs: https://react-spectrum.adobe.com/react-aria/GridList.html#interactive-children
