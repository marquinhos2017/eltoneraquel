// Função para aplicar filtro LUT (versão otimizada)
export function applyLUTFilter(imageData, lut) {
    const data = imageData.data;
    const size = lut.size;
    const size2 = size * size;

    for (let i = 0; i < data.length; i += 4) {
        const r = Math.max(0, Math.min(1, data[i] / 255));
        const g = Math.max(0, Math.min(1, data[i + 1] / 255));
        const b = Math.max(0, Math.min(1, data[i + 2] / 255));

        // Encontrar os índices no cubo LUT
        const rIndex = r * (size - 1);
        const gIndex = g * (size - 1);
        const bIndex = b * (size - 1);

        const r0 = Math.floor(rIndex);
        const g0 = Math.floor(gIndex);
        const b0 = Math.floor(bIndex);

        const r1 = Math.min(r0 + 1, size - 1);
        const g1 = Math.min(g0 + 1, size - 1);
        const b1 = Math.min(b0 + 1, size - 1);

        const dr = rIndex - r0;
        const dg = gIndex - g0;
        const db = bIndex - b0;

        // Função auxiliar para obter valores da LUT
        const getLUTValue = (r, g, b) => {
            const index = b * size2 + g * size + r;
            return lut.data[Math.min(index, lut.data.length - 1)];
        };

        // Interpolação trilinear
        const c000 = getLUTValue(r0, g0, b0);
        const c001 = getLUTValue(r0, g0, b1);
        const c010 = getLUTValue(r0, g1, b0);
        const c011 = getLUTValue(r0, g1, b1);
        const c100 = getLUTValue(r1, g0, b0);
        const c101 = getLUTValue(r1, g0, b1);
        const c110 = getLUTValue(r1, g1, b0);
        const c111 = getLUTValue(r1, g1, b1);

        // Interpolação em r
        const c00 = {
            r: c000.r + (c100.r - c000.r) * dr,
            g: c000.g + (c100.g - c000.g) * dr,
            b: c000.b + (c100.b - c000.b) * dr
        };

        const c01 = {
            r: c001.r + (c101.r - c001.r) * dr,
            g: c001.g + (c101.g - c001.g) * dr,
            b: c001.b + (c101.b - c001.b) * dr
        };

        const c10 = {
            r: c010.r + (c110.r - c010.r) * dr,
            g: c010.g + (c110.g - c010.g) * dr,
            b: c010.b + (c110.b - c010.b) * dr
        };

        const c11 = {
            r: c011.r + (c111.r - c011.r) * dr,
            g: c011.g + (c111.g - c011.g) * dr,
            b: c011.b + (c111.b - c011.b) * dr
        };

        // Interpolação em g
        const c0 = {
            r: c00.r + (c10.r - c00.r) * dg,
            g: c00.g + (c10.g - c00.g) * dg,
            b: c00.b + (c10.b - c00.b) * dg
        };

        const c1 = {
            r: c01.r + (c11.r - c01.r) * dg,
            g: c01.g + (c11.g - c01.g) * dg,
            b: c01.b + (c11.b - c01.b) * dg
        };

        // Interpolação final em b
        const finalColor = {
            r: c0.r + (c1.r - c0.r) * db,
            g: c0.g + (c1.g - c0.g) * db,
            b: c0.b + (c1.b - c0.b) * db
        };

        data[i] = Math.round(finalColor.r * 255);
        data[i + 1] = Math.round(finalColor.g * 255);
        data[i + 2] = Math.round(finalColor.b * 255);
    }
}