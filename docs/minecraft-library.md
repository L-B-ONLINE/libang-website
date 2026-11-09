# Minecraft updates and version library

Production: https://web.libang.online/minecraft

- Dongwon's photograph and its social preview were removed in `8dd65e6`. The shared preview now uses the site logo.
- `/minecraft` shows the latest Java release and test build, plus the latest 48 official launcher news entries. Summaries remain in their original language and link to Minecraft's official articles.
- `/minecraft/versions` searches the official Java manifest, with release, snapshot, prerelease/RC, alpha, beta, Classic, Infdev, Pre-Classic and year filters. Lists load in batches of 40.
- `/minecraft/versions/[id]` displays release date, official Java requirement and the official vanilla server artifact when supplied. Missing historical metadata is not guessed. Unknown versions return 404.
- Bedrock news links to the official updates page; the archive is explicitly Java Edition.
- Sources: `https://piston-meta.mojang.com/mc/game/version_manifest_v2.json` and `https://launchercontent.mojang.com/v2/javaPatchNotes.json`. The unversioned launcher news feed is outdated and must not replace the v2 feed.
- Successful source fetches are edge-cached for 30 minutes. Responses are bounded to 2 MiB and 8 seconds. Redirects use `manual` (Workers does not support `redirect: error`) and non-2xx responses fail closed.
- Version metadata is resolved exclusively from the official manifest. Metadata and download hosts/paths are restricted; user input never becomes an arbitrary fetch URL.
- No new paid provider, database, cron, credentials or changes to authentication are required. Existing Workers usage remains subject to the account's plan.

Validation: TypeScript, 30 Node tests (10 provider/security cases), lint on the new modules, production build, and Chromium UI checks for search, filters, pagination, stable/historical downloads, invalid versions and 320/390/768/1280 px layouts. Account-avatar state was checked across navigation into the new section.

Local managed environments need the inherited HTTPS proxy for outbound connections and may have an older workerd binary. Preview-only compatibility overrides must not change the production compatibility date. Production deployment continues through the existing GitHub main / Cloudflare Workers Builds connection.

## Mobile navigation and official artwork correction (2026-11-09)

- The user explicitly requested a compact two-line menu icon, not a second navigation row. Mobile uses a one-row header, an animated two-line-to-X trigger and a Radix menu list. Outside click, Escape, selection, desktop resize and reduced-motion preferences are supported. Account/avatar providers remain mounted.
- The footer retains its original three-column structure. Minecraft links live in the existing guide column. The server card's original placement/height is retained after image removal.
- The archive now distinguishes releases, snapshots, pre-release/RC, alpha, beta, Classic, Infdev and Pre-Classic using both the provider type and historical version ID. Each category has its own explanation; a disclosure lists all explanations.
- Official launcher artwork appears in news cards, archive entries with available artwork, and version details. The latest 26.3 feature uses its official Minecraft article hero image. Publisher URLs are restricted to HTTPS official image paths.
- Confirmed game-drop names are shown alongside version IDs, including `26.3 Wilderness Bound`, and are searchable. Unannounced future drop names are not invented. The news excerpt remains the publisher's original language.
