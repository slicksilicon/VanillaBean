import React from 'react';
import StatusPill, {type StatusVariant} from '../StatusPill/StatusPill';
import './ListCard.css';

export interface ListCardProps  {
    icon : string;
    name : string;
    pillVariant : StatusVariant;
    pillText : string;
    details : string[];
    onClick?: () => void;
    onStatusClick?: () => void;
    onHoverCallback? : () => void;
    className?: string;
}


const ListCard: React.FC<React.PropsWithChildren<ListCardProps>> = ({ icon, 
    name, 
    pillVariant, 
    pillText, 
    details, 
    onClick, 
    onStatusClick,
    onHoverCallback, 
    className = ''}) => {
    
        return (
            <div className={`list-card ${className}`} onClick={onClick} onMouseEnter={onHoverCallback}>
                <img className="list-card-icon" src={icon}/>                
                <div className='list-card-center'>
                    <h4>{name}</h4>
                    <StatusPill text={pillText} variant={pillVariant} onClick={onStatusClick}/>                                                                
                </div>

                {details.length > 0 && (
                <div className='list-card-details'>
                    {details.map((detail, index) => (
                        <div key={index} dangerouslySetInnerHTML={{ __html: detail }}></div>
                    ))}
                </div>
                )}
            </div>
        );
    }

export default ListCard;
