// Mapart Studio converter preview worker.
//
// Runs MapArtCraft-derived GPL-3.0 conversion work off the browser UI thread.
// See NOTICE.md, LICENSE.txt, and vendor/mapartcraft/LICENSE.

self.window = self;
importScripts("mapartcraft_vendor_data.js", "mapartcraft_exact.js");

const MAPARTCRAFT_VENDOR = self.MAPARTCRAFT_VENDOR_DATA || {};
const MAPARTCRAFT_EXACT = self.MapartCraftExact || null;

let exactRgbCache = null;

function exactColourForRgb(rgb) {
    if (!exactRgbCache) {
        exactRgbCache = new Map();
        for (const [colourSetId, colourSet] of Object.entries(MAPARTCRAFT_VENDOR.coloursJSON || {})) {
            for (const [tone, toneRgb] of Object.entries(colourSet.tonesRGB || {})) {
                exactRgbCache.set(`${toneRgb[0]},${toneRgb[1]},${toneRgb[2]}`, { colourSetId, tone });
            }
        }
    }
    return exactRgbCache.get(`${rgb[0]},${rgb[1]},${rgb[2]}`);
}

function mapColorShadeForTone(tone) {
    return tone === "light" ? 2 : tone === "unobtainable" ? 3 : tone === "normal" ? 1 : 0;
}

function mapColorByteForExactMatch(match) {
    if (!match) return 1;
    const shade = mapColorShadeForTone(match.tone);
    const mapartId = MAPARTCRAFT_VENDOR.coloursJSON?.[match.colourSetId]?.mapdatId ?? (parseInt(match.colourSetId, 10) || 0);
    return mapartId * 4 + shade;
}

function mapColorByteForConvertedDataOffset(data, offset) {
    if (!data || data[offset + 3] === 0) return 0;
    return mapColorByteForExactMatch(exactColourForRgb([data[offset], data[offset + 1], data[offset + 2]]));
}

function convertPreview(message) {
    if (!MAPARTCRAFT_EXACT) throw new Error("MapArtCraft converter engine is not available.");

    const { jobId, width, height, sourceBuffer, conversionArgs } = message;
    const sourceData = new Uint8ClampedArray(sourceBuffer);
    const imageData = new ImageData(sourceData, width, height);
    const args = {
        ...conversionArgs,
        data: MAPARTCRAFT_VENDOR,
        onProgress(progress) {
            self.postMessage({
                type: "progress",
                jobId,
                progress: Math.max(0, Math.min(1, Number(progress) || 0))
            });
        }
    };

    self.postMessage({ type: "progress", jobId, progress: 0 });
    const converted = MAPARTCRAFT_EXACT.convertImageData(imageData, args);
    const pixelsData = converted.pixels.data;
    const totalPixels = width * height;
    const mapColorBytes = new Uint8Array(totalPixels);
    for (let index = 0, offset = 0; index < totalPixels; index++, offset += 4) {
        mapColorBytes[index] = mapColorByteForConvertedDataOffset(pixelsData, offset);
    }

    self.postMessage({
        type: "result",
        jobId,
        width,
        height,
        pixelsBuffer: pixelsData.buffer,
        mapColorBytesBuffer: mapColorBytes.buffer,
        maps: converted.maps,
        currentSelectedBlocks: converted.currentSelectedBlocks
    }, [pixelsData.buffer, mapColorBytes.buffer]);
}

self.onmessage = event => {
    try {
        if (!event.data || event.data.type !== "convert") return;
        convertPreview(event.data);
    } catch (error) {
        self.postMessage({
            type: "error",
            jobId: event.data && event.data.jobId,
            message: error && error.message ? error.message : String(error)
        });
    }
};
