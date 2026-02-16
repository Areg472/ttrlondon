"use client"

import React, {useState} from "react";

export function TrainTileCont({children, trainCount, x, y, isDouble}) {
    const [trainTrigger, setTrainTrigger] = useState(false);
    const [trainTriggerDouble, setTrainTriggerDouble] = useState(false);

    const toggleTrigger = (index) => {
        if (isDouble) {
            if (index % 2 === 0) {
                setTrainTrigger(!trainTrigger);
            } else {
                setTrainTriggerDouble(!trainTriggerDouble);
            }
        } else {
            setTrainTrigger(!trainTrigger);
        }
        console.log(`${trainCount} Train tiles clicked at index ${index}`);
    };

    // Recursively nest children so they attach at the ends
    const renderNestedChildren = (childrenArray, index = 0) => {
        if (childrenArray.length === 0) return null;
        const [first, ...rest] = childrenArray;
        
        let childPosition = { left: '100%', top: '-1px' };
        
        if (isDouble) {
            if (index % 2 === 0) {
                // For even indices (0, 2, 4...), the next tile should be BELOW it (parallel track)
                childPosition = { left: '0', top: '32px' };
            } else {
                // For odd indices (1, 3, 5...), the next tile should be AFTER the tile above it.
                childPosition = { left: '100%', top: '-33px' }; // -33px to account for border/offset
            }
        }

        const currentTrigger = isDouble 
            ? (index % 2 === 0 ? trainTrigger : trainTriggerDouble)
            : trainTrigger;

        return React.cloneElement(first, { 
            trainTrigger: currentTrigger,
            childPosition,
            index,
            onTileClick: toggleTrigger,
            children: renderNestedChildren(rest, index + 1)
        });
    };

    return (
        <div 
            className="flex w-fit h-fit flex-shrink-0 items-center"
            style={{ 
                minWidth: '80px', 
                minHeight: '32px',
                position: (x !== undefined || y !== undefined) ? 'absolute' : 'relative',
                left: x,
                top: y
            }}
        >
            {renderNestedChildren(React.Children.toArray(children))}
        </div>
    )
}

export function TrainTile({color, trainTrigger, trainColor, angle, children, childPosition, index, onTileClick}) {
    const defaultPosition = {
        position: 'absolute',
        left: '100%',
        top: '-1px', // Account for border
        display: 'flex',
        alignItems: 'center'
    };

    const combinedPosition = childPosition ? { ...defaultPosition, ...childPosition } : defaultPosition;

    const handleClick = (e) => {
        e.stopPropagation();
        if (onTileClick) {
            onTileClick(index);
        }
    };

    return (
        <div 
            className="flex-shrink-0 rounded-sm shadow-sm border border-gray-300 transition-transform duration-300 relative cursor-pointer"
            onClick={handleClick}
            style={{
                width: '80px',
                height: '32px',
                minWidth: '80px',
                minHeight: '32px',
                backgroundColor: color,
                transform: angle ? `rotate(${angle}deg)` : undefined,
                transformOrigin: 'left center',
                zIndex: 1
            }}
        >
            <div 
                className={`w-full h-full rounded-sm transition-opacity duration-300 ${trainTrigger ? 'opacity-100' : 'opacity-0'} pointer-events-none`}
                style={{
                    backgroundColor: trainTrigger ? trainColor : 'transparent',
                }}
            ></div>
            {children && (
                <div style={combinedPosition}>
                    {children}
                </div>
            )}
        </div>
    )
}