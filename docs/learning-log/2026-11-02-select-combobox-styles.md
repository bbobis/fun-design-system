## 2026-11-02 — Select / Combobox option styles

- **Built:** `SelectOption` gets `icon` and `description`, which works in Select, Combobox and MultiCombobox. The option list matches the field `size` (rows of 28 / 32 / 40px, and 44 / 48 / 56px with descriptions). The closed Select shows the chosen option's icon. All three share one `OptionContent` file (`select/option-content.tsx`).
- **Remember: React Aria slots wire ARIA for you.** Inside a `ListBoxItem`, `<Text slot="label">` becomes the option's name (`aria-labelledby`) and `<Text slot="description">` its description (`aria-describedby`). A screen reader says "Admin, Can change billing". The description stays out of the name, so typing "A" still jumps to Admin.
- **Remember: virtualized lists need heights up front.** Combobox's list only draws the rows on screen and places them by maths (`rowHeight × index`). So the row height is a number (`listRowHeight`) plus a matching fixed class (`h-12`), and the description is cut to one line. If the two drift apart, rows overlap.
- **Remember: `SelectValue`'s render prop** gives you `selectedItems` and `selectedText`. That lets the closed field show the icon and label but never the description or the check.
- Docs: https://react-spectrum.adobe.com/react-aria/ListBox.html#text-slots
