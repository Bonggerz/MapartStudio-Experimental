# Mapart Studio

Mapart Studio is a browser-based Minecraft mapart workspace. It wraps the existing NBT Mapart Editor in a tabbed shell and adds an Image to NBT Converter workspace for turning images into mapart previews, block palettes, material counts, and exportable files.

## Features

- Aseprite-style Home, Image to NBT Converter, and NBT Editor tabs.
- Image conversion preview with crop, map size, color matching, dithering, preprocessing, grid, support block, and palette controls.
- Converter exports for schematic NBT, split ZIP, joined NBT, map.dat, and map.dat ZIP.
- In-memory handoff from the converter to the NBT Editor.
- Import one or more `.nbt` structure files.
- Edit mapart with brush and line tools.
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

Editor workflow:

1. Click the NBT file picker and import one or more `.nbt` files.
2. Optionally import a palette profile.
3. Select a color/block from the palette.
4. Paint with the brush or line tool.
5. Export the edited result using one of the download buttons.

## Notes

- The editor hides MapArtCraft noobline rows in the preview, but preserves them during export.
- The converter preview and material counts use vendored MapArtCraft data plus a browser-port of MapArtCraft's map canvas worker.
- Staircased maps preserve block heights and shading behavior.
- Palette profile import is intended for MapArtCraft-style palette files.

## License

This project is licensed under the GNU General Public License v3.0.

The block/color database and converter behavior are adapted from MapArtCraft:
https://github.com/mike2b2t/mapartcraft
