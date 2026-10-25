import React from "react";
import StatusPill, { type StatusVariant } from "../StatusPill/StatusPill";
import "../ListCard/ListCard.css";

export interface DraggableListCardProps {
    icon: string;
    name: string;
    pillVariant: StatusVariant;
    pillText: string;
    details: string[];
    onClick?: () => void;
    onStatusClick?: () => void;
    onHoverCallback?: () => void;
    className?: string;
    draggable?: boolean;
    onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
    id?: string;
}

const DraggableListCard: React.FC<React.PropsWithChildren<DraggableListCardProps>> = ({
    icon,
    name,
    pillVariant,
    pillText,
    details,
    onClick,
    onStatusClick,
    onHoverCallback,
    className = "",
    draggable = true,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDrop,
    id,
}) => {
    return (
        <div
            className={`list-card ${className} ${draggable ? "draggable" : ""}`}
            onClick={onClick}
            onMouseEnter={onHoverCallback}
            draggable={draggable}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
            onDrop={onDrop}
            data-id={id}
        >
            <img className="list-card-icon" src={icon} alt={name} />

            <div className="list-card-center">
                <h4>{name}</h4>
                <div className="list-card-pill">
                    <StatusPill text={pillText} variant={pillVariant} onClick={onStatusClick} />
                </div>
            </div>

            <div className="list-card-details">
                {details.map((detail, index) => (
                    <div key={index} dangerouslySetInnerHTML={{ __html: detail }}></div>
                ))}
            </div>
        </div>
    );
};

export default DraggableListCard;
