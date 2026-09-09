/*
 * Mapart Studio NBT-to-image workspace.
 * Ported from the reverse decoder shipped by sxztyson/mapartcraft at commit
 * 4d283489e22c9dcd09d1d996fe6f0bf2839c0dc5 (GPL-3.0).
 */
(function () {
    "use strict";

    const dropZone = document.getElementById("reverseDropZone");
    const fileInput = document.getElementById("reverseFileInput");
    const fileHeading = document.getElementById("reverseUploadHeading");
    const fileHint = document.getElementById("reverseFileHint");
    const columnsInput = document.getElementById("reverseColumns");
    const reconstructButton = document.getElementById("reverseReconstruct");
    const progressBar = document.getElementById("reverseProgress");
    const statusElement = document.getElementById("reverseStatus");
    const errorElement = document.getElementById("reverseError");
    const resultElement = document.getElementById("reverseResult");
    const reportElement = document.getElementById("reverseReport");
    const canvas = document.getElementById("reverseCanvas");

    if (!dropZone || !fileInput || !canvas) return;

    const vendor = window.MAPARTCRAFT_VENDOR_DATA || {};
    const transparentBlocks = new Set([
        "air",
        "cave_air",
        "void_air",
        "glass",
        "glass_pane",
        "tinted_glass",
        "barrier",
        "structure_void",
        "light"
    ]);
    const supportedVersions = Object.values(vendor.SupportedVersions || {})
        .sort((a, b) => a.NBTVersion - b.NBTVersion);

    let selectedFile = null;
    let busy = false;

    function setStatus(message) {
        statusElement.textContent = message;
    }

    function setError(message) {
        errorElement.textContent = message || "";
        errorElement.hidden = !message;
    }

    function setProgress(value) {
        progressBar.style.width = `${Math.max(0, Math.min(100, value))}%`;
    }

    function setSelectedFile(file) {
        if (busy) return;
        selectedFile = file || null;
        dropZone.classList.toggle("has-file", !!selectedFile);
        fileHeading.textContent = selectedFile ? selectedFile.name : "Drop ZIP or NBT";
        fileHint.textContent = selectedFile
            ? `${(selectedFile.size / 1048576).toFixed(1)} MB · click to replace`
            : "or click to browse";
        reconstructButton.disabled = !selectedFile;
        setStatus(selectedFile ? selectedFile.name : "Drop a MapArtCraft ZIP or NBT here");
        setProgress(0);
        setError("");
        resultElement.classList.remove("visible");
        reportElement.replaceChildren();
    }

    function unwrapNbtValue(node) {
        if (node === null || node === undefined) return node;
        if (Array.isArray(node)) return node.map(unwrapNbtValue);
        if (ArrayBuffer.isView(node)) return node;
        if (typeof node !== "object") return node;
        if (Object.prototype.hasOwnProperty.call(node, "type")) {
            if (node.type === 9) {
                const list = node.value && Array.isArray(node.value.list) ? node.value.list : [];
                return list.map(unwrapNbtValue);
            }
            if (node.type === 10) return unwrapNbtValue(node.value);
            return node.value;
        }
        return Object.fromEntries(Object.entries(node).map(([key, value]) => [key, unwrapNbtValue(value)]));
    }

    function decompressNbtBytes(bytes) {
        if (bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) {
            if (!window.pako) throw new Error("The compression library did not load.");
            return pako.ungzip(bytes);
        }
        if (bytes.length >= 2 && (bytes[0] & 0x0f) === 8 && ((bytes[0] << 8) + bytes[1]) % 31 === 0) {
            if (!window.pako) throw new Error("The compression library did not load.");
            return pako.inflate(bytes);
        }
        return bytes;
    }

    function parseNbt(bytes) {
        const decoded = decompressNbtBytes(bytes);
        return unwrapNbtValue(new NBTParser(decoded).readTag());
    }

    function paletteEntryName(entry) {
        const properties = entry.Properties || {};
        const args = Object.entries(properties)
            .sort()
            .map(([key, value]) => `${key}=${value}`)
            .join(",");
        return `${entry.Name}[${args}]`;
    }

    function mapPaletteForVersion(version) {
        const result = new Map();
        Object.values(vendor.coloursJSON || {}).forEach(colourSet => {
            Object.values(colourSet.blocks || {}).forEach(block => {
                if (!block.validVersions || !(version in block.validVersions)) return;
                let versionData = block.validVersions[version];
                const seenAliases = new Set();
                while (typeof versionData === "string") {
                    if (seenAliases.has(versionData)) return;
                    seenAliases.add(versionData);
                    versionData = block.validVersions[versionData.slice(1)];
                }
                if (!versionData) return;
                const key = `minecraft:${versionData.NBTName}[${Object.entries(versionData.NBTArgs || {})
                    .sort()
                    .map(([name, value]) => `${name}=${value}`)
                    .join(",")}]`;
                result.set(key, colourSet.tonesRGB.light);
            });
        });
        return result;
    }

    function resolveStructurePalette(palette, version) {
        const knownColours = mapPaletteForVersion(version);
        const unknown = new Set();
        const resolved = palette.map(entry => {
            const blockName = String(entry.Name || "").replace("minecraft:", "");
            const name = paletteEntryName(entry);
            if (transparentBlocks.has(blockName)) return { rgb: null, kind: "transparent", name };
            if (["water", "flowing_water", "bubble_column"].includes(blockName)) {
                return { rgb: [64, 64, 255], kind: "water", name };
            }
            const rgb = knownColours.get(name);
            if (!rgb) unknown.add(name);
            return { rgb: rgb || [255, 0, 255], kind: rgb ? "known" : "unknown", name };
        });
        return { resolved, unknown };
    }

    function detectConstruction(heights, states, width, firstRow, depth, paletteNames) {
        let darker = 0;
        let normal = 0;
        let brighter = 0;
        let visible = 0;
        let min = Infinity;
        let max = -Infinity;

        for (let z = firstRow; z < firstRow + depth; z++) {
            for (let x = 0; x < width; x++) {
                const index = z * width + x;
                if (states[index] < 0) continue;
                visible++;
                min = Math.min(min, heights[index]);
                max = Math.max(max, heights[index]);
                const northHeight = heights[Math.max(firstRow - 1, z - 1) * width + x];
                const slope = 4 * (northHeight < -1000000000 ? 0 : heights[index] - northHeight) / 5
                    + 0.4 * (((x + z - firstRow) & 1) - 0.5);
                if (slope > 0.6) brighter++;
                else if (slope < -0.6) darker++;
                else normal++;
            }
        }

        const supportNames = paletteNames.filter(name => /cobblestone|netherrack|stone|planks|glass/.test(name));
        let mode = "Flat / no staircase shading";
        if (darker || brighter) {
            mode = darker && brighter
                ? "Height shaded (Classic or Valley compatible)"
                : brighter
                    ? "Height shaded, upward-only pattern"
                    : "Height shaded, downward-only pattern";
        }
        return {
            mode,
            darker,
            normal,
            brighter,
            visible,
            min: Number.isFinite(min) ? min : null,
            max: Number.isFinite(max) ? max : null,
            supportNames
        };
    }

    function detectSurface(materialCounts, resolvedPalette) {
        let carpet = 0;
        let fullBlock = 0;
        let greyCarpet = 0;
        const materials = [];

        materialCounts.forEach((count, state) => {
            if (!count) return;
            const name = resolvedPalette[state].name;
            if (/(^|:)\w*carpet(?:\[|$)/.test(name)) carpet += count;
            else fullBlock += count;
            if (/(^|:)(black|gray|light_gray|white)_carpet(?:\[|$)/.test(name)) greyCarpet += count;
            materials.push({ name, pixels: count });
        });
        materials.sort((a, b) => b.pixels - a.pixels || a.name.localeCompare(b.name));

        const total = carpet + fullBlock;
        return {
            type: carpet && fullBlock ? "Mixed carpet + full blocks" : carpet ? "Carpet map" : "Full-block map",
            carpet,
            fullBlock,
            greyCarpet,
            total,
            materials,
            greyLabel: greyCarpet === 0
                ? "No"
                : greyCarpet === total
                    ? "Yes — entirely grayscale carpet"
                    : `Yes — ${Math.round(greyCarpet / total * 1000) / 10}% of visible pixels`
        };
    }

    function decodeStructure(bytes, filename) {
        const nbt = parseNbt(bytes);
        const palette = nbt.palette || (nbt.palettes && nbt.palettes[0]);
        if (!Array.isArray(palette) || !Array.isArray(nbt.blocks) || !Array.isArray(nbt.size) || nbt.size.length !== 3) {
            throw new Error(`${filename}: unsupported structure NBT`);
        }

        const [width, , storedDepth] = nbt.size;
        const hasNorthEdge = width % 128 === 0 && storedDepth % 128 === 1;
        const depth = storedDepth - (hasNorthEdge ? 1 : 0);
        if (width <= 0 || depth <= 0) throw new Error(`${filename}: invalid structure dimensions`);

        const compatibleVersions = supportedVersions.filter(version => version.NBTVersion <= (nbt.DataVersion || 0));
        const version = (compatibleVersions.length ? compatibleVersions[compatibleVersions.length - 1] : supportedVersions[0]).MCVersion;
        const { resolved, unknown } = resolveStructurePalette(palette, version);
        const area = width * storedDepth;
        const heights = new Int32Array(area);
        heights.fill(-2147483648);
        const states = new Int32Array(area);
        states.fill(-1);
        const waterDepth = new Uint16Array(area);

        for (const block of nbt.blocks) {
            if (!Array.isArray(block.pos) || block.pos.length !== 3) continue;
            const [x, y, z] = block.pos;
            if (x < 0 || z < 0 || x >= width || z >= storedDepth || block.state < 0 || block.state >= resolved.length) continue;
            const index = z * width + x;
            if (resolved[block.state].kind === "water") waterDepth[index]++;
            if (resolved[block.state].kind !== "transparent" && y > heights[index]) {
                heights[index] = y;
                states[index] = block.state;
            }
        }

        const image = new ImageData(width, depth);
        const shadeCounts = [0, 0, 0];
        const materialCounts = new Map();
        for (let y = 0; y < depth; y++) {
            for (let x = 0; x < width; x++) {
                const sourceY = y + (hasNorthEdge ? 1 : 0);
                const sourceIndex = sourceY * width + x;
                const state = states[sourceIndex];
                if (state < 0) continue;
                materialCounts.set(state, (materialCounts.get(state) || 0) + 1);
                const northIndex = Math.max(0, sourceY - 1) * width + x;
                const heightDelta = heights[northIndex] < -1000000000 ? 0 : heights[sourceIndex] - heights[northIndex];
                const checker = (x + y) & 1;
                let shade;
                if (resolved[state].kind === "water") {
                    const waterShade = 0.1 * waterDepth[sourceIndex] + 0.2 * checker;
                    shade = waterShade < 0.5 ? 2 : waterShade > 0.9 ? 0 : 1;
                } else {
                    const slope = 4 * heightDelta / 5 + 0.4 * (checker - 0.5);
                    shade = slope > 0.6 ? 2 : slope < -0.6 ? 0 : 1;
                }
                shadeCounts[shade]++;
                const multiplier = [180, 220, 255][shade];
                const target = 4 * (y * width + x);
                image.data[target] = resolved[state].kind === "unknown" ? 255 : Math.floor(resolved[state].rgb[0] * multiplier / 255);
                image.data[target + 1] = resolved[state].kind === "unknown" ? 0 : Math.floor(resolved[state].rgb[1] * multiplier / 255);
                image.data[target + 2] = resolved[state].kind === "unknown" ? 255 : Math.floor(resolved[state].rgb[2] * multiplier / 255);
                image.data[target + 3] = 255;
            }
        }

        const paletteNames = palette.map(paletteEntryName);
        return {
            image,
            width,
            depth,
            version,
            dataVersion: nbt.DataVersion,
            hasNorthEdge,
            paletteNames,
            unknown: Array.from(unknown),
            construction: detectConstruction(heights, states, width, hasNorthEdge ? 1 : 0, depth, paletteNames),
            shadeCounts,
            surface: detectSurface(materialCounts, resolved)
        };
    }

    async function openInputFile(file) {
        const lowerName = file.name.toLowerCase();
        if (lowerName.endsWith(".nbt")) {
            return [{ name: file.name, bytes: new Uint8Array(await file.arrayBuffer()), position: { column: 0, row: 0 } }];
        }
        if (!lowerName.endsWith(".zip")) throw new Error("Choose a .zip or .nbt file.");
        if (!window.JSZip) throw new Error("The ZIP library did not load.");
        const zip = await JSZip.loadAsync(file);
        const entries = Object.values(zip.files)
            .filter(entry => !entry.dir && entry.name.toLowerCase().endsWith(".nbt"))
            .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));
        if (!entries.length) throw new Error("No .nbt files were found in this ZIP.");
        const positions = entries.map(entry => {
            const match = entry.name.match(/_(\d+)_(\d+)\.nbt$/i);
            return match ? { column: Number(match[1]), row: Number(match[2]) } : null;
        });
        return entries.map((entry, index) => ({ entry, name: entry.name, position: positions[index] }));
    }

    function arrangeTiles(tiles, columnsText) {
        if (tiles.length === 1) return { columns: 1, rows: 1, named: true };
        if (tiles.every(tile => tile.position)) {
            return {
                columns: Math.max(...tiles.map(tile => tile.position.column)) + 1,
                rows: Math.max(...tiles.map(tile => tile.position.row)) + 1,
                named: true
            };
        }
        const columns = Number(columnsText);
        if (!Number.isInteger(columns) || columns < 1) {
            throw new Error("Tile names do not contain _column_row coordinates. Enter the number of columns.");
        }
        tiles.forEach((tile, index) => {
            tile.position = { column: index % columns, row: Math.floor(index / columns) };
        });
        return { columns, rows: Math.ceil(tiles.length / columns), named: false };
    }

    async function tileBytes(tile) {
        return tile.bytes || new Uint8Array(await tile.entry.async("arraybuffer"));
    }

    function addDefinition(list, term, description) {
        const row = document.createElement("div");
        const dt = document.createElement("dt");
        const dd = document.createElement("dd");
        dt.textContent = term;
        dd.textContent = description;
        row.append(dt, dd);
        list.appendChild(row);
    }

    function addDetails(parent, label, text, error) {
        const details = document.createElement("details");
        const summary = document.createElement("summary");
        const content = document.createElement("p");
        summary.textContent = label;
        content.className = `reverse-code${error ? " reverse-error" : ""}`;
        content.textContent = text;
        details.append(summary, content);
        parent.appendChild(details);
    }

    function downloadReconstructedImage() {
        if (!selectedFile) return;
        canvas.toBlob(blob => {
            if (!blob) return;
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `${selectedFile.name.replace(/\.(zip|nbt)$/i, "")}_reconstructed.png`;
            link.click();
            setTimeout(() => URL.revokeObjectURL(link.href), 1000);
        }, "image/png");
    }

    function renderReport(report) {
        reportElement.replaceChildren();
        const head = document.createElement("div");
        head.className = "reverse-report-head";
        const titleGroup = document.createElement("div");
        const eyebrow = document.createElement("span");
        const title = document.createElement("h2");
        eyebrow.textContent = "Detected build";
        title.textContent = `${report.grid.columns} × ${report.grid.rows} maps`;
        titleGroup.append(eyebrow, title);
        const downloadButton = document.createElement("button");
        downloadButton.type = "button";
        downloadButton.className = "reverse-download";
        downloadButton.textContent = "Download PNG";
        downloadButton.addEventListener("click", downloadReconstructedImage);
        head.append(titleGroup, downloadButton);

        const list = document.createElement("dl");
        addDefinition(list, "Resolution", `${report.width} × ${report.height}`);
        addDefinition(list, "NBT files", `${report.files - report.failures} / ${report.files}`);
        addDefinition(list, "Minecraft palette", report.versions.join(", "));
        addDefinition(list, "Construction", report.modes.join(", "));
        addDefinition(list, "Surface material", `${report.surfaceType} · ${report.surfaceTotals.carpet.toLocaleString()} carpet pixels · ${report.surfaceTotals.fullBlock.toLocaleString()} full-block pixels`);
        addDefinition(list, "Grey-shade carpet", `${report.greyLabel} · ${report.surfaceTotals.greyCarpet.toLocaleString()} pixels`);
        addDefinition(list, "Map shades", `${report.shades[0].toLocaleString()} dark · ${report.shades[1].toLocaleString()} normal · ${report.shades[2].toLocaleString()} bright`);
        addDefinition(list, "Support candidates", report.support.length ? report.support.join(", ") : "None detected");
        addDefinition(list, "Tile ordering", report.named ? "MapArtCraft filename coordinates" : "Manual columns + ZIP order");
        addDefinition(list, "Unknown blocks", report.unknown.length ? report.unknown.join(", ") : "None");

        reportElement.append(head, list);
        addDetails(reportElement, `Detected block palette (${report.blocks.length})`, report.blocks.join("\n"), false);
        addDetails(
            reportElement,
            `Visible surface materials (${report.surfaceMaterials.length})`,
            report.surfaceMaterials.map(entry => `${entry.name}: ${entry.pixels.toLocaleString()} pixels`).join("\n"),
            false
        );
        if (report.errors.length) addDetails(reportElement, `Failed files (${report.errors.length})`, report.errors.join("\n"), true);

        const note = document.createElement("p");
        note.className = "reverse-note";
        note.textContent = "Classic and Valley use different physical layouts to produce the same map shading. The schematic may suggest a mode, but cannot always prove which menu option created it. Better Colour, dithering, crop, and RGB propagation happen before export and are not stored in NBT, so the reverse report cannot truthfully recover those menu values.";
        reportElement.appendChild(note);
    }

    async function reconstruct() {
        if (busy) return;
        if (!selectedFile) {
            setError("Choose a ZIP or NBT first.");
            return;
        }

        busy = true;
        reconstructButton.disabled = true;
        reconstructButton.textContent = "Reconstructing…";
        setError("");
        setProgress(0);
        setStatus("Opening input…");
        resultElement.classList.remove("visible");
        await new Promise(resolve => setTimeout(resolve, 0));

        try {
            const tiles = await openInputFile(selectedFile);
            const grid = arrangeTiles(tiles, columnsInput.value);
            if (128 * grid.columns > 32767 || 128 * grid.rows > 32767) {
                throw new Error("This browser cannot create a canvas larger than 32,767 pixels per side.");
            }

            canvas.width = 128 * grid.columns;
            canvas.height = 128 * grid.rows;
            const context = canvas.getContext("2d", { alpha: true });
            context.clearRect(0, 0, canvas.width, canvas.height);

            const decoded = [];
            const unknown = new Set();
            const palette = new Set();
            let failures = 0;

            for (let index = 0; index < tiles.length; index++) {
                const tile = tiles[index];
                try {
                    const structure = decodeStructure(await tileBytes(tile), tile.name);
                    if (tiles.length === 1) {
                        grid.columns = Math.ceil(structure.width / 128);
                        grid.rows = Math.ceil(structure.depth / 128);
                        canvas.width = structure.width;
                        canvas.height = structure.depth;
                    }
                    if (tiles.length > 1 && (structure.width !== 128 || structure.depth !== 128)) {
                        throw new Error("split tile is not 128×128 pixels");
                    }
                    context.putImageData(structure.image, 128 * tile.position.column, 128 * tile.position.row);
                    structure.unknown.forEach(name => unknown.add(name));
                    structure.paletteNames.forEach(name => palette.add(name));
                    decoded.push(structure);
                } catch (error) {
                    failures++;
                    decoded.push({ error: `${tile.name}: ${error.message}` });
                }
                setProgress((index + 1) / tiles.length * 100);
                setStatus(`Reading and rendering ${index + 1} / ${tiles.length}`);
                if (index % 10 === 0) await new Promise(resolve => setTimeout(resolve, 0));
            }

            const successful = decoded.filter(entry => !entry.error);
            if (!successful.length) throw new Error("No compatible MapArtCraft structures could be rendered.");

            const modes = Array.from(new Set(successful.map(entry => entry.construction.mode)));
            const support = Array.from(new Set(successful.flatMap(entry => entry.construction.supportNames)));
            const shades = successful.reduce(
                (totals, entry) => totals.map((value, index) => value + entry.shadeCounts[index]),
                [0, 0, 0]
            );
            const surfaceTotals = successful.reduce((totals, entry) => ({
                carpet: totals.carpet + entry.surface.carpet,
                fullBlock: totals.fullBlock + entry.surface.fullBlock,
                greyCarpet: totals.greyCarpet + entry.surface.greyCarpet,
                total: totals.total + entry.surface.total
            }), { carpet: 0, fullBlock: 0, greyCarpet: 0, total: 0 });
            const surfaceTypes = Array.from(new Set(successful.map(entry => entry.surface.type)));
            const surfaceType = surfaceTypes.length === 1 ? surfaceTypes[0] : "Mixed carpet + full blocks";
            const greyLabel = surfaceTotals.greyCarpet === 0
                ? "No"
                : surfaceTotals.greyCarpet === surfaceTotals.total
                    ? "Yes — entirely grayscale carpet"
                    : `Yes — ${Math.round(surfaceTotals.greyCarpet / surfaceTotals.total * 1000) / 10}% of visible pixels`;
            const materialTotals = new Map();
            successful.forEach(entry => entry.surface.materials.forEach(material => {
                materialTotals.set(material.name, (materialTotals.get(material.name) || 0) + material.pixels);
            }));
            const surfaceMaterials = Array.from(materialTotals, ([name, pixels]) => ({ name, pixels }))
                .sort((a, b) => b.pixels - a.pixels || a.name.localeCompare(b.name));

            const report = {
                files: tiles.length,
                failures,
                grid,
                width: canvas.width,
                height: canvas.height,
                versions: Array.from(new Set(successful.map(entry => `${entry.version} (DataVersion ${entry.dataVersion})`))),
                modes,
                support,
                shades,
                surfaceTotals,
                surfaceType,
                greyLabel,
                surfaceMaterials,
                unknown: Array.from(unknown),
                blocks: Array.from(palette),
                errors: decoded.filter(entry => entry.error).map(entry => entry.error),
                named: grid.named
            };
            renderReport(report);
            resultElement.classList.add("visible");
            setStatus(`Complete — ${canvas.width} × ${canvas.height}`);
        } catch (error) {
            setError(error && error.message ? error.message : String(error));
            setStatus("Reconstruction stopped");
        } finally {
            busy = false;
            reconstructButton.disabled = !selectedFile;
            reconstructButton.textContent = "Reconstruct Image";
        }
    }

    dropZone.addEventListener("click", event => {
        if (!busy && event.target !== fileInput) fileInput.click();
    });
    dropZone.addEventListener("dragover", event => {
        event.preventDefault();
        if (!busy) dropZone.classList.add("drag-over");
    });
    dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
    dropZone.addEventListener("drop", event => {
        event.preventDefault();
        dropZone.classList.remove("drag-over");
        if (!busy) setSelectedFile(event.dataTransfer.files[0]);
    });
    fileInput.addEventListener("change", event => setSelectedFile(event.target.files[0]));
    reconstructButton.addEventListener("click", reconstruct);
})();
