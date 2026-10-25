export type ColorSchemeNames =
    | "primary"
    | "orange"
    | "green"
    | "blue"
    | "purple"
    | "red"
    | "yellow"
    | "pastel-large"
    | "gemini-large"
    | "green-large"
    | "grouped-hues-large"
    | "small-blue"
    | "spectrum"

export function getColorFromScheme(scheme: ColorSchemeNames): string[] {
    // Create a temporary element with the color scheme class
    const tempElement = document.createElement('div');
    tempElement.className = `color-scheme-${scheme}`;
    document.body.appendChild(tempElement);

    /* Check if name has large suffix */
    const COLOR_COUNT = (scheme.endsWith('-large')) ? 20 : (scheme.endsWith('-xlarge') ? 28 : 10);
        
    const computedStyles = getComputedStyle(tempElement);
    const colors: string[] = [];
    
    // Read color1 through color10 from the CSS variables
    for (let i = 1; i <= COLOR_COUNT; i++) {
        const colorValue = computedStyles.getPropertyValue(`--color${i}`).trim();
        if (colorValue) {
            colors.push(colorValue);
        }
    }
    
    // Clean up temporary element
    document.body.removeChild(tempElement);
            
    return colors;
}