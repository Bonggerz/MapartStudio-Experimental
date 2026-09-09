# Notices

Mapart Studio is licensed under the GNU General Public License version 3.0.
See `LICENSE.txt`.

Mapart Studio is provided without warranty, to the extent permitted by law.
See sections 15 and 16 of `LICENSE.txt` for the full GPL-3.0 warranty and
liability terms.

## MapArtCraft

The Image to NBT Converter, converter preview behavior, material counting,
block/color data, preset data, dithering behavior, support-block behavior, and
related mapart conversion logic include work derived from MapArtCraft.

Upstream projects:

- https://github.com/rebane2001/mapartcraft
- https://github.com/mike2b2t/mapartcraft

License:

- GNU General Public License version 3.0
- Local GPL-3.0 license copy: `LICENSE.txt`

Upstream source:

- https://github.com/rebane2001/mapartcraft
- https://github.com/mike2b2t/mapartcraft

Mapart Studio derived/generated files:

- `mapartcraft_exact.js`
- `mapartcraft_vendor_data.js`
- `converter-preview-worker.js`
- Converter-related portions of `index.html`

Modification summary:

- Ported MapArtCraft browser conversion and preview behavior into the Mapart
  Studio single-page workspace.
- Generated browser-loadable vendor data from MapArtCraft JSON data.
- Adapted palette selection, preset handling, material counting, support-block
  handling, dithering choices, NBT export, map.dat export, and editor handoff
  for Mapart Studio.
- Moved converter preview generation into a Mapart Studio worker wrapper so the
  MapArtCraft-derived conversion can run off the browser UI thread.
- Added Mapart Studio UI controls, profile handling, and integration with the
  NBT editor workspace.

MapArtCraft itself credits Minecraft, KenPixel Mini Square, pako, JSZip,
OpenMoji, translation contributors, SelfAdjointOperator, and upstream code
contributors. See the upstream README files linked under "Upstream source" for
the complete upstream credit list.

## Corresponding Source

When distributing or hosting Mapart Studio, provide the complete corresponding
source code for the distributed version under GPL-3.0. This deployment source,
including `mapartcraft_exact.js`,
`mapartcraft_vendor_data.js`, `converter-preview-worker.js`,
`reverse_mapart.js`, `reverse_mapart.css`, `index.html`,
`README.md`, `NOTICE.md`, and `LICENSE.txt`, is
intended to be that corresponding source for the browser app.

## MapArtCraft Reverse by Tyson

The `NBT to Image` workspace ports the reverse-decoder behavior published in
Tyson's MapArtCraft Reverse fork:

- https://github.com/sxztyson/mapartcraft
- Source revision reviewed and ported: `4d283489e22c9dcd09d1d996fe6f0bf2839c0dc5`
- License: GNU General Public License version 3.0

Local corresponding source for the integration is provided in:

- `reverse_mapart.js`
- `reverse_mapart.css`
- The NBT-to-image workspace markup and tab wiring in `index.html`

Modification summary:

- Ported the shipped NBT/ZIP decoder out of the React build into readable,
  framework-free source that uses Mapart Studio's existing NBT parser and
  vendored MapArtCraft palette/version data.
- Preserved automatic `_column_row.nbt` tile placement, manual column fallback,
  noobline removal, height/water shading, construction and surface analysis,
  unknown-block reporting, progress feedback, partial ZIP recovery, and PNG
  download behavior.
- Restyled the reverse workspace to match Mapart Studio's tabbed interface.
