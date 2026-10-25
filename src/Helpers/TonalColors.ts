/**
 * Tonal ramps for chart series that belong together.
 *
 * A flat categorical palette says "these are different things". When series are related -
 * items inside one category, or steps of one dimension - a ramp of one hue says "these are
 * the same kind of thing" and lets the eye read the group before it reads the member.
 *
 * Tones vary lightness and saturation together rather than lightness alone: on a dark
 * ground, lightness-only steps collapse into each other after three or four entries.
 */

interface Hsl {
    h: number;
    s: number;
    l: number;
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const hexToHsl = (hex: string): Hsl => {
    const clean = hex.replace("#", "").trim();
    const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
    const r = parseInt(full.slice(0, 2), 16) / 255;
    const g = parseInt(full.slice(2, 4), 16) / 255;
    const b = parseInt(full.slice(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    const l = (max + min) / 2;

    if (delta === 0) return { h: 0, s: 0, l: l * 100 };

    const s = delta / (1 - Math.abs(2 * l - 1));
    let h: number;
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;

    h *= 60;
    if (h < 0) h += 360;

    return { h, s: s * 100, l: l * 100 };
};

export const hslToHex = ({ h, s, l }: Hsl): string => {
    const sat = clamp(s, 0, 100) / 100;
    const lum = clamp(l, 0, 100) / 100;
    const c = (1 - Math.abs(2 * lum - 1)) * sat;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = lum - c / 2;

    let rgb: [number, number, number];
    if (h < 60) rgb = [c, x, 0];
    else if (h < 120) rgb = [x, c, 0];
    else if (h < 180) rgb = [0, c, x];
    else if (h < 240) rgb = [0, x, c];
    else if (h < 300) rgb = [x, 0, c];
    else rgb = [c, 0, x];

    const toHex = (value: number): string =>
        Math.round(clamp((value + m) * 255, 0, 255)).toString(16).padStart(2, "0");

    return `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`.toUpperCase();
};

/* Legible band on a dark ground: below ~34% lightness a fill reads as black, above ~78% it
   washes out and the palegoldenrod value labels stop separating from it. */
const MIN_LIGHTNESS = 34;
const MAX_LIGHTNESS = 78;
/**
 * `count` tones of one base colour, light to dark.
 *
 * With one entry the base colour is returned unchanged, so a single-member group looks the
 * same whether or not it happens to be alone.
 *
 * `hueDrift` fans the ramp a few degrees either side of the base hue, which helps tell a
 * long ramp apart. Leave it at 0 whenever ramps from *different* bases are shown together:
 * drift widens each family, and two families whose bases are close will overlap. The
 * default is 0 for that reason - opt in only when the ramp stands alone.
 */
export const tonalRamp = (baseHex: string, count: number, hueDrift: number = 0): string[] => {
    if (count <= 0) return [];
    const base = hexToHsl(baseHex);
    if (count === 1) return [baseHex.toUpperCase()];

    return Array.from({ length: count }, (_, index) => {
        const t = index / (count - 1);
        return hslToHex({
            /* Drift centred on the base hue, so the middle of the ramp is the colour the
               caller actually asked for. */
            h: (base.h + (t - 0.5) * 2 * hueDrift + 360) % 360,
            /* Lighter tones carry a little less saturation, which keeps them from glowing. */
            s: clamp(base.s * (1.05 - t * 0.25), 15, 100),
            l: MAX_LIGHTNESS - t * (MAX_LIGHTNESS - MIN_LIGHTNESS),
        });
    });
};

/**
 * `count` base hues spread evenly around the wheel, starting from `startHex`'s hue.
 *
 * For the case of several tonal ramps shown together: even spacing is what guarantees the
 * families stay apart, which picking bases out of a flat categorical palette does not -
 * such palettes are built for perceptual distance, and two of their entries can sit only
 * ~20 degrees apart in hue and still be perfectly good categorical colours.
 */
export const spreadHues = (startHex: string, count: number): string[] => {
    if (count <= 0) return [];
    const base = hexToHsl(startHex);
    const step = 360 / count;
    return Array.from({ length: count }, (_, index) =>
        hslToHex({ h: (base.h + index * step) % 360, s: clamp(base.s, 45, 80), l: 52 })
    );
};
