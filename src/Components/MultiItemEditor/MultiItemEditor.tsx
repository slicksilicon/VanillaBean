import { useRef, useState } from "react";
import type { DragEvent } from "react";
import "./MultiItemEditor.css";

interface MultiItemEditorProps {
    items: string[];
    onChange: (items: string[]) => void;
    placeholder?: string;
}

const MultiItemEditor = ({ items, onChange, placeholder = "Add item..." }: MultiItemEditorProps) => {
    const dragIndex = useRef<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const handleItemChange = (index: number, value: string) => {
        const next = [...items];
        next[index] = value;
        onChange(next);
    };

    const handleRemove = (index: number) => {
        onChange(items.filter((_, i) => i !== index));
    };

    const handleAdd = () => {
        onChange([...items, ""]);
    };

    const handleDragStart = (index: number) => {
        dragIndex.current = index;
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>, dropIndex: number) => {
        e.preventDefault();
        const src = dragIndex.current;
        if (src === null || src === dropIndex) {
            setDragOverIndex(null);
            return;
        }
        const next = [...items];
        const [moved] = next.splice(src, 1);
        next.splice(dropIndex, 0, moved);
        onChange(next);
        dragIndex.current = null;
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        dragIndex.current = null;
        setDragOverIndex(null);
    };

    return (
        <div className="mie-container">
            {items.map((item, index) => (
                <div
                    key={index}
                    className={`mie-row${dragOverIndex === index ? " mie-row--drag-over" : ""}`}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                >
                    <span className="mie-drag-handle" title="Drag to reorder">⠿</span>
                    <input
                        className="mie-input"
                        type="text"
                        value={item}
                        onChange={(e) => handleItemChange(index, e.target.value)}
                        placeholder={placeholder}
                    />
                    <button className="mie-remove-btn" onClick={() => handleRemove(index)} title="Remove">✕</button>
                </div>
            ))}
            <button className="mie-add-btn" onClick={handleAdd}>
                <span className="mie-add-icon">+</span>
                <span>Add</span>
            </button>
        </div>
    );
};

export default MultiItemEditor;
