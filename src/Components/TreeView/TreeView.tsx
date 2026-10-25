import React, { useState, useEffect } from 'react';
import './TreeView.css';

// --- Types & Interfaces (Exported) ---

export interface TreeNodeData {
    id: string;
    label: string;
    children?: TreeNodeData[];
    initiallyExpanded?: boolean;
    draggable?: boolean;
    droppable?: boolean;
}

export interface TreeViewProps {
    data: TreeNodeData[];
    /** Callback when a leaf node is selected */
    onSelect?: (node: TreeNodeData) => void;
    /** Optional: Controls which node is highlighted initially */
    initialSelectedId?: string;
    /** Callback when items are reordered via drag-and-drop */
    onReorder?: (parentId: string | null, reorderedChildren: TreeNodeData[]) => void;
}

interface TreeNodeProps {
    node: TreeNodeData;
    selectedId: string | null;
    onSelectNode: (node: TreeNodeData) => void;
    level?: number;
    onReorder?: (parentId: string | null, reorderedChildren: TreeNodeData[]) => void;
    parentId?: string | null;
    siblings?: TreeNodeData[];
}


// Helper function to find the first leaf node
const findFirstLeafNode = (nodes: TreeNodeData[]): TreeNodeData | null => {
    for (const node of nodes) {
        if (!node.children || node.children.length === 0) {
        return node;
        }
        const leafInChildren = findFirstLeafNode(node.children);
        if (leafInChildren) {
        return leafInChildren;
        }
    }
    
    return null;
}


// --- Internal Recursive Component ---
const TreeNode: React.FC<TreeNodeProps> = ({ node, selectedId, onSelectNode, level = 0, onReorder, parentId = null, siblings = [] }) => {
    const [isOpen, setIsOpen] = useState(node.initiallyExpanded ?? true);
    const [isDragging, setIsDragging] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
  
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedId === node.id;

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!hasChildren) {
        onSelectNode(node);
        } else {
        // Optional: Click on folder text toggles it too
        setIsOpen(!isOpen);
        }
    };

    const handleDragStart = (e: React.DragEvent) => {
        if (!node.draggable) return;
        e.stopPropagation();
        setIsDragging(true);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("application/json", JSON.stringify({ nodeId: node.id, parentId }));
    };

    const handleDragEnd = (e: React.DragEvent) => {
        e.stopPropagation();
        setIsDragging(false);
        setIsDragOver(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        if (!node.droppable) return;
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "move";
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        if (!node.droppable || !onReorder) return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        try {
            const data = JSON.parse(e.dataTransfer.getData("application/json"));
            const draggedNodeId = data.nodeId;
            const draggedParentId = data.parentId;

            // Only reorder if dragging within the same parent
            if (draggedParentId !== parentId || draggedNodeId === node.id) return;

            // Find dragged node index and target node index
            const draggedIndex = siblings.findIndex((n) => n.id === draggedNodeId);
            const targetIndex = siblings.findIndex((n) => n.id === node.id);

            if (draggedIndex === -1 || targetIndex === -1) return;

            // Create reordered array
            const reordered = [...siblings];
            const [draggedNode] = reordered.splice(draggedIndex, 1);
            reordered.splice(targetIndex, 0, draggedNode);

            onReorder(parentId, reordered);
        } catch (error) {
            console.error("Error handling drop:", error);
        }
    };

    return (
        <div className="tree-node-wrapper">
            <div 
                className={`node-content ${isSelected ? "selected" : ""} ${isDragging ? "dragging" : ""} ${isDragOver ? "drag-over" : ""}`}
                onClick={handleClick}
                draggable={node.draggable ?? false}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{ paddingLeft: `${level * 20 + 5}px` }} 
            >
            {/* Render Arrow if branch, Spacer if leaf */}
        
            {hasChildren ? (
                <span className={`toggle-icon ${isOpen ? "expanded" : ""}`} onClick={handleToggle}> ▶ </span>
            ) : (
                <span className="spacer" />
            )}
        
            <span className="node-label">{node.label}</span>
        </div>

        {/* Recursive Render */}
        {hasChildren && isOpen && node.children && (
            <div className="node-children">
            {node.children.map((child) => (
                <TreeNode
                key={child.id}
                node={child}
                selectedId={selectedId}
                onSelectNode={onSelectNode}
                level={level + 1}
                onReorder={onReorder}
                parentId={node.id}
                siblings={node.children || []}
                />
            ))}
            </div>
      )}
    </div>
  );
};

// --- Main Exported Component ---

export const TreeView: React.FC<TreeViewProps> = ({ data, onSelect, initialSelectedId = null, onReorder }) => {
    const [selectedId, setSelectedId] = useState<string | null>(() => {
        if (initialSelectedId) {
            return initialSelectedId;
        }
        const firstLeaf = findFirstLeafNode(data);
        return firstLeaf ? firstLeaf.id : null;
    });
  
    useEffect(() => {
        if (!initialSelectedId && onSelect) {
            const firstLeaf = findFirstLeafNode(data);
            if (firstLeaf) {
                onSelect(firstLeaf);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleNodeSelect = (node: TreeNodeData) => {
        setSelectedId(node.id);
        if (onSelect) {
            onSelect(node);
        }
    };

    return (
        <div className="tree-container">
        {data.map((node) => (
            <TreeNode
            key={node.id}
            node={node}
            selectedId={selectedId}
            onSelectNode={handleNodeSelect}
            level={0}
            onReorder={onReorder}
            parentId={null}
            siblings={data}
            />
        ))}
        </div>
    );
};

export default TreeView;