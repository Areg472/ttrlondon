"use client";

const LABEL_STYLES = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  "top-right": "bottom-full left-full ml-1 mb-1",
  "bottom-right": "top-full left-full ml-1 mt-1",
  "bottom-left": "top-full right-full mr-1 mt-1",
  "top-left": "bottom-full right-full mr-1 mb-1",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
};

const LABEL_SHADOW = {
  textShadow:
    "1px 1px 2px #000, -1px -1px 2px #000, 1px -1px 2px #000, -1px 1px 2px #000, 0 0 4px #000",
};

export function City({ name, number, x, y, labelPosition = "top" }) {
  return (
    <div
      className="absolute flex items-center justify-center rounded-full border-2 border-zinc-800 bg-white dark:bg-zinc-800 shadow-md"
      style={{ width: "32px", height: "32px", left: x, top: y, zIndex: 10 }}
    >
      <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
        {number}
      </span>
      {name && (
        <div
          className={`absolute whitespace-nowrap text-xs font-bold text-white pointer-events-none ${LABEL_STYLES[labelPosition] ?? LABEL_STYLES.top}`}
          style={LABEL_SHADOW}
        >
          {name}
        </div>
      )}
    </div>
  );
}
