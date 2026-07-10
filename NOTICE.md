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
- Local upstream license copy: `vendor/mapartcraft/LICENSE`

Local vendored source:

- `vendor/mapartcraft`

Mapart Studio derived/generated files:

- `mapartcraft_exact.js`
- `mapartcraft_vendor_data.js`
- Converter-related portions of `nbt_mapart_editor.html`

Modification summary:

- Ported MapArtCraft browser conversion and preview behavior into the Mapart
  Studio single-page workspace.
- Generated browser-loadable vendor data from MapArtCraft JSON data.
- Adapted palette selection, preset handling, material counting, support-block
  handling, dithering choices, NBT export, map.dat export, and editor handoff
  for Mapart Studio.
- Added Mapart Studio UI controls, profile handling, and integration with the
  NBT editor workspace.

MapArtCraft itself credits Minecraft, KenPixel Mini Square, pako, JSZip,
OpenMoji, translation contributors, SelfAdjointOperator, and upstream code
contributors. See `vendor/mapartcraft/README.md` for the upstream credit list.

## Corresponding Source

When distributing or hosting Mapart Studio, provide the complete corresponding
source code for the distributed version under GPL-3.0. This repository source,
including `vendor/mapartcraft`, `mapartcraft_exact.js`,
`mapartcraft_vendor_data.js`, `nbt_mapart_editor.html`, `README.md`,
`NOTICE.md`, and `LICENSE.txt`, is intended to be that corresponding source for
the browser app.
