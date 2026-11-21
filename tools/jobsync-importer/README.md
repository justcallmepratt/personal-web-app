# jobsync-importer

Reads a [JobSync](https://github.com/Gsync/jobsync) backup, works out which skills your
tracked jobs ask for that are not in your profile tech stack, and proposes them through
the site's suggestion queue. Dry run by default; nothing is public until you accept a
suggestion in the admin app.

The guide (setup, weekly use, scheduling, limits, and the JobSync research) is
[docs/JOBSYNC_IMPORTER.md](../../docs/JOBSYNC_IMPORTER.md).

```bash
node bin/jobsync-importer.mjs --help
```

```bash
npm test
```

Node 22 or newer. No dependencies, so there is nothing to install.

| Path | What |
|---|---|
| `bin/jobsync-importer.mjs` | Entry point |
| `src/cli.mjs` | Options, the run, output, exit codes |
| `src/backup.mjs`, `src/zip.mjs` | Read-only reader for the JobSync backup zip |
| `src/analyse.mjs` | Title and company matching, skill extraction, proposals, the "never assert a claim" guard, de-duplication |
| `src/api.mjs` | The site's API: profile, one sign-in, suggestions |
| `data/target-titles.json` | Job titles that count (edit freely) |
| `data/companies-allowlist.json` | Fallback company allow-list; ships empty on purpose |
| `data/skills-dictionary.json` | Skills and their aliases (edit freely) |
| `launchd/*.plist.example` | Weekly dry run on a Mac |
| `test/` | `node --test`: synthetic backups and a mock API on localhost |

Rules the code keeps, each with tests:

- The only thing it proposes is one item added to `profile.techStack`, with a reason that
  states the evidence and asks whether it applies (`assertSafeSuggestion`).
- A company counts only if an allow-list entry has both `fortune500` and `finraRegulated`
  set to `true`; its status is never guessed.
- One sign-in request per run, never retried. No password, token or state is stored.
