"use client";

import React, { useContext, useMemo, useState } from "react";

// Simple context to provide player's current train card counts across the board
// Expected shape: { red:number, blue:number, green:number, yellow:number, orange:number, black:number, rainbow:number }
export const PlayerHandContext = React.createContext({
  red: 0,
  blue: 0,
  green: 0,
  yellow: 0,
  orange: 0,
  black: 0,
  rainbow: 0,
});

export function TrainTileCont({ children, trainCount, x, y, isDouble }) {
  const [trainTrigger, setTrainTrigger] = useState(false);
  const [trainTriggerDouble, setTrainTriggerDouble] = useState(false);
  const [claimedSide, setClaimedSide] = useState(null);
  const playerHand = useContext(PlayerHandContext);

  const canClaimWithColor = (routeColor) => {
    const length = Number(trainCount) || 0;
    const wilds = playerHand?.rainbow ?? 0;

    if (!length) return false;

    if (routeColor === "gray") {
      // Any single color can be used, plus wilds
      const colors = ["orange", "yellow", "blue", "green", "black", "red"];
      return colors.some((c) => (playerHand?.[c] ?? 0) + wilds >= length);
    }

    const have = (playerHand?.[routeColor] ?? 0) + wilds;
    return have >= length;
  };

  const toggleTrigger = (index, tileColor, isDisabled) => {
    if (isDisabled) return; // Not enough cards to claim this route
    if (isDouble) {
      const side = index % 2 === 0 ? "even" : "odd";
      // If the other side is already claimed, block further clicks
      if (claimedSide && claimedSide !== side) return;
      // First successful click claims this side and locks the other
      if (!claimedSide) setClaimedSide(side);
      if (side === "even") {
        setTrainTrigger(true);
      } else {
        setTrainTriggerDouble(true);
      }
    } else {
      setTrainTrigger(!trainTrigger);
    }
    console.log(
      `${trainCount} Train tiles clicked at index ${index} (color: ${tileColor})`,
    );
  };

  // Recursively nest children so they attach at the ends
  const renderNestedChildren = (childrenArray, index = 0) => {
    if (childrenArray.length === 0) return null;
    const [first, ...rest] = childrenArray;

    let childPosition = { left: "100%", top: "-1px" };

    if (isDouble) {
      if (index % 2 === 0) {
        // For even indices (0, 2, 4...), the next tile should be BELOW it (parallel track)
        childPosition = { left: "0", top: "32px" };
      } else {
        // For odd indices (1, 3, 5...), the next tile should be AFTER the tile above it.
        childPosition = { left: "100%", top: "-33px" }; // -33px to account for border/offset
      }
    }

    const side = index % 2 === 0 ? "even" : "odd";

    let currentTrigger = isDouble
      ? side === "even"
        ? trainTrigger
        : trainTriggerDouble
      : trainTrigger;

    const tileColor = first.props?.color;
    // Base disabled from hand
    let disabled = !canClaimWithColor(tileColor);
    // If one side already claimed, lock the opposite side
    if (isDouble && claimedSide && claimedSide !== side) {
      disabled = true;
      currentTrigger = false;
    }
    // If this side is the claimed one, force it to appear filled
    if (isDouble && claimedSide && claimedSide === side) {
      currentTrigger = true;
    }

    return React.cloneElement(first, {
      trainTrigger: currentTrigger,
      childPosition,
      index,
      disabled,
      onTileClick: toggleTrigger,
      children: renderNestedChildren(rest, index + 1),
    });
  };

  return (
    <div
      className="flex w-fit h-fit flex-shrink-0 items-center"
      style={{
        minWidth: "80px",
        minHeight: "32px",
        position: x !== undefined || y !== undefined ? "absolute" : "relative",
        left: x,
        top: y,
      }}
    >
      {renderNestedChildren(React.Children.toArray(children))}
    </div>
  );
}

export function TrainTile({
  color,
  trainTrigger,
  trainColor,
  angle,
  children,
  childPosition,
  index,
  onTileClick,
  disabled,
}) {
  const defaultPosition = {
    position: "absolute",
    left: "100%",
    top: "-1px", // Account for border
    display: "flex",
    alignItems: "center",
  };

  const combinedPosition = childPosition
    ? { ...defaultPosition, ...childPosition }
    : defaultPosition;

  const handleClick = (e) => {
    e.stopPropagation();
    if (disabled) return;
    if (onTileClick) {
      onTileClick(index, color, disabled);
    }
  };

  return (
    <div
      className={`flex-shrink-0 rounded-sm shadow-sm border border-gray-300 transition-transform duration-300 relative ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
      onClick={handleClick}
      style={{
        width: "80px",
        height: "32px",
        minWidth: "80px",
        minHeight: "32px",
        backgroundColor: color,
        transform: angle ? `rotate(${angle}deg)` : undefined,
        transformOrigin: "left center",
        zIndex: 1,
      }}
    >
      <div
        className={`w-full h-full rounded-sm transition-opacity duration-300 ${trainTrigger ? "opacity-100" : "opacity-0"} pointer-events-none`}
        style={{
          backgroundColor: trainTrigger ? trainColor : "transparent",
        }}
      ></div>
      {children && <div style={combinedPosition}>{children}</div>}
    </div>
  );
}
