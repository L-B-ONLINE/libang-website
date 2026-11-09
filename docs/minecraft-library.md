# Minecraft updates and version library

Production: https://web.libang.online/minecraft

- Dongwon's photograph and its social preview were removed in `8dd65e6`. The shared preview now uses the site logo.
- `/minecraft` shows the latest Java release and test build, plus the latest 48 official launcher news entries. Summaries remain in their original language and link to Minecraft's official articles.
- `/minecraft/versions` searches the official Java manifest, with release, snapshot, prerelease/RC, historical alpha/beta and year filters. Lists load in batches of 40.
- `/minecraft/versions/[id]` displays release date, official Java requirement and the official vanilla server artifact when supplied. Missing historical metadata is not guessed. Unknown versions return 404.
- Bedrock news links to the official updates page; the archive is explicitly Java Edition.
- Sources: `https://piston-meta.mojang.com/mc/game/version_manifest_v2.json` and `https://launchercontent.mojang.com/v2/javaPatchNotes.json`. The unversioned launcher news feed is outdated and must not replace the v2 feed.
- Successful source fetches are edge-cached for 30 minutes. Responses are bounded to 2 MiB and 8 seconds. Redirects use `manual` (Workers does not support `redirect: error`) and non-2xx responses fail closed.
- Version metadata is resolved exclusively from the official manifest. Metadata and download hosts/paths are restricted; user input never becomes an arbitrary fetch URL.
- No new paid provider, database, cron, credentials or changes to authentication are required. Existing Workers usage remains subject to the account's plan.

Validation: TypeScript, 28 Node tests (8 new provider/security cases), lint on the new modules, production build, and Chromium UI checks for search, filters, pagination, stable/historical downloads, invalid versions and 320/390/768/1280 px layouts. Account-avatar state was checked across navigation into the new section.

Local managed environments need the inherited HTTPS proxy for outbound connections and may have an older workerd binary. Preview-only compatibility overrides must not change the production compatibility date. Production deployment continues through the existing GitHub main / Cloudflare Workers Builds connection.
