# Minecraft updates and version library

Production: https://web.libang.online/minecraft

- Dongwon's photograph and its social preview were removed in `8dd65e6`. The shared preview now uses the site logo.
- `/minecraft` shows the latest Java release and test build, plus the official launcher news archive. Summaries remain in their original language and link to Minecraft's official articles.
- `/minecraft/versions` searches the official Java manifest, with release, snapshot, prerelease/RC, alpha, beta, Classic, Infdev, Pre-Classic and year filters. Lists reveal batches of 40 automatically as the end approaches.
- `/minecraft/versions/[id]` displays release date, official Java requirement and the official vanilla server artifact when supplied. Missing historical metadata is not guessed. Unknown versions return 404.
- Bedrock news links to the official updates page; the archive is explicitly Java Edition.
- Sources: `https://piston-meta.mojang.com/mc/game/version_manifest_v2.json` and `https://launchercontent.mojang.com/v2/javaPatchNotes.json`. The unversioned launcher news feed is outdated and must not replace the v2 feed.
- Successful source fetches are edge-cached for 30 minutes. Responses are bounded to 2 MiB and 8 seconds. Redirects use `manual` (Workers does not support `redirect: error`) and non-2xx responses fail closed.
- Version metadata is resolved exclusively from the official manifest. Metadata and download hosts/paths are restricted; user input never becomes an arbitrary fetch URL.
- No new paid provider, database, cron, credentials or changes to authentication are required. Existing Workers usage remains subject to the account's plan.

Validation: TypeScript, 31 Node tests (including archive continuity and provider/security cases), lint on the new modules, production build, and Chromium UI checks for search, filters, pagination, stable/historical downloads, invalid versions and 320/390/768/1280 px layouts. Account-avatar state was checked across navigation into the new section.

Local managed environments need the inherited HTTPS proxy for outbound connections and may have an older workerd binary. Preview-only compatibility overrides must not change the production compatibility date. Production deployment continues through the existing GitHub main / Cloudflare Workers Builds connection.

## Mobile navigation and official artwork correction (2026-11-09)

- The user explicitly requested a compact two-line menu icon, not a second navigation row. Mobile uses a one-row header, an animated two-line-to-X trigger and a Radix menu list. Outside click, Escape, selection, desktop resize and reduced-motion preferences are supported. Account/avatar providers remain mounted.
- The footer retains its original three-column structure. Minecraft links live in the existing guide column. The server card's original placement/height is retained after image removal.
- The archive now distinguishes releases, snapshots, pre-release/RC, alpha, beta, Classic, Infdev and Pre-Classic using both the provider type and historical version ID. Each category has its own explanation; a disclosure lists all explanations.
- Official launcher artwork appears in news cards, archive entries with available artwork, and version details. The latest 26.3 feature uses its official Minecraft article hero image. Publisher URLs are restricted to HTTPS official image paths.
- Confirmed game-drop names are shown alongside version IDs, including `26.3 Wilderness Bound`, and are searchable. Unannounced future drop names are not invented. The news excerpt remains the publisher's original language.


## Popup, theme and continuous scrolling refinement (2026-11-09)

- Global navigation has one Minecraft entry; archive navigation remains inside that section.
- Mobile menu and account popup both have square containers and the same entry/exit animations. The two menu-icon lines have rounded ends; reduced-motion preferences disable the animations.
- Forum topics, version categories and news filters share the `choice-scroll` button styles. Removed the forum's obsolete moving underline and its ResizeObserver.
- Dark theme references [Leaf-website global.css](https://github.com/Winds-Studio/Leaf-website/blob/main/src/app/%5Blang%5D/global.css): neutral dark backgrounds, off-white text, subdued borders and green accents. Separate filled-action and text-accent variables maintain readable button contrast. Light remains the default; explicit and automatic light modes retain the original palette.
- Both news and versions use the shared `InfiniteListEnd` component. IntersectionObserver reveals the next batch near the bottom, with scroll/resize fallback and keyboard-focus support. Filtering resets the batch size, and the final batch displays an end marker. No More buttons or extra data services are needed.
- Removed the old 48-news-entry truncation; the complete official feed is available. Metadata stays in the existing source cache and images remain lazy-loaded.

- Follow-up preference: use the same brand accent `#147953` for light, dark and automatic themes. Dark surfaces remain neutral; filled actions use the same green with light foreground text.
