"use client"

import React, {useState} from "react";

export function TrainTileCont({children, trainCount}) {
    const [trainTrigger, setTrainTrigger] = useState(false);

    const toggleTrigger = () => {
        setTrainTrigger(!trainTrigger);
        console.log(`${trainCount} Train tiles clicked`);
    };

    return (
        <div 
            className="cursor-pointer flex w-fit h-fit flex-shrink-0 gap-4"
            onClick={toggleTrigger}
            style={{ minWidth: '80px', minHeight: '32px' }}
        >
            {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child, { trainTrigger });
                }
                return child;
            })}
        </div>
    )
}

export function TrainTile({color, trainTrigger, trainColor, angle}) {
    return (
        <div 
            className="flex-shrink-0 rounded-sm shadow-sm border border-gray-300 transition-transform duration-300"
            style={{
                width: '80px',
                height: '32px',
                minWidth: '80px',
                minHeight: '32px',
                backgroundColor: color,
                transform: angle ? `rotate(${angle}deg)` : undefined
            }}
        >
            <div 
                className={`w-full h-full rounded-sm transition-opacity duration-300 ${trainTrigger ? 'opacity-100' : 'opacity-0'}`}
                style={{
                    backgroundColor: trainTrigger ? trainColor : 'transparent',
                }}
            ></div>
        </div>
    )
}