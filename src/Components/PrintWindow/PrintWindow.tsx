import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

interface PrintWindowProps {
  children: React.ReactNode;
  onClose?: () => void;
  mode?: 'landscape' | 'portrait';
}

function calculateWindowSize(mode: 'landscape' | 'portrait', screenWidth: number, screenHeight: number) : string {
    const size_ratio = 1.414; // A4 aspect ratio
    const fill_percentage = 0.8; // We want to fill 80% of the screen
    let configuration : string = "";

    if (mode === 'landscape') {
        const width = Math.min(screenWidth * fill_percentage, screenHeight * fill_percentage / size_ratio);
        const height = width / size_ratio;
        const top = Math.floor((screenHeight - height) / 2);
        const left = Math.floor((screenWidth - width) / 2);
        configuration = `width=${width},height=${height},top=${top},left=${left}`;
    } else {
        const height = Math.min(screenHeight * fill_percentage, screenWidth * fill_percentage / size_ratio);
        const width = height / size_ratio;
        const top = Math.floor((screenHeight - height) / 2);
        const left = Math.floor((screenWidth - width) / 2);
        configuration = `width=${width},height=${height},top=${top},left=${left}`;
    }

    console.log(`Calculated window size for ${mode}: ${configuration}`);

    return configuration;
}

export const PrintWindow: React.FC<PrintWindowProps> = ({ children, onClose, mode = 'portrait' }) => {
    const [containerElement, setContainerElement] = useState<HTMLElement | null>(null);
  
    // Keep a reference to the window so we can close it on unmount
    const externalWindow = useRef<Window | null>(null);
  
    useEffect(() => {
        // 1. Open a new window
        const windowFeatures = calculateWindowSize(mode, window.screen.width, window.screen.height);
        externalWindow.current = window.open('', '', windowFeatures);

        if (!externalWindow.current) {
            alert("Popup blocked! Please allow popups for this website.");
            return;
        }

        const targetDoc = externalWindow.current.document;

        // 2. Inject A4 Print Styles & Reset
        const styleEl = targetDoc.createElement('style');
       styleEl.innerHTML = `
            /* 1. SET PAPER MARGINS */
            @page { size: A4 ${mode}; margin: 10mm; }

            /* 2. RESET LAYOUT & MERGED BODY STYLES */
            html, body {
                height: auto !important;
                overflow: visible !important;
                min-height: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                box-sizing: border-box;
                font-family: sans-serif; /* Fallback font */
            }

            /* 3. ENSURE ALL ELEMENTS USE BORDER-BOX */
            *, *:before, *:after {
                box-sizing: inherit;
            }

            /* 4. ENSURE CONTAINER GROWS */
            #print-root {
                display: block !important;
                height: auto !important;
                overflow: visible !important;
                width: 100%;
            }

            /* 5. PREVENT WEIRD CUTS */
            /* Use this class on elements you don't want chopped in half */
            img, tr, .no-break {
                page-break-inside: avoid;
                break-inside: avoid;
            }

            /* 6. REPEAT TABLE HEADERS ON NEW PAGES */
            thead { display: table-header-group; }
            tfoot { display: table-footer-group; }

            /* 7. PRINT BUTTON STYLES */
            .print-window-button {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 24px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                transition: all 0.3s ease;
                z-index: 9999;
            }

            .print-window-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
            }

            .print-window-button:active {
                transform: translateY(0);
            }

            /* 8. HIDE PRINT BUTTON WHEN PRINTING */
            @media print {
                .print-window-button {
                    display: none !important;
                }
            }
        `;

    targetDoc.head.appendChild(styleEl);

        // 3. (Crucial) Copy existing styles from the main window 
        // This ensures your Tailwind/Bootstrap/Custom CSS works in the new window
        Array.from(document.styleSheets).forEach((styleSheet) => {
            try {
                if (styleSheet.href) {
                    // Link tags (external stylesheets)
                    const newLink = targetDoc.createElement('link');
                    newLink.rel = 'stylesheet';
                    newLink.href = styleSheet.href;
                    targetDoc.head.appendChild(newLink);
                } else if (styleSheet.cssRules) {
                    // Style tags (internal styles)
                    const newStyle = targetDoc.createElement('style');
                    Array.from(styleSheet.cssRules).forEach((rule) => {newStyle.appendChild(targetDoc.createTextNode(rule.cssText));});
                    targetDoc.head.appendChild(newStyle);
                }
            } catch (e) {
                console.warn('Could not copy a stylesheet', e);
            }
        });

        // 4. Create a root div for React to render into
        const rootDiv = targetDoc.createElement('div');
        rootDiv.setAttribute('id', 'print-root');
        targetDoc.body.appendChild(rootDiv);
        setContainerElement(rootDiv);

        // 5. Cleanup: Close window when parent component unmounts
        // Also handle if user manually closes the popup
        externalWindow.current.onbeforeunload = () => {
            if (onClose) onClose();
        }
        
        return () => {
            externalWindow.current?.close();
        };
    }, [mode, onClose]);

    // 6. Handle print button click
    const handlePrint = () => {
        if (externalWindow.current) {
            externalWindow.current.print();
        }
    };

    // 7. Render the children into the new window's DOM using Portal
    return containerElement ? createPortal(
        <>
            <button className="print-window-button" onClick={handlePrint}>
                🖨️ Print
            </button>
            {children}
        </>,
        containerElement
    ) : null;
};

export default PrintWindow;