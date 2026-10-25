import React, { useState, useEffect, useRef, useCallback } from "react";
import "./ImageGallery.css";

/* ── Exported Types ── */

export interface GalleryImage {
    id: string;
    src: string;
    alt?: string;
    line1?: string;
    line2?: string;
    backgroundColor?: string;
}

export type GallerySpacing = "none" | "xs" | "md" | "lg" | "between";

export type GalleryColorVariant = "primary" | "secondary" | "success" | "info" | "warning" | "danger" | "gilded-noir";

export interface ImageGalleryProps {
    images: GalleryImage[];
    variant?: GalleryColorVariant;
    imageSize?: { width: number; height: number };
    horizontalSpacing?: GallerySpacing;
    verticalSpacing?: GallerySpacing;
    borderRadius?: number;
    onImageClick?: (image: GalleryImage, index: number) => void;
    onReorder?: (reorderedImages: GalleryImage[]) => void;
    className?: string;
    /** Unique identifier for cross-gallery drag-and-drop */
    galleryId?: string;
    /** Accept drops from other ImageGallery instances (default: false) */
    enableCrossGalleryDrop?: boolean;
    /** Called when images are dropped from another gallery */
    onExternalDrop?: (images: GalleryImage[], sourceGalleryId: string) => void;
    /** Show a delete bin in the bottom-right corner during drag (default: false) */
    enableDeleteBin?: boolean;
    /** Called when an image is dropped into the delete bin */
    onDelete?: (image: GalleryImage, index: number) => void;
}

/* ── Auto-size Calculation ── */

const DEFAULT_CELL_WIDTH = 150;
const MIN_CELL_WIDTH = 120;
const MAX_CELL_WIDTH = 300;
const ASPECT_FALLBACK = 1;

function computeAutoSize(
    naturalSizes: Array<{ w: number; h: number }>
): { width: number; height: number } {
    if (naturalSizes.length === 0) {
        return { width: DEFAULT_CELL_WIDTH, height: DEFAULT_CELL_WIDTH };
    }

    const ratios = naturalSizes
        .filter((s) => s.w > 0 && s.h > 0)
        .map((s) => s.w / s.h);

    if (ratios.length === 0) {
        return { width: DEFAULT_CELL_WIDTH, height: DEFAULT_CELL_WIDTH };
    }

    ratios.sort((a, b) => a - b);
    const medianRatio = ratios[Math.floor(ratios.length / 2)];

    const widths = naturalSizes.map((s) => s.w).sort((a, b) => a - b);
    let cellWidth = widths[Math.floor(widths.length / 2)];
    cellWidth = Math.max(MIN_CELL_WIDTH, Math.min(MAX_CELL_WIDTH, cellWidth));

    const aspect = medianRatio > 0 ? medianRatio : ASPECT_FALLBACK;
    const cellHeight = Math.round(cellWidth / aspect);

    return { width: cellWidth, height: cellHeight };
}

/* ── Component ── */

export const GALLERY_TRANSFER_TYPE = "application/x-gallery-transfer";

const ImageGallery: React.FC<ImageGalleryProps> = ({
    images,
    variant = "primary",
    imageSize,
    horizontalSpacing = "md",
    verticalSpacing = "md",
    borderRadius = 0,
    onImageClick,
    onReorder,
    className = "",
    galleryId,
    enableCrossGalleryDrop = false,
    onExternalDrop,
    enableDeleteBin = false,
    onDelete,
}) => {
    const [orderedImages, setOrderedImages] = useState<GalleryImage[]>([]);
    const [autoSize, setAutoSize] = useState<{ width: number; height: number }>({
        width: DEFAULT_CELL_WIDTH,
        height: DEFAULT_CELL_WIDTH,
    });
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isBinHovered, setIsBinHovered] = useState(false);
    const [isExternalDragOver, setIsExternalDragOver] = useState(false);

    const seenIdsRef = useRef<Set<string>>(new Set());
    const naturalSizesRef = useRef<Array<{ w: number; h: number }>>([]);

    /* ── Sync incoming images (support dynamic batch appending and filtering) ── */
    useEffect(() => {
        const incomingIds = new Set(images.map((img) => img.id));

        // If the incoming set is smaller or has different IDs than what we're showing, reset to match exactly
        const currentIds = new Set(orderedImages.map((img) => img.id));
        const removedSome = orderedImages.some((img) => !incomingIds.has(img.id));

        if (removedSome) {
            // Preserve order of items that still exist, then append genuinely new ones
            const kept = orderedImages.filter((img) => incomingIds.has(img.id));
            const keptIds = new Set(kept.map((img) => img.id));
            const added = images.filter((img) => !keptIds.has(img.id));
            seenIdsRef.current = new Set([...keptIds, ...added.map((img) => img.id)]);
            setOrderedImages([...kept, ...added]);
            return;
        }

        // Otherwise just append new images (streaming append path)
        const newImages: GalleryImage[] = [];
        for (const img of images) {
            if (!currentIds.has(img.id) && !seenIdsRef.current.has(img.id)) {
                seenIdsRef.current.add(img.id);
                newImages.push(img);
            }
        }
        if (newImages.length > 0) {
            setOrderedImages((prev) => [...prev, ...newImages]);
        }
    }, [images]); // eslint-disable-line react-hooks/exhaustive-deps

    /* ── Auto-size: measure natural dimensions of new images ── */
    useEffect(() => {
        if (imageSize) return; // client provided explicit size

        let cancelled = false;
        const pending: Array<Promise<void>> = [];

        for (const img of orderedImages) {
            const alreadyMeasured = naturalSizesRef.current.length >= orderedImages.length;
            if (alreadyMeasured) break;

            const p = new Promise<void>((resolve) => {
                const el = new Image();
                el.onload = () => {
                    if (!cancelled) {
                        naturalSizesRef.current.push({ w: el.naturalWidth, h: el.naturalHeight });
                    }
                    resolve();
                };
                el.onerror = () => resolve();
                el.src = img.src;
            });
            pending.push(p);
        }

        if (pending.length > 0) {
            Promise.all(pending).then(() => {
                if (!cancelled) {
                    setAutoSize(computeAutoSize(naturalSizesRef.current));
                }
            });
        }

        return () => {
            cancelled = true;
        };
    }, [orderedImages, imageSize]);

    const cellSize = imageSize ?? autoSize;

    /* ── Drag-and-drop handlers ── */
    const handleDragStart = useCallback(
        (e: React.DragEvent<HTMLDivElement>, index: number) => {
            setDragIndex(index);
            setIsDragging(true);
            e.dataTransfer.effectAllowed = "copyMove";
            e.dataTransfer.setData("text/plain", String(index));
            if (galleryId) {
                e.dataTransfer.setData(GALLERY_TRANSFER_TYPE, JSON.stringify({
                    galleryId,
                    image: orderedImages[index],
                    index,
                }));
            }
        },
        [galleryId, orderedImages]
    );

    const handleDragOver = useCallback(
        (e: React.DragEvent<HTMLDivElement>, index: number) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            setDragOverIndex(index);
        },
        []
    );

    const handleDragLeave = useCallback(() => {
        setDragOverIndex(null);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
            e.preventDefault();
            setDragOverIndex(null);

            const sourceIndex = dragIndex;
            if (sourceIndex === null || sourceIndex === dropIndex) {
                setDragIndex(null);
                return;
            }

            const reordered = [...orderedImages];
            const [moved] = reordered.splice(sourceIndex, 1);
            reordered.splice(dropIndex, 0, moved);

            setOrderedImages(reordered);
            setDragIndex(null);

            if (onReorder) {
                onReorder(reordered);
            }
        },
        [dragIndex, orderedImages, onReorder]
    );

    const handleDragEnd = useCallback(() => {
        setDragIndex(null);
        setDragOverIndex(null);
        setIsDragging(false);
        setIsBinHovered(false);
        setIsExternalDragOver(false);
    }, []);

    /* ── Cross-gallery drop handlers ── */
    const handleContainerDragOver = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            if (!enableCrossGalleryDrop) return;
            if (e.dataTransfer.types.includes(GALLERY_TRANSFER_TYPE)) {
                e.preventDefault();
                e.dataTransfer.dropEffect = "copy";
                setIsExternalDragOver(true);
            }
        },
        [enableCrossGalleryDrop]
    );

    const handleContainerDragLeave = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            const related = e.relatedTarget as Node | null;
            if (!related || !e.currentTarget.contains(related)) {
                setIsExternalDragOver(false);
            }
        },
        []
    );

    const handleContainerDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            setIsExternalDragOver(false);
            if (!enableCrossGalleryDrop || !onExternalDrop) return;
            const raw = e.dataTransfer.getData(GALLERY_TRANSFER_TYPE);
            if (!raw) return;
            try {
                const data = JSON.parse(raw) as { galleryId: string; image: GalleryImage };
                if (data.galleryId !== galleryId) {
                    e.preventDefault();
                    e.stopPropagation();
                    onExternalDrop([data.image], data.galleryId);
                }
            } catch { /* ignore malformed data */ }
        },
        [enableCrossGalleryDrop, onExternalDrop, galleryId]
    );

    /* ── Delete bin handlers ── */
    const handleBinDragOver = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = "move";
            setIsBinHovered(true);
        },
        []
    );

    const handleBinDragLeave = useCallback(() => {
        setIsBinHovered(false);
    }, []);

    const handleBinDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();
            setIsBinHovered(false);
            setIsDragging(false);
            if (dragIndex === null || !onDelete) return;
            const deletedImage = orderedImages[dragIndex];
            const deletedIndex = dragIndex;
            setDragIndex(null);
            onDelete(deletedImage, deletedIndex);
        },
        [dragIndex, orderedImages, onDelete]
    );

    /* ── Class assembly ── */
    const containerClasses = [
        "image-gallery",
        `image-gallery-${variant}`,
        `gallery-h-${horizontalSpacing}`,
        `gallery-v-${verticalSpacing}`,
        isExternalDragOver ? "gallery-external-drag-over" : "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div className={`image-gallery-outer ${className}`}>
        <div
            className={containerClasses}
            onDragOver={enableCrossGalleryDrop ? handleContainerDragOver : undefined}
            onDragLeave={enableCrossGalleryDrop ? handleContainerDragLeave : undefined}
            onDrop={enableCrossGalleryDrop ? handleContainerDrop : undefined}
        >
            {orderedImages.map((img, index) => {
                const isDragging = dragIndex === index;
                const isDragOver = dragOverIndex === index;

                const itemClasses = [
                    "gallery-item",
                    isDragging ? "dragging" : "",
                    isDragOver ? "drag-over" : "",
                ]
                    .filter(Boolean)
                    .join(" ");

                return (
                    <div
                        key={img.id}
                        className={itemClasses}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                        onClick={() => onImageClick?.(img, index)}
                    >
                        <div
                            className="gallery-item-image-wrapper"
                            style={{
                                width: cellSize.width,
                                height: cellSize.height,
                                borderRadius: borderRadius,
                                backgroundColor: img.backgroundColor,
                            }}
                        >
                            <img src={img.src} alt={img.alt ?? ""} draggable={false} />
                        </div>

                        {(img.line1 || img.line2) && (
                            <div className="gallery-item-caption" style={{ maxWidth: cellSize.width }}>
                                {img.line1 && <div className="gallery-item-line1">{img.line1}</div>}
                                {img.line2 && <div className="gallery-item-line2">{img.line2}</div>}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
        {enableDeleteBin && isDragging && (
            <div
                className={`gallery-delete-bin ${isBinHovered ? "gallery-delete-bin-active" : ""}`}
                onDragOver={handleBinDragOver}
                onDragLeave={handleBinDragLeave}
                onDrop={handleBinDrop}
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
            </div>
        )}
        </div>
    );
};

export default ImageGallery;
