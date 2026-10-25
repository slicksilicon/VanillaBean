/**
 * ICON THEME CONFIGURATION
 * Change these 5 values to update the color scheme for all icons.
 */
const THEME = {
    CIRCLE_BG: "#DAA520",   // Goldenrod (The outer circle)
    STROKE: "#121212",      // Soft Black (The clear concise lines)
    FILL_MAIN: "#FFFFFF",   // White (Primary object fill for contrast)
    FILL_ACCENT: "#B8860B", // Dark Goldenrod (Secondary details)
    STROKE_WIDTH: "1.5"     // Line thickness
};

/** Default icon size in pixels */
export const DEFAULT_ICON_SIZE = 24;

// Helper for the background circle used in every icon
const BACKGROUND_CIRCLE = `<circle cx="12" cy="12" r="11" fill="${THEME.CIRCLE_BG}" />`;

// Helper to wrap SVG content with configurable size
const makeSvg = (size: number, content: string) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;

/**
 * 1. CLOTHING (T-Shirt)
 */
export const ICON_SVG_CLOTHING = (size: number = DEFAULT_ICON_SIZE) => makeSvg(size, `
  ${BACKGROUND_CIRCLE}
  <path d="M16 7L19 10L17 11L16 9V19H8V9L7 11L5 10L8 7H16Z" fill="${THEME.FILL_MAIN}" stroke="${THEME.STROKE}" stroke-width="${THEME.STROKE_WIDTH}" stroke-linejoin="round"/>
  <path d="M10 7C10 8.10457 10.8954 9 12 9C13.1046 9 14 8.10457 14 7" stroke="${THEME.STROKE}" stroke-width="${THEME.STROKE_WIDTH}" stroke-linecap="round"/>
`);

/**
 * 2. TOILETRIES (Toothbrush & Tube)
 */
export const ICON_SVG_TOILETRIES = (size: number = DEFAULT_ICON_SIZE) => makeSvg(size, `
  ${BACKGROUND_CIRCLE}
  <rect x="6" y="8" width="6" height="10" rx="1" fill="${THEME.FILL_MAIN}" stroke="${THEME.STROKE}" stroke-width="${THEME.STROKE_WIDTH}"/>
  <path d="M9 18V8L8 5H10L9 8Z" fill="${THEME.FILL_ACCENT}" stroke="${THEME.STROKE}" stroke-width="${THEME.STROKE_WIDTH}"/>
  <path d="M16 6V16C16 17.1 16.9 18 18 18" stroke="${THEME.STROKE}" stroke-width="${THEME.STROKE_WIDTH}" stroke-linecap="round"/>
  <rect x="15" y="6" width="2" height="4" fill="${THEME.FILL_MAIN}" stroke="${THEME.STROKE}" stroke-width="${THEME.STROKE_WIDTH}"/>
`);

/**
 * 3. PC (Monitor & Tower)
 */
export const ICON_SVG_PC_RELATED = (size: number = DEFAULT_ICON_SIZE) => makeSvg(size, `
  ${BACKGROUND_CIRCLE}
  <rect x="4" y="6" width="10" height="8" rx="1" fill="${THEME.FILL_MAIN}" stroke="${THEME.STROKE}" stroke-width="${THEME.STROKE_WIDTH}"/>
  <line x1="9" y1="14" x2="9" y2="16" stroke="${THEME.STROKE}" stroke-width="${THEME.STROKE_WIDTH}"/>
  <line x1="6" y1="16" x2="12" y2="16" stroke="${THEME.STROKE}" stroke-width="${THEME.STROKE_WIDTH}" stroke-linecap="round"/>
  <rect x="16" y="6" width="4" height="10" rx="0.5" fill="${THEME.FILL_ACCENT}" stroke="${THEME.STROKE}" stroke-width="${THEME.STROKE_WIDTH}"/>
  <circle cx="18" cy="13" r="1" fill="${THEME.STROKE}"/>
`);

/**
 * 4. SNACKS (Chip Bag)
 */
export const ICON_SVG_SNACKS = (size: number = DEFAULT_ICON_SIZE) => makeSvg(size, `
  ${BACKGROUND_CIRCLE}
  <path d="M7 6L8 18H16L17 6L12 5L7 6Z" fill="${THEME.FILL_MAIN}" stroke="${THEME.STROKE}" stroke-width="${THEME.STROKE_WIDTH}" stroke-linejoin="round"/>
  <path d="M7 6L8 4H16L17 6" stroke="${THEME.STROKE}" stroke-width="${THEME.STROKE_WIDTH}" stroke-linejoin="round"/>
  <circle cx="12" cy="12" r="2" fill="${THEME.FILL_ACCENT}" stroke="${THEME.STROKE}" stroke-width="${THEME.STROKE_WIDTH}"/>
`);

/**
 * 5. SWIMMING (Goggles)
 */
export const ICON_SVG_SWIMMING = (size: number = DEFAULT_ICON_SIZE) => makeSvg(size, `
  ${BACKGROUND_CIRCLE}
  <circle cx="9" cy="11" r="3" fill="${THEME.FILL_MAIN}" stroke="${THEME.STROKE}" stroke-width="${THEME.STROKE_WIDTH}"/>
  <circle cx="15" cy="11" r="3" fill="${THEME.FILL_MAIN}" stroke="${THEME.STROKE}" stroke-width="${THEME.STROKE_WIDTH}"/>
  <path d="M12 11H12.5" stroke="${THEME.STROKE}" stroke-width="${THEME.STROKE_WIDTH}"/>
  <path d="M6 11H4" stroke="${THEME.STROKE}" stroke-width="${THEME.STROKE_WIDTH}"/>
  <path d="M20 11H18" stroke="${THEME.STROKE}" stroke-width="${THEME.STROKE_WIDTH}"/>
  <path d="M6 16C7 15 8 15 9 16C10 17 11 17 12 16C13 15 14 15 15 16C16 17 17 17 18 16" stroke="${THEME.FILL_ACCENT}" stroke-width="${THEME.STROKE_WIDTH}" stroke-linecap="round"/>
`);

/**
 * 6. MOVIE DOWNLOADS (Film Strip & Arrow)
 */
export const ICON_SVG_MOVIE = (size: number = DEFAULT_ICON_SIZE) => makeSvg(size, `
  ${BACKGROUND_CIRCLE}
  <rect x="5" y="5" width="14" height="14" rx="1" fill="${THEME.FILL_MAIN}" stroke="${THEME.STROKE}" stroke-width="${THEME.STROKE_WIDTH}"/>
  <path d="M5 9H19" stroke="${THEME.STROKE}" stroke-width="${THEME.STROKE_WIDTH}"/>
  <path d="M5 15H19" stroke="${THEME.STROKE}" stroke-width="${THEME.STROKE_WIDTH}"/>
  <path d="M8 5V19" stroke="${THEME.STROKE}" stroke-width="${THEME.STROKE_WIDTH}"/>
  <path d="M16 5V19" stroke="${THEME.STROKE}" stroke-width="${THEME.STROKE_WIDTH}"/>
  <path d="M12 10V14M12 14L10 12M12 14L14 12" stroke="${THEME.FILL_ACCENT}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
`);

/**
 * 7. ELECTRONICS (Headphones)
 */
export const ICON_SVG_ELECTRONICS = (size: number = DEFAULT_ICON_SIZE) => makeSvg(size, `
  ${BACKGROUND_CIRCLE}
  <path d="M6 13V11C6 7.68629 8.68629 5 12 5C15.3137 5 18 7.68629 18 11V13" stroke="${THEME.STROKE}" stroke-width="${THEME.STROKE_WIDTH}" stroke-linecap="round"/>
  <rect x="4" y="13" width="4" height="6" rx="1" fill="${THEME.FILL_MAIN}" stroke="${THEME.STROKE}" stroke-width="${THEME.STROKE_WIDTH}"/>
  <rect x="16" y="13" width="4" height="6" rx="1" fill="${THEME.FILL_MAIN}" stroke="${THEME.STROKE}" stroke-width="${THEME.STROKE_WIDTH}"/>
  <path d="M11 15H13" stroke="${THEME.FILL_ACCENT}" stroke-width="${THEME.STROKE_WIDTH}" stroke-linecap="round"/>
`);

/**
 * 8. MEDICATION (Bottle & Pill)
 */
export const ICON_SVG_MEDICATION = (size: number = DEFAULT_ICON_SIZE) => makeSvg(size, `
  ${BACKGROUND_CIRCLE}
  <rect x="7" y="8" width="8" height="10" rx="1" fill="${THEME.FILL_MAIN}" stroke="${THEME.STROKE}" stroke-width="${THEME.STROKE_WIDTH}"/>
  <rect x="6" y="6" width="10" height="2" rx="0.5" fill="${THEME.FILL_ACCENT}" stroke="${THEME.STROKE}" stroke-width="${THEME.STROKE_WIDTH}"/>
  <ellipse cx="16" cy="16" rx="3" ry="1.5" transform="rotate(-45 16 16)" fill="${THEME.FILL_ACCENT}" stroke="${THEME.STROKE}" stroke-width="${THEME.STROKE_WIDTH}"/>
`);

/**
 * 9. MISCELLANEOUS (Box with ?)
 */
export const ICON_SVG_MISCELLANEOUS = (size: number = DEFAULT_ICON_SIZE) => makeSvg(size, `
  ${BACKGROUND_CIRCLE}
  <path d="M6 8L12 5L18 8L12 11L6 8Z" fill="${THEME.FILL_ACCENT}" stroke="${THEME.STROKE}" stroke-width="${THEME.STROKE_WIDTH}" stroke-linejoin="round"/>
  <path d="M6 8V16L12 19V11" fill="${THEME.FILL_MAIN}" stroke="${THEME.STROKE}" stroke-width="${THEME.STROKE_WIDTH}" stroke-linejoin="round"/>
  <path d="M18 8V16L12 19" fill="${THEME.FILL_MAIN}" stroke="${THEME.STROKE}" stroke-width="${THEME.STROKE_WIDTH}" stroke-linejoin="round"/>
  <text x="12" y="17" font-family="Arial, sans-serif" font-size="6" font-weight="bold" fill="${THEME.STROKE}" text-anchor="middle">?</text>
`);

/**
 * 10. DOCUMENTS (Folded Paper with Lines)
 */
export const ICON_SVG_DOCUMENTS = (size: number = DEFAULT_ICON_SIZE) => makeSvg(size, `
  ${BACKGROUND_CIRCLE}
  <path d="M8 4H14L18 8V20H8V4Z" fill="${THEME.FILL_MAIN}" stroke="${THEME.STROKE}" stroke-width="${THEME.STROKE_WIDTH}" stroke-linejoin="round"/>
  <path d="M14 4V8H18" stroke="${THEME.STROKE}" stroke-width="${THEME.STROKE_WIDTH}" stroke-linejoin="round"/>
  <line x1="10" y1="11" x2="16" y2="11" stroke="${THEME.FILL_ACCENT}" stroke-width="${THEME.STROKE_WIDTH}" stroke-linecap="round"/>
  <line x1="10" y1="14" x2="16" y2="14" stroke="${THEME.FILL_ACCENT}" stroke-width="${THEME.STROKE_WIDTH}" stroke-linecap="round"/>
  <line x1="10" y1="17" x2="14" y2="17" stroke="${THEME.FILL_ACCENT}" stroke-width="${THEME.STROKE_WIDTH}" stroke-linecap="round"/>
`);

/**
 * 11. SMARTPHONE (Phone with Screen)
 */
export const ICON_SVG_SMARTPHONE = (size: number = DEFAULT_ICON_SIZE) => makeSvg(size, `
  ${BACKGROUND_CIRCLE}
  <rect x="7" y="4" width="10" height="16" rx="2" fill="${THEME.FILL_MAIN}" stroke="${THEME.STROKE}" stroke-width="${THEME.STROKE_WIDTH}"/>
  <rect x="9" y="7" width="6" height="9" rx="0.5" fill="${THEME.FILL_ACCENT}" stroke="${THEME.STROKE}" stroke-width="${THEME.STROKE_WIDTH}"/>
  <circle cx="12" cy="18" r="1" fill="${THEME.STROKE}"/>
`);