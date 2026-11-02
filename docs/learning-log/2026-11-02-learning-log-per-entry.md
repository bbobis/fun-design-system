## 2026-11-02 — Learning log: one file per entry

- **Changed:** new learning-log entries go in `docs/learning-log/YYYY-MM-DD-<topic>.md`, one file per task. `AGENTS.md` and `README.md` now say so. The old `docs/learning-log.md` keeps the entries up to today, with a note at the top.
- **Remember: a conflict is about lines, not files.** Git merges two branches line by line. Two PRs that both append to the end of one file change the _same_ spot, so it's a conflict even though neither edit is wrong. Two PRs that each add a _new_ file never overlap.
- **Remember: GitHub ignores `.gitattributes` merge drivers.** `merge=union` (keep both sides) works for `git merge` on your machine, but GitHub's mergeability check doesn't use it, so the PR still shows a conflict. Fixing the file layout fixes it everywhere.
- **Note:** the instructions in the claude.ai Project ("Fun Design System") still say to append to `docs/learning-log.md`. Update that line there too, or sessions that read only the Project instructions will keep using the old file.
- Docs: https://git-scm.com/docs/gitattributes#_defining_a_custom_merge_driver
