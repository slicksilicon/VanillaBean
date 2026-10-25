import React, { useState, useRef, useEffect, useCallback } from "react";
import "./Menu.css";

export interface MenuConfig {
    [key: string]: {
        submenus: string[];
        icon: string;
    };
}

interface MenuProps {
    config: MenuConfig;
    onMenuItemClick?: (mainItem: string, subItem?: string) => void;
    className?: string;
}

const Menu: React.FC<MenuProps> = ({config, onMenuItemClick, className = "",}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeMainItem, setActiveMainItem] = useState<string | null>(null);
    const [exitingSubmenu, setExitingSubmenu] = useState<string | null>(null);
    const [fontSize, setFontSize] = useState(14);
    const menuRef = useRef<HTMLDivElement>(null);
    const expandTimerRef = useRef<number | null>(null);
    const collapseTimerRef = useRef<number | null>(null);
    const exitTimerRef = useRef<number | null>(null);

    // Adjust font size based on viewport
    const adjustFontSize = useCallback(() => {
        const viewportHeight = window.innerHeight;
        let calculatedSize = Math.min(viewportHeight / 50, 16);
        calculatedSize = Math.max(12, Math.min(16, calculatedSize));
        setFontSize(calculatedSize);
    }, []);

    useEffect(() => {
        adjustFontSize();
        
        const handleResize = () => {
            adjustFontSize();
        };
        
        window.addEventListener("resize", handleResize);
        
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [adjustFontSize]);

    // Cleanup effect for timers
    useEffect(() => {
        return () => {
            // Clean up all timers on unmount
            [expandTimerRef, collapseTimerRef, exitTimerRef].forEach(timerRef => {
                if (timerRef.current) {
                    clearTimeout(timerRef.current);
                }
            });
        };
    }, []);

    const handleMouseEnter = () => {
        if (collapseTimerRef.current) {
            clearTimeout(collapseTimerRef.current);
            collapseTimerRef.current = null;
        }

        expandTimerRef.current = setTimeout(() => {
            setIsExpanded(true);
        }, 150); // Small delay for better UX
    };

    const handleMouseLeave = () => {
        if (expandTimerRef.current) {
            clearTimeout(expandTimerRef.current);
            expandTimerRef.current = null;
        }

        collapseTimerRef.current = setTimeout(() => {
            // If there's an active submenu, animate it out first
            if (activeMainItem) {
                setExitingSubmenu(activeMainItem);
                setTimeout(() => {
                    setIsExpanded(false);
                    setActiveMainItem(null);
                    setExitingSubmenu(null);
                }, 300);
            } else {
                setIsExpanded(false);
                setActiveMainItem(null);
                setExitingSubmenu(null);
            }
        }, 300); // Delay to allow mouse movement
    };

    const handleMainItemClick = (mainItem: string) => {
        if (activeMainItem === mainItem) {
            // Closing submenu - start exit animation
            setExitingSubmenu(mainItem);
            
            // Clear any existing exit timer
            if (exitTimerRef.current) {
                clearTimeout(exitTimerRef.current);
            }
            
            // Set timer to actually close the submenu after animation
            exitTimerRef.current = setTimeout(() => {
                setActiveMainItem(null);
                setExitingSubmenu(null);
            }, 300); // Match the animation duration
        } else {
            // Opening new submenu or switching between submenus
            if (activeMainItem && activeMainItem !== mainItem) {
                // If switching, close current immediately and open new
                setExitingSubmenu(activeMainItem);
                setTimeout(() => {
                    setExitingSubmenu(null);
                    setActiveMainItem(mainItem);
                }, 150); // Shorter delay for switching
            } else {
                // Opening first submenu
                setActiveMainItem(mainItem);
            }
        }
        onMenuItemClick?.(mainItem);
    };

    const handleSubItemClick = (mainItem: string, subItem: string) => {
        onMenuItemClick?.(mainItem, subItem);
    };

    const getIconPath = (iconName: string): string => {
        // Use public folder for direct access to icons
        const iconPath = `/icons/${iconName}.png`;        
        return iconPath;
    };

    const renderMainItem = (mainItem: string, itemConfig: { submenus: string[]; icon: string }) => {
        const isActive = activeMainItem === mainItem;

        return (
            <div key={mainItem} className="menu-main-item">
                <div 
                    className={`menu-main-button ${isActive ? "active" : ""}`}
                    onClick={() => handleMainItemClick(mainItem)}
                    style={{ fontSize: `${fontSize}px` }}
                >
                    <div className="menu-icon-container">
                        <img 
                            src={getIconPath(itemConfig.icon)} 
                            alt={mainItem}
                            className="menu-icon"
                            onError={(e) => {
                                // Fallback to a placeholder if image fails to load
                                const target = e.target as HTMLImageElement;
                                console.warn(`Failed to load icon: ${target.src} for ${mainItem}`);
                                target.style.display = "none";
                                
                                // Check if placeholder already exists
                                const existingPlaceholder = target.parentNode?.querySelector('.menu-icon-placeholder');
                                if (!existingPlaceholder) {
                                    const placeholder = document.createElement("div");
                                    placeholder.className = "menu-icon-placeholder";
                                    placeholder.textContent = mainItem.charAt(0).toUpperCase();
                                    target.parentNode?.appendChild(placeholder);
                                }
                            }}
                        />
                    </div>
                    {isExpanded && (
                        <span className="menu-main-label">{mainItem}</span>
                    )}
                    {isExpanded && itemConfig.submenus.length > 0 && (
                        <span className={`menu-chevron ${isActive ? "expanded" : ""}`}>
                            ▶
                        </span>
                    )}
                </div>

                {isExpanded && (isActive || exitingSubmenu === mainItem) && itemConfig.submenus.length > 0 && (
                    <div className={`menu-submenu-container ${exitingSubmenu === mainItem ? 'exiting' : ''}`}>
                        {itemConfig.submenus.map((subItem) => (
                            <div
                                key={subItem}
                                className="menu-sub-item"
                                onClick={() => handleSubItemClick(mainItem, subItem)}
                                style={{ fontSize: `${fontSize - 1}px` }}
                            >
                                {subItem}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div 
            ref={menuRef}
            className={`menu-container ${isExpanded ? "expanded" : "collapsed"} ${className}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="menu-content">
                {Object.entries(config).map(([mainItem, itemConfig]) => 
                    renderMainItem(mainItem, itemConfig)
                )}
            </div>
        </div>
    );
};

export default Menu;