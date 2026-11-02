## 2026-11-02 — Date / time field styles

- **Built:** the calendar now matches the field `size` (sm 32px days, md 36px, lg 40px). DatePicker `showToday` adds a "Today" button. DateRangePicker `visibleMonths={2}` shows two months side by side (one month under 40rem). TimeField `icon={false}` hides the clock, and its end padding now follows the size.
- **Remember: context reaches through portals.** The calendar renders in a Popover far from the field in the DOM, but React context follows the _component_ tree, so `<CalendarSizeContext.Provider>` around it still works. The DataGrid editor sets no provider, so it gets the default (`md`).
- **Remember: a "page" in React Aria's calendar is `visibleDuration`.** With `{ months: 2 }`, ‹ › and PageUp/PageDown move 2 months (`pageBehavior="single"` would make it 1). Each `CalendarGrid` takes an `offset` that says which month of the page it draws.
- **Remember: `useSyncExternalStore` reads browser state.** It's React's hook for values that live outside React (here `matchMedia`). It re-renders when the value changes, with no `useEffect` + `useState` flash.
- Docs: https://react-spectrum.adobe.com/react-aria/RangeCalendar.html#multiple-months
