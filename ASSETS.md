# Asset production record

## Landscape

- Mode: built-in image generation, original text-to-image, opaque background.
- Original output: `/workspace/scratch/db4b867e9338/generated_images/exec-9548ff6c-fa0e-4ef2-a6a4-9079c2bcbd43.png`.
- Project exports: `public/images/libang-world.webp` (1659 × 948),
  `public/images/libang-world-960.webp`, and `public/images/libang-world-640.webp`.
- Pillow resized and encoded WebP variants at quality 87 / 85 / 85. No creative
  edits were applied after generation.
- Explicitly labeled concept art, never an actual server screenshot.

### Prompt

Use case: stylized-concept. Asset type: original panoramic illustration for L.B ONLINE, a Korean Minecraft multiplayer community website. Create a polished, cohesive, sophisticated 2D pixel-art environmental panorama, wide 16:9 composition, with the charm of carefully art-directed indie game key art. A winding stone path and small warm timber village with terracotta roofs on a grassy cliff on the left foreground, an old stone bridge crossing a cobalt-blue river through the center, layered pine forest, far mountain ridges and a distant modest stone keep toward the right. The world is recognizably made of Minecraft-like cuboid terrain, but rendered as deliberate beautiful 2D pixel art with fine, crisp, consistent pixel clusters, not as a photoreal screenshot or isometric floating island. Clear afternoon sky, warm sunlight, deep soft blue shadows, rich yet restrained forest greens, warm pale limestone. Strong compositional hierarchy, inviting sense of a world to enter, generous sky in upper third, river leading the eye into the scene. Calm and beautifully crafted, not overly busy. Landscape fills entire canvas edge to edge. No text, no logos, no interfaces, no HUD, no characters in foreground, no rounded vector cartoon shapes, no bloom haze, no magenta, no shiny 3D render. This is an illustrative brand landscape, not a claimed screenshot of the real server. Output landscape 1792x1024 or similar wide.

## Fonts

Original Pretendard source: `assets/font-source/pretendard-variable.woff2`.
Public subset: `public/fonts/pretendard-ko-latin.woff2`. Modern Hangul, Latin,
Korean punctuation and variable weights 400–750 are retained; other scripts
use system fallbacks. Font loading uses preload and swap. Existing OFL and
Monocraft licenses remain in `public/fonts/`.

Reproduction uses fontTools subset with the following Unicode ranges, then
`fontTools.varLib.instancer.instantiateVariableFont(font, {"wght": (400, 750)})`
and WOFF2 encoding:

`0000–024F, 1100–11FF, 2000–206F, 20A0–20CF, 2100–214F, 2190–21FF, 2460–24FF, 3000–303F, 3130–318F, AC00–D7A3, FF00–FFEF`.

Public font size: 2,057,688 → 1,223,408 bytes, about 40.5% smaller.
