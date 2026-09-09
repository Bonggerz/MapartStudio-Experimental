# Mapart Studio

Mapart Studio is a browser-based Minecraft mapart workspace. It combines an Image to NBT Converter, an NBT editor, and a standalone NBT material-list tool in one tabbed interface.

## Features

- Aseprite-style Home, Image to NBT Converter, NBT Editor, and NBT to Material List tabs.
- Image conversion preview with crop, map size, color matching, dithering, preprocessing, grid, support block, and palette controls.
- Converter exports for schematic NBT, split ZIP, joined NBT, map.dat, and map.dat ZIP.
- In-memory handoff from the converter to the NBT Editor.
- Import one or more `.nbt` structure files.
- Combine materials from multiple direct `.nbt` files and ZIP archives without opening them in the editor.
- Edit mapart with brush and line tools.
- Paint exact converter dithering locally with a source-aware Dither Brush after using `Open in Editor`.
- Supports carpet-only, full-block, and staircased mapart workflows.
- Preserves hidden MapArtCraft noobline rows during export.
- Adds support blocks for blocks that need them.
- Imports and saves palette profiles.
- Exports edited maps as individual files, a ZIP folder, or one combined NBT.
- Provides a zoomable and pannable canvas preview.

## Usage

Open `nbt_mapart_editor.html` in a browser.

From Home, choose either:

- `Image to NBT Converter` to upload an image, tune conversion settings, export files, or open the result in the editor.
- `NBT Editor` to import and edit existing structure NBT files.
- `NBT to Material List` to add structure NBTs or ZIP archives and download one combined material list.

Editor workflow:

1. Click the NBT file picker and import one or more `.nbt` files.
2. Optionally import a palette profile.
3. Select a color/block from the palette.
4. Paint with the brush or line tool. Converter-opened maps can also use the Dither Brush with the same dithering methods as the converter.
5. Export the edited result using one of the download buttons.

## Notes

- The editor hides MapArtCraft noobline rows in the preview, but preserves them during export.
- The converter preview and material counts use vendored MapArtCraft data plus a browser-port of MapArtCraft's map canvas worker.
- Staircased maps preserve block heights and shading behavior.
- Palette profile import is intended for MapArtCraft-style palette files.

## License

Mapart Studio is licensed under the GNU General Public License v3.0. See
`LICENSE.txt`.

The Image to NBT Converter, converter preview behavior, material counting,
block/color data, preset data, dithering behavior, support-block behavior, and
related mapart conversion logic include work derived from MapArtCraft
GPL-3.0 source/data:

- https://github.com/rebane2001/mapartcraft
- https://github.com/mike2b2t/mapartcraft

The vendored upstream source is included at `vendor/mapartcraft`, with its
license at `vendor/mapartcraft/LICENSE`.

Local MapArtCraft-derived/generated files include:

- `mapartcraft_exact.js`
- `mapartcraft_vendor_data.js`
- `converter-preview-worker.js`
- Converter-related portions of `nbt_mapart_editor.html`

See `NOTICE.md` for attribution, provenance, and corresponding-source notes.
