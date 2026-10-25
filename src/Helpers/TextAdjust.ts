/**
 * Adjusts font size to fit text within a div element without cutting off
 * @param divElementOrId - Either a HTMLDivElement or string ID of the div
 * @param targetFontSize - The desired font size in pixels
 * @param text - The text to be placed in the div
 * @param minFontSize - The minimum font size in pixels (default: 8)
 * @returns The optimal font size in pixels that was applied
 */
export function adjustFontSizeToFit(
    divElementOrId: HTMLDivElement | string,
    targetFontSize: number,
    text: string,
    minFontSize: number = 8
): number {
    // Get the div element
    let divElement: HTMLDivElement | null = null;
    
    if (typeof divElementOrId === "string") {
        divElement = document.getElementById(divElementOrId) as HTMLDivElement;
    } else {
        divElement = divElementOrId;
    }
    
    // If div doesn't exist, return target font size (no changes applied)
    if (!divElement) {
        return targetFontSize;
    }
    
    // Get computed styles to read current font size and padding
    const computedStyles = window.getComputedStyle(divElement);
    const currentFontSize = parseFloat(computedStyles.fontSize);
    const paddingLeft = parseFloat(computedStyles.paddingLeft) || 0;
    const paddingRight = parseFloat(computedStyles.paddingRight) || 0;
    
    // Calculate available width (div width minus horizontal padding)
    const divWidth = divElement.offsetWidth;
    const availableWidth = divWidth - paddingLeft - paddingRight;
    
    // If available width is too small, apply minimum font size and return
    if (availableWidth <= 0) {
        const appliedFontSize = Math.min(targetFontSize, minFontSize);
        divElement.style.fontSize = `${appliedFontSize}px`;
        if (divElement.textContent !== text) {
            divElement.textContent = text;
        }
        return appliedFontSize;
    }
    
    // Set the text content on the div for testing
    if (divElement.textContent !== text) {
        divElement.textContent = text;
    }
    
    let optimalFontSize = currentFontSize;
    
    // Helper function to check if text fits at given font size
    const doesTextFit = (fontSize: number): boolean => {
        divElement.style.fontSize = `${fontSize}px`;
        // Force a reflow to get accurate measurements
        void divElement.offsetHeight;
        // Check if content is overflowing horizontally or vertically
        const horizontalOverflow = divElement.scrollWidth > divElement.clientWidth;
        const verticalOverflow = divElement.scrollHeight > divElement.clientHeight;
        return !horizontalOverflow && !verticalOverflow;
    };
        
    // If current font size is smaller than target, try to increase
    if (currentFontSize < targetFontSize) {
        // Binary search to find the largest font size that fits, up to target
        let low = currentFontSize;
        let high = targetFontSize;
        
        while (high - low > 0.5) { // 0.5px precision
            const mid = (low + high) / 2;
            if (doesTextFit(mid)) {
                low = mid;
            } else {
                high = mid - 0.5;
            }
        }
        
        optimalFontSize = low;
    }
    // If text is being cut off at current size, decrease font size
    else if (!doesTextFit(currentFontSize)) {
        // Binary search to find the largest font size that fits
        let low = minFontSize; // Minimum readable font size
        let high = currentFontSize;
        
        while (high - low > 0.5) { // 0.5px precision
            const mid = (low + high) / 2;
            if (doesTextFit(mid)) {
                low = mid;
            } else {
                high = mid - 0.5;
            }
        }
        
        optimalFontSize = low;
    }
    // If current font size is larger than target but text fits, try to get closer to target
    else if (currentFontSize > targetFontSize) {
        // Check if we can use the target font size
        if (doesTextFit(targetFontSize)) {
            optimalFontSize = targetFontSize;
        } else {
            // Binary search between target and current to find best fit
            let low = targetFontSize;
            let high = currentFontSize;
            
            while (high - low > 0.5) { // 0.5px precision
                const mid = (low + high) / 2;
                if (doesTextFit(mid)) {
                    low = mid;
                } else {
                    high = mid - 0.5;
                }
            }
            
            optimalFontSize = low;
        }
    }
    // Current font size equals target and text fits
    else {
        optimalFontSize = targetFontSize;
    }
    
    // Ensure we don't go below minimum readable font size
    optimalFontSize = Math.max(optimalFontSize, minFontSize);
    
    // Round to 1 decimal place for consistency
    optimalFontSize = Math.round(optimalFontSize * 10) / 10;
    
    // Apply the final font size to the div
    divElement.style.fontSize = `${optimalFontSize}px`;
    if (divElement.textContent !== text) {
        divElement.textContent = text;
    }
    
    return optimalFontSize;
}

export function adjustFontSizeToFitSvg(width : number, height: number, targetFontSize: number, text: string, minFontSize: number = 8): number {
    // Create a temporary SVG text element to measure text size
    const svgNamespace = "http://www.w3.org/2000/svg";
    const tempSvg = document.createElementNS(svgNamespace, "svg");
    const tempText = document.createElementNS(svgNamespace, "text");
    tempText.setAttribute("x", "0");
    tempText.setAttribute("y", "0");
    tempText.textContent = text;
    tempSvg.appendChild(tempText);
    document.body.appendChild(tempSvg);

    let optimalFontSize = targetFontSize;

    // Helper function to check if text fits at given font size
    const doesTextFit = (fontSize: number): boolean => {
        tempText.setAttribute("font-size", `${fontSize}px`);
        const bbox = tempText.getBBox();
        return bbox.width <= width && bbox.height <= height;
    };

    // Binary search to find the largest font size that fits
    let low = minFontSize;
    let high = targetFontSize;

    while (high - low > 0.5) { // 0.5px precision
        const mid = (low + high) / 2;
        if (doesTextFit(mid)) {
            low = mid;
        } else {
            high = mid - 0.5;
        }
    }

    optimalFontSize = low;

    // Clean up temporary SVG element
    document.body.removeChild(tempSvg);

    return Math.round(optimalFontSize * 10) / 10; // Round to 1 decimal place
}   
