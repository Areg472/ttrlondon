"use client"

import React from "react";

export function City({ name, number, x, y, labelPosition = "top" }) {
  const getLabelStyle = (position) => {
    switch (position) {
      case "top":
        return "bottom-full left-1/2 -translate-x-1/2 mb-2";
      case "bottom":
        return "top-full left-1/2 -translate-x-1/2 mt-2";
      case "top-right":
        return "bottom-full left-full ml-1 mb-1";
      case "bottom-right":
        return "top-full left-full ml-1 mt-1";
      case "bottom-left":
        return "top-full right-full mr-1 mt-1";
      case "top-left":
        return "bottom-full right-full mr-1 mb-1";
      case "right":
        return "left-full top-1/2 -translate-y-1/2 ml-2";
      case "left":
        return "right-full top-1/2 -translate-y-1/2 mr-2";
      default:
        return "bottom-full left-1/2 -translate-x-1/2 mb-2";
    }
  };

  return (
    <div
      className="absolute flex items-center justify-center rounded-full border-2 border-zinc-800 bg-white dark:bg-zinc-800 dark:border-zinc-100 shadow-md"
      style={{
        width: "32px",
        height: "32px",
        left: x,
        top: y,
        zIndex: 10,
      }}
    >
      <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
        {number}
      </span>
      {name && (
        <div 
          className={`absolute whitespace-nowrap text-xs font-semibold text-zinc-700 dark:text-zinc-300 pointer-events-none ${getLabelStyle(labelPosition)}`}
          style={{
            textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0px 1px 0 #000, 0px -1px 0 #000, 1px 0px 0 #000, -1px 0px 0 #000'
          }}
        >
          {name}
        </div>
      )}
    </div>
  );
}
