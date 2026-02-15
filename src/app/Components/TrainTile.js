"use client"

import React, {useState} from "react";

export function TrainTileCont({children, trainCount}) {
    const [trainTrigger, setTrainTrigger] = useState(false);

    const toggleTrigger = () => {
        setTrainTrigger(!trainTrigger);
        console.log(`${trainCount} Train tiles clicked`);
    };

    // Recursively nest children so they attach at the ends
    const renderNestedChildren = (childrenArray) => {
        if (childrenArray.length === 0) return null;
        const [first, ...rest] = childrenArray;
        return React.cloneElement(first, { 
            trainTrigger,
            children: renderNestedChildren(rest)
        });
    };

    return (
        <div 
            className="cursor-pointer flex w-fit h-fit flex-shrink-0 items-center"
            onClick={toggleTrigger}
            style={{ minWidth: '80px', minHeight: '32px' }}
        >
            {renderNestedChildren(React.Children.toArray(children))}
        </div>
    )
}

export function TrainTile({color, trainTrigger, trainColor, angle, children}) {
    return (
        <div 
            className="flex-shrink-0 rounded-sm shadow-sm border border-gray-300 transition-transform duration-300 relative"
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
                className={`w-full h-full rounded-sm transition-opacity duration-300 ${trainTrigger ? 'opacity-100' : 'opacity-0'}`}
                style={{
                    backgroundColor: trainTrigger ? trainColor : 'transparent',
                }}
            ></div>
            {children && (
                <div style={{
                    position: 'absolute',
                    left: '100%',
                    top: '-1px', // Account for border
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    {children}
                </div>
            )}
        </div>
    )
}