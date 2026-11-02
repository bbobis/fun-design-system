# Learning log

One file per task, named `YYYY-MM-DD-<topic>.md`, newest by name. Each has 3-5
bullets: what was built, the one or two concepts to remember, one official docs link.
Older entries (up to 2026-11-02) are in [`../learning-log.md`](../learning-log.md).

Why one file each: when every PR appended to the end of one file, any two open PRs
changed the same lines and GitHub reported a merge conflict. (Git's `merge=union`
attribute would fix that for local merges, but GitHub ignores it when it checks a PR.)
New files never touch each other's lines.

To read them in order: `ls docs/learning-log`, or `cat docs/learning-log/2026-*.md`.
