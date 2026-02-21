"use client";

import React from "react";

export function City({ name, number, x, y, labelPosition = "top" }) {
  const getLabelStyle = (p) => {
    const styles = {
      top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
      bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
      "top-right": "bottom-full left-full ml-1 mb-1",
      "bottom-right": "top-full left-full ml-1 mt-1",
      "bottom-left": "top-full right-full mr-1 mt-1",
      "top-left": "bottom-full right-full mr-1 mb-1",
      right: "left-full top-1/2 -translate-y-1/2 ml-2",
      left: "right-full top-1/2 -translate-y-1/2 mr-2",
    };
    return styles[p] || styles.top;
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
            textShadow:
              "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0px 1px 0 #000, 0px -1px 0 #000, 1px 0px 0 #000, -1px 0px 0 #000",
          }}
        >
          {name}
        </div>
      )}
    </div>
  );
}
