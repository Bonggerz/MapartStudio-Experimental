// Adapted from MapArtCraft GPL-3.0 source:
// vendor/mapartcraft/src/components/mapart/workers/mapCanvas.js
// vendor/mapartcraft/src/components/mapart/mapPreview.js
(function () {
    const alphaColorIdx = 61;

    function rgb2lab(rgb, cache) {
        const val = (rgb[0] << 16) + (rgb[1] << 8) + rgb[2];
        if (cache.lab.has(val)) return cache.lab.get(val);

        let r1 = rgb[0] / 255.0;
        let g1 = rgb[1] / 255.0;
        let b1 = rgb[2] / 255.0;

        r1 = 0.04045 >= r1 ? (r1 /= 12.0) : Math.pow((r1 + 0.055) / 1.055, 2.4);
        g1 = 0.04045 >= g1 ? (g1 /= 12.0) : Math.pow((g1 + 0.055) / 1.055, 2.4);
        b1 = 0.04045 >= b1 ? (b1 /= 12.0) : Math.pow((b1 + 0.055) / 1.055, 2.4);

        const f = (0.43605202 * r1 + 0.3850816 * g1 + 0.14308742 * b1) / 0.964221;
        const h = 0.22249159 * r1 + 0.71688604 * g1 + 0.060621485 * b1;
        const k = (0.013929122 * r1 + 0.097097 * g1 + 0.7141855 * b1) / 0.825211;
        const l = 0.008856452 < h ? Math.pow(h, 1 / 3) : (903.2963 * h + 16.0) / 116.0;
        const m = 500.0 * ((0.008856452 < f ? Math.pow(f, 1 / 3) : (903.2963 * f + 16.0) / 116.0) - l);
        const n = 200.0 * (l - (0.008856452 < k ? Math.pow(k, 1 / 3) : (903.2963 * k + 16.0) / 116.0));
        const lab = [2.55 * (116.0 * l - 16.0) + 0.5, m + 0.5, n + 0.5];
        cache.lab.set(val, lab);
        return lab;
    }

    function labF(y) {
        return 0.00885645167903563 < y ? Math.cbrt(y) : (903.2962962962963 * y + 16) / 116;
    }

    function rgb2lab50(rgb, cache) {
        const val = (rgb[0] << 16) + (rgb[1] << 8) + rgb[2];
        if (cache.lab50.has(val)) return cache.lab50.get(val);

        const r1 = rgb[0] / 255.0;
        const g1 = rgb[1] / 255.0;
        const b1 = rgb[2] / 255.0;
        const x = (0.436065742824811 * r1 + 0.3851514688337912 * g1 + 0.14307845442264197 * b1) / 0.9642956764295676;
        const y = 0.22249319175623702 * r1 + 0.7168870538238823 * g1 + 0.06061979053616537 * b1;
        const z = (0.013923904500943465 * r1 + 0.09708128566574634 * g1 + 0.7140993584005155 * b1) / 0.8251046025104603;
        const f1 = labF(y);
        let l = 116 * f1 - 16;
        let a = 0;
        let b = 0;

        if (r1 !== g1 || g1 !== b1) {
            const f0 = labF(x);
            const f2 = labF(z);
            a = 500 * (f0 - f1);
            b = 200 * (f1 - f2);
        }

        const lab = [l, a, b];
        cache.lab50.set(val, lab);
        return lab;
    }

    function rgb2lab65(rgb, cache) {
        const val = (rgb[0] << 16) + (rgb[1] << 8) + rgb[2];
        if (cache.lab65.has(val)) return cache.lab65.get(val);

        const r1 = rgb[0] / 255.0;
        const g1 = rgb[1] / 255.0;
        const b1 = rgb[2] / 255.0;
        const x = (0.4123907992659593 * r1 + 0.357584339383878 * g1 + 0.1804807884018343 * b1) / 0.9504559270516717;
        const y = 0.2126390058715102 * r1 + 0.715168678767756 * g1 + 0.0721923153607337 * b1;
        const z = (0.0193308187155918 * r1 + 0.119194779794626 * g1 + 0.9505321522496607 * b1) / 1.0890577507598784;
        const f1 = labF(y);
        let l = 116 * f1 - 16;
        let a = 0;
        let b = 0;

        if (r1 !== g1 || g1 !== b1) {
            const f0 = labF(x);
            const f2 = labF(z);
            a = 500 * (f0 - f1);
            b = 200 * (f1 - f2);
        }

        const lab = [l, a, b];
        cache.lab65.set(val, lab);
        return lab;
    }

    function linearized(channel) {
        const normalized = channel / 255.0;
        return normalized <= 0.040449936 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
    }

    function signum(num) {
        return num < 0 ? -1 : num > 0 ? 1 : 0;
    }

    function rgb2hct(rgb, cache) {
        const val = (rgb[0] << 16) + (rgb[1] << 8) + rgb[2];
        if (cache.hct.has(val)) return cache.hct.get(val);

        const r1 = linearized(rgb[0]);
        const g1 = linearized(rgb[1]);
        const b1 = linearized(rgb[2]);
        const x = 0.41233895 * r1 + 0.35762064 * g1 + 0.18051042 * b1;
        const y = 0.2126 * r1 + 0.7152 * g1 + 0.0722 * b1;
        const z = 0.01932141 * r1 + 0.11916382 * g1 + 0.95034478 * b1;
        const rD = (0.401288 * x + 0.650173 * y - 0.051461 * z) * 1.02117770275752;
        const gD = (-0.250268 * x + 1.204414 * y + 0.045854 * z) * 0.9863077294280124;
        const bD = (-0.002079 * x + 0.048952 * y + 0.953127 * z) * 0.9339605082802299;
        const rAF = Math.pow((0.3884814537800353 * Math.abs(rD)) / 100.0, 0.42);
        const gAF = Math.pow((0.3884814537800353 * Math.abs(gD)) / 100.0, 0.42);
        const bAF = Math.pow((0.3884814537800353 * Math.abs(bD)) / 100.0, 0.42);
        const rA = (signum(rD) * 400.0 * rAF) / (rAF + 27.13);
        const gA = (signum(gD) * 400.0 * gAF) / (gAF + 27.13);
        const bA = (signum(bD) * 400.0 * bAF) / (bAF + 27.13);
        const a = (11.0 * rA + -12.0 * gA + bA) / 11.0;
        const b = (rA + gA - 2.0 * bA) / 9.0;
        const u = (20.0 * rA + 20.0 * gA + 21.0 * bA) / 20.0;
        const p2 = (40.0 * rA + 20.0 * gA + bA) / 20.0;
        const atan2 = Math.atan2(b, a);
        const atanDegrees = (atan2 * 180.0) / Math.PI;
        const hue = atanDegrees < 0 ? atanDegrees + 360.0 : atanDegrees >= 360 ? atanDegrees - 360.0 : atanDegrees;
        const hueRadians = (hue * Math.PI) / 180.0;
        const j = 100.0 * Math.pow(p2 * 0.03391879108791669, 1.3173270022537198);
        const huePrime = hue < 20.14 ? hue + 360 : hue;
        const p1 = 3911.227617099521 * 0.25 * (Math.cos((huePrime * Math.PI) / 180.0 + 2.0) + 3.8);
        const t = (p1 * Math.sqrt(a * a + b * b)) / (u + 0.305);
        const alpha = Math.pow(t, 0.9) * 0.8834525670408592;
        const m = alpha * Math.sqrt(j / 100.0) * 0.7894826179304937;
        const mstar = 43.859649122807014 * Math.log(1.0 + 0.0228 * m);
        const hct = [116.0 * labF(y) - 16.0, mstar * Math.cos(hueRadians), mstar * Math.sin(hueRadians)];
        cache.hct.set(val, hct);
        return hct;
    }

    function colourDistance(pixel1, pixel2, colourMethod, ColourMethods, cache) {
        let p1 = pixel1;
        let p2 = pixel2;
        if (colourMethod === ColourMethods.MapartCraftDefault.uniqueId) {
            p1 = rgb2lab(pixel1, cache);
            p2 = rgb2lab(pixel2, cache);
        } else if ([ColourMethods.Cie76_Lab50.uniqueId, ColourMethods.Cie76_Lab65.uniqueId, ColourMethods.Hct.uniqueId].includes(colourMethod)) {
            p1 = colourMethod === ColourMethods.Cie76_Lab50.uniqueId ? rgb2lab50(pixel1, cache)
                : colourMethod === ColourMethods.Cie76_Lab65.uniqueId ? rgb2lab65(pixel1, cache)
                    : rgb2hct(pixel1, cache);
            p2 = colourMethod === ColourMethods.Cie76_Lab50.uniqueId ? rgb2lab50(pixel2, cache)
                : colourMethod === ColourMethods.Cie76_Lab65.uniqueId ? rgb2lab65(pixel2, cache)
                    : rgb2hct(pixel2, cache);
        } else if ([ColourMethods.Ciede2000_Lab50.uniqueId, ColourMethods.Ciede2000_Lab65.uniqueId].includes(colourMethod)) {
            p1 = colourMethod === ColourMethods.Ciede2000_Lab50.uniqueId ? rgb2lab50(pixel1, cache) : rgb2lab65(pixel1, cache);
            p2 = colourMethod === ColourMethods.Ciede2000_Lab50.uniqueId ? rgb2lab50(pixel2, cache) : rgb2lab65(pixel2, cache);
            return ciede2000(p1, p2);
        }

        const l = p1[0] - p2[0];
        const a = p1[1] - p2[1];
        const b = p1[2] - p2[2];
        return l * l + a * a + b * b;
    }

    function ciede2000(pixel1, pixel2) {
        const lStd = pixel1[0];
        const aStd = pixel1[1];
        const bStd = pixel1[2];
        const cStd = Math.sqrt(aStd * aStd + bStd * bStd);
        const lSmp = pixel2[0];
        const aSmp = pixel2[1];
        const bSmp = pixel2[2];
        const cSmp = Math.sqrt(aSmp * aSmp + bSmp * bSmp);
        const cAvg = (cStd + cSmp) / 2;
        const cAvgPow7 = Math.pow(cAvg, 7);
        const g = 0.5 * (1 - Math.sqrt(cAvgPow7 / (cAvgPow7 + Math.pow(25, 7))));
        const apStd = aStd * (1 + g);
        const apSmp = aSmp * (1 + g);
        const cpStd = Math.sqrt(apStd * apStd + bStd * bStd);
        const cpSmp = Math.sqrt(apSmp * apSmp + bSmp * bSmp);
        let hpStd = Math.abs(apStd) + Math.abs(bStd) === 0 ? 0 : Math.atan2(bStd, apStd);
        hpStd += (hpStd < 0) * 2 * Math.PI;
        let hpSmp = Math.abs(apSmp) + Math.abs(bSmp) === 0 ? 0 : Math.atan2(bSmp, apSmp);
        hpSmp += (hpSmp < 0) * 2 * Math.PI;
        const dL = lSmp - lStd;
        const dC = cpSmp - cpStd;
        const cpZero = cpStd === 0 && cpSmp === 0;
        let dhp = cpZero ? 0 : hpSmp - hpStd;
        dhp -= (dhp > Math.PI) * 2 * Math.PI;
        dhp += (dhp < -Math.PI) * 2 * Math.PI;
        const dH = 2 * Math.sqrt(cpStd * cpSmp) * Math.sin(dhp / 2);
        const lp = (lStd + lSmp) / 2;
        const cp = (cpStd + cpSmp) / 2;
        let hp;
        if (cpZero) {
            hp = hpStd + hpSmp;
        } else {
            hp = (hpStd + hpSmp) / 2;
            hp -= (Math.abs(hpStd - hpSmp) > Math.PI) * Math.PI;
            hp += (hp < 0) * 2 * Math.PI;
        }
        const lpm50 = (lp - 50) * (lp - 50);
        const t = 1 - 0.17 * Math.cos(hp - Math.PI / 6) + 0.24 * Math.cos(2 * hp) + 0.32 * Math.cos(3 * hp + Math.PI / 30) - 0.2 * Math.cos(4 * hp - (63 * Math.PI) / 180);
        const sl = 1 + (0.015 * lpm50) / Math.sqrt(20 + lpm50);
        const sc = 1 + 0.045 * cp;
        const sh = 1 + 0.015 * cp * t;
        const deltaTheta = ((30 * Math.PI) / 180) * Math.exp(-1 * Math.pow(((180 / Math.PI) * hp - 275) / 25, 2));
        const rc = 2 * Math.sqrt(Math.pow(cp, 7) / (Math.pow(cp, 7) + Math.pow(25, 7)));
        const rt = -1 * Math.sin(2 * deltaTheta) * rc;
        return Math.pow(dL / sl, 2) + Math.pow(dC / sc, 2) + Math.pow(dH / sh, 2) + (((rt * dC) / sc) * dH) / sh;
    }

    function createContext(coloursJSON, selectedBlocks, disabledTones, MapModes, mode, staircasing) {
        const colourSetsToUse = [];
        const modeConfig = Object.values(MapModes).find((mapMode) => mapMode.uniqueId === mode);
        const stairConfig = Object.values(modeConfig.staircaseModes).find((staircaseMode) => staircaseMode.uniqueId === staircasing);
        for (const colourSetId of Object.keys(selectedBlocks)) {
            if (String(selectedBlocks[colourSetId]) === "-1") continue;
            const tonesRGB = {};
            for (const toneKey of stairConfig.toneKeys) {
                if (disabledTones[colourSetId] && disabledTones[colourSetId].has(toneKey)) continue;
                tonesRGB[toneKey] = coloursJSON[colourSetId].tonesRGB[toneKey];
            }
            if (Object.keys(tonesRGB).length) colourSetsToUse.push({ colourSetId, tonesRGB });
        }
        return {
            colourSetsToUse,
            exactColourCache: new Map(),
            colourCache: new Map(),
            lab: new Map(),
            lab50: new Map(),
            lab65: new Map(),
            hct: new Map()
        };
    }

    function setupExactColourCache(coloursJSON, cache) {
        for (const [colourSetId, colourSet] of Object.entries(coloursJSON)) {
            for (const [toneKey, toneRGB] of Object.entries(colourSet.tonesRGB)) {
                cache.exactColourCache.set((toneRGB[0] << 16) + (toneRGB[1] << 8) + toneRGB[2], { colourSetId, tone: toneKey });
            }
        }
    }

    function exactRGBToColourSetIdAndTone(rgb, cache) {
        return cache.exactColourCache.get((rgb[0] << 16) + (rgb[1] << 8) + rgb[2]);
    }

    function colourSetIdAndToneToRGB(coloursJSON, colourSetId, tone) {
        return coloursJSON[colourSetId].tonesRGB[tone];
    }

    function findClosest(coloursJSON, rgb, settings, cache) {
        const key = (rgb[0] << 16) + (rgb[1] << 8) + rgb[2];
        if (cache.colourCache.has(key)) return cache.colourCache.get(key);
        let shortestDistance = 9999999;
        let closestPixel = null;
        for (const colourSet of cache.colourSetsToUse) {
            for (const [toneKey, toneRGB] of Object.entries(colourSet.tonesRGB)) {
                const squareDistance = colourDistance(toneRGB, rgb, settings.betterColour, settings.ColourMethods, cache);
                if (squareDistance < shortestDistance) {
                    shortestDistance = squareDistance;
                    closestPixel = { colourSetId: colourSet.colourSetId, tone: toneKey };
                }
            }
        }
        cache.colourCache.set(key, closestPixel);
        return closestPixel;
    }

    function findClosest2(coloursJSON, rgb, settings, cache) {
        const key = (rgb[0] << 16) + (rgb[1] << 8) + rgb[2];
        if (cache.colourCache.has(key)) return cache.colourCache.get(key);
        let shortestDistance1 = 9999999;
        let shortestDistance2 = 9999999;
        let closestPixel1 = { colourSetId: null, tone: null };
        let closestPixel2 = { colourSetId: null, tone: null };
        for (const colourSet of cache.colourSetsToUse) {
            for (const [toneKey, toneRGB] of Object.entries(colourSet.tonesRGB)) {
                const squareDistance = colourDistance(toneRGB, rgb, settings.betterColour, settings.ColourMethods, cache);
                if (squareDistance < shortestDistance1) {
                    shortestDistance1 = squareDistance;
                    closestPixel1 = { colourSetId: colourSet.colourSetId, tone: toneKey };
                }
                if (
                    squareDistance < shortestDistance2 &&
                    colourSetIdAndToneToRGB(coloursJSON, closestPixel1.colourSetId, closestPixel1.tone) !== toneRGB
                ) {
                    shortestDistance2 = squareDistance;
                    closestPixel2 = { colourSetId: colourSet.colourSetId, tone: toneKey };
                }
            }
        }
        if (
            shortestDistance2 !== 9999999 &&
            colourDistance(
                colourSetIdAndToneToRGB(coloursJSON, closestPixel1.colourSetId, closestPixel1.tone),
                colourSetIdAndToneToRGB(coloursJSON, closestPixel2.colourSetId, closestPixel2.tone),
                settings.betterColour,
                settings.ColourMethods,
                cache
            ) <= shortestDistance2
        ) {
            closestPixel2 = closestPixel1;
        }
        const result = [shortestDistance1, shortestDistance2, closestPixel1, closestPixel2];
        cache.colourCache.set(key, result);
        return result;
    }

    function isSupportMandatory(coloursJSON, selectedBlocks, pixel) {
        return coloursJSON[pixel.colourSetId].blocks[selectedBlocks[pixel.colourSetId]].supportBlockMandatory;
    }

    function initMaps(widthMaps, heightMaps, colourSetsToUse, schematicMode) {
        const maps = [];
        for (let y = 0; y < heightMaps; y++) {
            const row = [];
            for (let x = 0; x < widthMaps; x++) {
                const map = { materials: {}, supportBlockCount: schematicMode ? 128 : 0 };
                colourSetsToUse.forEach((colourSet) => {
                    map.materials[colourSet.colourSetId] = 0;
                });
                row.push(map);
            }
            maps.push(row);
        }
        return maps;
    }

    function convertImageData(imageData, args) {
        const { coloursJSON, MapModes, WhereSupportBlocksModes, ColourMethods, DitherMethods } = args.data;
        const settings = { ...args, ColourMethods };
        const cache = createContext(coloursJSON, args.selectedBlocks, args.disabledTones, MapModes, args.mode, args.staircasing);
        setupExactColourCache(coloursJSON, cache);
        const maps = initMaps(args.mapSizeX, args.mapSizeY, cache.colourSetsToUse, args.mode === MapModes.SCHEMATIC_NBT.uniqueId);
        if (cache.colourSetsToUse.length === 0) return { pixels: imageData, maps, currentSelectedBlocks: args.selectedBlocks };

        const data = imageData.data;
        const dither = Object.values(DitherMethods).find((method) => method.uniqueId === args.dithering) || DitherMethods.None;
        const ditherMatrix = dither.uniqueId !== DitherMethods.None.uniqueId ? dither.ditherMatrix : null;
        const divisor = dither.ditherDivisor;
        const errorDiffusionIds = [
            DitherMethods.FloydSteinberg.uniqueId, DitherMethods.FloydSteinberg_20.uniqueId, DitherMethods.FloydSteinberg_24.uniqueId,
            DitherMethods.Atkinson.uniqueId, DitherMethods.Atkinson_6.uniqueId, DitherMethods.Atkinson_10.uniqueId, DitherMethods.Atkinson_12.uniqueId,
            DitherMethods.SierraFilterLite.uniqueId, DitherMethods.Fan.uniqueId, DitherMethods.ShiauFan.uniqueId, DitherMethods.ShiauFan2.uniqueId,
            DitherMethods.JarvisJudiceNinke.uniqueId, DitherMethods.Stucki.uniqueId, DitherMethods.Burkes.uniqueId, DitherMethods.Sierra.uniqueId,
            DitherMethods.SierraTworow.uniqueId
        ];
        const orderedIds = [
            DitherMethods.Bayer22.uniqueId, DitherMethods.Bayer33.uniqueId, DitherMethods.Bayer44.uniqueId, DitherMethods.Bayer88.uniqueId,
            DitherMethods.Ordered33.uniqueId, DitherMethods.ClusterDot44.uniqueId, DitherMethods.Halftone88.uniqueId, DitherMethods.VoidAndCluster1414.uniqueId
        ];

        for (let i = 0; i < data.length; i += 4) {
            const multimapWidth = args.mapSizeX * 128;
            const multimapX = (i / 4) % multimapWidth;
            const multimapY = (i / 4 - multimapX) / multimapWidth;
            const whichMapX = Math.floor(multimapX / 128);
            const whichMapY = Math.floor(multimapY / 128);
            const individualMapY = multimapY % 128;
            let closestPixel;

            if (args.mode === MapModes.MAPDAT.uniqueId && args.transparency && data[i + 3] < args.transparencyTolerance) {
                data[i] = 0;
                data[i + 1] = 0;
                data[i + 2] = 0;
                data[i + 3] = 0;
            } else {
                if (data[i + 3] !== 0 || args.selectedBlocks[alphaColorIdx] < 0) data[i + 3] = 255;
                const oldPixel = [data[i], data[i + 1], data[i + 2]];
                if (dither.uniqueId === DitherMethods.None.uniqueId) {
                    closestPixel = findClosest(coloursJSON, oldPixel, settings, cache);
                } else if (orderedIds.includes(dither.uniqueId)) {
                    const newPixels = findClosest2(coloursJSON, oldPixel, settings, cache);
                    closestPixel = (newPixels[0] * (ditherMatrix[0].length * ditherMatrix.length + 1)) / newPixels[1] >
                        ditherMatrix[multimapX % ditherMatrix[0].length][multimapY % ditherMatrix.length]
                        ? newPixels[3]
                        : newPixels[2];
                } else if (errorDiffusionIds.includes(dither.uniqueId)) {
                    closestPixel = findClosest(coloursJSON, oldPixel, settings, cache);
                }

                const closestColour = colourSetIdAndToneToRGB(coloursJSON, closestPixel.colourSetId, closestPixel.tone);
                data[i] = closestColour[0];
                data[i + 1] = closestColour[1];
                data[i + 2] = closestColour[2];

                if (errorDiffusionIds.includes(dither.uniqueId)) {
                    const error = [
                        (oldPixel[0] - closestColour[0]) * args.propagationRed / 100.0,
                        (oldPixel[1] - closestColour[1]) * args.propagationGreen / 100.0,
                        (oldPixel[2] - closestColour[2]) * args.propagationBlue / 100.0
                    ];
                    if (multimapX + 1 < multimapWidth) {
                        let weight = ditherMatrix[0][3] / divisor;
                        data[i + 4] += error[0] * weight; data[i + 5] += error[1] * weight; data[i + 6] += error[2] * weight;
                        if (multimapX + 2 < multimapWidth) {
                            weight = ditherMatrix[0][4] / divisor;
                            data[i + 8] += error[0] * weight; data[i + 9] += error[1] * weight; data[i + 10] += error[2] * weight;
                        }
                    }
                    if (multimapX > 0) {
                        let weight = ditherMatrix[1][1] / divisor;
                        data[i + multimapWidth * 4 - 4] += error[0] * weight; data[i + multimapWidth * 4 - 3] += error[1] * weight; data[i + multimapWidth * 4 - 2] += error[2] * weight;
                        if (multimapX > 1) {
                            weight = ditherMatrix[1][0] / divisor;
                            data[i + multimapWidth * 4 - 8] += error[0] * weight; data[i + multimapWidth * 4 - 7] += error[1] * weight; data[i + multimapWidth * 4 - 6] += error[2] * weight;
                        }
                    }
                    let weight = ditherMatrix[1][2] / divisor;
                    data[i + multimapWidth * 4] += error[0] * weight; data[i + multimapWidth * 4 + 1] += error[1] * weight; data[i + multimapWidth * 4 + 2] += error[2] * weight;
                    if (multimapX + 1 < multimapWidth) {
                        weight = ditherMatrix[1][3] / divisor;
                        data[i + multimapWidth * 4 + 4] += error[0] * weight; data[i + multimapWidth * 4 + 5] += error[1] * weight; data[i + multimapWidth * 4 + 6] += error[2] * weight;
                        if (multimapX + 2 < multimapWidth) {
                            weight = ditherMatrix[1][4] / divisor;
                            data[i + multimapWidth * 4 + 8] += error[0] * weight; data[i + multimapWidth * 4 + 9] += error[1] * weight; data[i + multimapWidth * 4 + 10] += error[2] * weight;
                        }
                    }
                    if (multimapX > 0) {
                        let weight = ditherMatrix[2][1] / divisor;
                        data[i + multimapWidth * 8 - 4] += error[0] * weight; data[i + multimapWidth * 8 - 3] += error[1] * weight; data[i + multimapWidth * 8 - 2] += error[2] * weight;
                        if (multimapX > 1) {
                            weight = ditherMatrix[2][0] / divisor;
                            data[i + multimapWidth * 8 - 8] += error[0] * weight; data[i + multimapWidth * 8 - 7] += error[1] * weight; data[i + multimapWidth * 8 - 6] += error[2] * weight;
                        }
                    }
                    weight = ditherMatrix[2][2] / divisor;
                    data[i + multimapWidth * 8] += error[0] * weight; data[i + multimapWidth * 8 + 1] += error[1] * weight; data[i + multimapWidth * 8 + 2] += error[2] * weight;
                    if (multimapX + 1 < multimapWidth) {
                        weight = ditherMatrix[2][3] / divisor;
                        data[i + multimapWidth * 8 + 4] += error[0] * weight; data[i + multimapWidth * 8 + 5] += error[1] * weight; data[i + multimapWidth * 8 + 6] += error[2] * weight;
                        if (multimapX + 2 < multimapWidth) {
                            weight = ditherMatrix[2][4] / divisor;
                            data[i + multimapWidth * 8 + 8] += error[0] * weight; data[i + multimapWidth * 8 + 9] += error[1] * weight; data[i + multimapWidth * 8 + 10] += error[2] * weight;
                        }
                    }
                }

                if (data[i + 3] !== 0 && args.mode === MapModes.SCHEMATIC_NBT.uniqueId) {
                    countSupportAndMaterial(maps, data, i, closestPixel, individualMapY, whichMapY, whichMapX, multimapWidth, args, cache);
                }
                if (data[i + 3] === 0 && args.selectedBlocks[alphaColorIdx] > -1) maps[whichMapY][whichMapX].materials[alphaColorIdx] += 1;
            }
        }

        return { pixels: imageData, maps, currentSelectedBlocks: args.selectedBlocks };
    }

    function countSupportAndMaterial(maps, data, i, pixel, individualMapY, whichMapY, whichMapX, multimapWidth, args, cache) {
        const { WhereSupportBlocksModes } = args.data;
        const supportMode = args.whereSupportBlocks;
        const isMandatory = (p) => isSupportMandatory(args.data.coloursJSON, args.selectedBlocks, p);
        if (supportMode === WhereSupportBlocksModes.IMPORTANT.uniqueId) {
            if (isMandatory(pixel)) maps[whichMapY][whichMapX].supportBlockCount += 1;
        } else if (supportMode === WhereSupportBlocksModes.ALL_OPTIMIZED.uniqueId) {
            if (individualMapY === 0) {
                if (pixel.tone === "dark" || (pixel.tone === "normal" && isMandatory(pixel))) maps[whichMapY][whichMapX].supportBlockCount += 1;
                if (pixel.tone === "dark" && isMandatory(pixel)) maps[whichMapY][whichMapX].supportBlockCount += 1;
            } else if (individualMapY === 1) {
                const block0 = exactRGBToColourSetIdAndTone([data[i - 4 * 128 * args.mapSizeX], data[i - 4 * 128 * args.mapSizeX + 1], data[i - 4 * 128 * args.mapSizeX + 2]], cache);
                if (block0.tone === "light" || pixel.tone === "dark" || (pixel.tone === "normal" && isMandatory(pixel)) || isMandatory(block0)) maps[whichMapY][whichMapX].supportBlockCount += 1;
                if (pixel.tone === "dark" && isMandatory(pixel)) maps[whichMapY][whichMapX].supportBlockCount += 1;
            } else {
                if (individualMapY === 127) {
                    const penultimate = exactRGBToColourSetIdAndTone([data[i - 4 * 128 * args.mapSizeX], data[i - 4 * 128 * args.mapSizeX + 1], data[i - 4 * 128 * args.mapSizeX + 2]], cache);
                    if (pixel.tone === "light" || isMandatory(pixel) || (pixel.tone === "normal" && isMandatory(penultimate))) maps[whichMapY][whichMapX].supportBlockCount += 1;
                    if (pixel.tone === "light" && isMandatory(penultimate)) maps[whichMapY][whichMapX].supportBlockCount += 1;
                }
                const north = exactRGBToColourSetIdAndTone([data[i - 4 * 128 * args.mapSizeX * 2], data[i - 4 * 128 * args.mapSizeX * 2 + 1], data[i - 4 * 128 * args.mapSizeX * 2 + 2]], cache);
                const current = exactRGBToColourSetIdAndTone([data[i - 4 * 128 * args.mapSizeX], data[i - 4 * 128 * args.mapSizeX + 1], data[i - 4 * 128 * args.mapSizeX + 2]], cache);
                if (current.tone === "light" || pixel.tone === "dark" || (pixel.tone === "normal" && isMandatory(pixel)) || isMandatory(current) || (current.tone === "normal" && isMandatory(north))) maps[whichMapY][whichMapX].supportBlockCount += 1;
                if ((pixel.tone === "dark" && isMandatory(pixel)) || (current.tone === "light" && isMandatory(north))) maps[whichMapY][whichMapX].supportBlockCount += 1;
            }
        } else if (supportMode === WhereSupportBlocksModes.ALL_DOUBLE_OPTIMIZED.uniqueId) {
            if (individualMapY === 0) {
                maps[whichMapY][whichMapX].supportBlockCount += 1;
                if (pixel.tone === "dark") maps[whichMapY][whichMapX].supportBlockCount += 1;
            } else {
                if (individualMapY === 127) {
                    maps[whichMapY][whichMapX].supportBlockCount += 1;
                    if (pixel.tone === "light") maps[whichMapY][whichMapX].supportBlockCount += 1;
                }
                maps[whichMapY][whichMapX].supportBlockCount += 1;
                const north = exactRGBToColourSetIdAndTone([data[i - 4 * 128 * args.mapSizeX], data[i - 4 * 128 * args.mapSizeX + 1], data[i - 4 * 128 * args.mapSizeX + 2]], cache);
                if (north.tone === "light" || pixel.tone === "dark") maps[whichMapY][whichMapX].supportBlockCount += 1;
            }
        }
        maps[whichMapY][whichMapX].materials[pixel.colourSetId] += 1;
    }

    function prepareSourceImageData(options) {
        const { data, image, width, height } = options;
        const { CropModes, BackgroundColourModes } = data;
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.clearRect(0, 0, width, height);

        if (options.preprocessingEnabled) {
            if (options.backgroundMode !== BackgroundColourModes.OFF.uniqueId && /^#?[a-f\d]{6}$/i.test(options.backgroundColour)) {
                const backgroundColour = options.backgroundMode === BackgroundColourModes.SMOOTH.uniqueId
                    ? closestSmoothColourTo(options.backgroundColour, options)
                    : options.backgroundColour;
                ctx.filter = "none";
                ctx.rect(0, 0, width, height);
                ctx.fillStyle = backgroundColour;
                ctx.fill();
            }
            ctx.filter = `brightness(${options.brightness}%) contrast(${options.contrast}%) saturate(${options.saturation}%)`;
        } else {
            ctx.filter = "none";
        }

        if (options.cropMode === CropModes.OFF.uniqueId) {
            ctx.drawImage(image, 0, 0, width, height);
        } else {
            const imgWidth = image.width;
            const imgHeight = image.height;
            let samplingWidth;
            let samplingHeight;
            if (imgWidth * options.mapSizeY > imgHeight * options.mapSizeX) {
                samplingWidth = Math.floor((10 * imgHeight * options.mapSizeX) / (options.mapSizeY * options.cropZoom));
                samplingHeight = Math.floor((10 * imgHeight) / options.cropZoom);
            } else {
                samplingWidth = Math.floor((10 * imgWidth) / options.cropZoom);
                samplingHeight = Math.floor((10 * imgWidth * options.mapSizeY) / (options.mapSizeX * options.cropZoom));
            }
            const samplingOffsetX = Math.floor((options.cropPercentX * (imgWidth - samplingWidth)) / 100);
            const samplingOffsetY = Math.floor((options.cropPercentY * (imgHeight - samplingHeight)) / 100);
            ctx.drawImage(image, samplingOffsetX, samplingOffsetY, samplingWidth, samplingHeight, 0, 0, width, height);
        }

        return ctx.getImageData(0, 0, width, height);
    }

    function closestSmoothColourTo(colourHex, options) {
        const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colourHex);
        const input = [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)];
        const modeConfig = Object.values(options.data.MapModes).find((mapMode) => mapMode.uniqueId === options.mode);
        const stairConfig = Object.values(modeConfig.staircaseModes).find((staircaseMode) => staircaseMode.uniqueId === options.staircasing);
        let smallestDistance = 9999999;
        let result = input;
        for (const [colourSetId, colourSet] of Object.entries(options.data.coloursJSON)) {
            if (String(options.selectedBlocks[colourSetId]) === "-1") continue;
            for (const tone of stairConfig.toneKeys) {
                if (options.disabledTones[colourSetId] && options.disabledTones[colourSetId].has(tone)) continue;
                const rgb = colourSet.tonesRGB[tone];
                const distance = Math.pow(input[0] - rgb[0], 2) + Math.pow(input[1] - rgb[1], 2) + Math.pow(input[2] - rgb[2], 2);
                if (distance < smallestDistance) {
                    smallestDistance = distance;
                    result = rgb;
                }
            }
        }
        return `#${result[0].toString(16).padStart(2, "0")}${result[1].toString(16).padStart(2, "0")}${result[2].toString(16).padStart(2, "0")}`;
    }

    function materialEntries(currentMaterialsData, coloursJSON, supportBlock, sorted) {
        const counts = {};
        for (const colourSetId of Object.keys(coloursJSON)) counts[colourSetId] = 0;
        let supportBlockCount = 0;
        for (const row of currentMaterialsData.maps) {
            for (const map of row) {
                supportBlockCount += map.supportBlockCount || 0;
                for (const [colourSetId, count] of Object.entries(map.materials)) {
                    if (colourSetId !== alphaColorIdx) counts[colourSetId] += count;
                }
            }
        }
        let entries = Object.entries(counts)
            .filter(([, count]) => count !== 0)
            .map(([colourSetId, count]) => ({
                colourSetId,
                blockId: currentMaterialsData.currentSelectedBlocks[colourSetId],
                name: coloursJSON[colourSetId].blocks[currentMaterialsData.currentSelectedBlocks[colourSetId]].displayName,
                count
            }));
        if (sorted) entries = entries.sort((first, second) => second.count - first.count);
        if (supportBlockCount !== 0) entries.unshift({ colourSetId: "NOOBLINE_SCAFFOLD", blockId: null, name: supportBlock, count: supportBlockCount, support: true });
        return entries;
    }

    window.MapartCraftExact = {
        prepareSourceImageData,
        convertImageData,
        materialEntries,
        createDisabledTones(coloursJSON) {
            const disabledTones = {};
            for (const colourSetId of Object.keys(coloursJSON)) disabledTones[colourSetId] = new Set();
            return disabledTones;
        }
    };
})();
