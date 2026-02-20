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
  placedTiles: 0,
  // Optional mutation API; providers may attach this so routes can spend cards on claim
  spendCards: () => {},
  addPoints: () => {},
  canPlaceMore: () => true,
  incrementPlaced: () => {},
});

export function TrainTileCont({ children, trainCount, x, y, isDouble }) {
  const [trainTrigger, setTrainTrigger] = useState(false);
  const [trainTriggerDouble, setTrainTriggerDouble] = useState(false);
  const [claimedSide, setClaimedSide] = useState(null);
  const playerHand = useContext(PlayerHandContext);

  const baseColors = ["orange", "yellow", "blue", "green", "black", "red"];

  const canClaimWithColor = (routeColor) => {
    const length = Number(trainCount) || 0;
    const wilds = playerHand?.rainbow ?? 0;

    if (!length) return false;

    // Also enforce global placement cap
    if (typeof playerHand?.canPlaceMore === "function") {
      if (!playerHand.canPlaceMore(length)) return false;
    }

    if (routeColor === "gray") {
      // Any single color can be used, plus wilds
      return (
        baseColors.some((c) => (playerHand?.[c] ?? 0) + wilds >= length) ||
        wilds >= length
      );
    }

    const have = (playerHand?.[routeColor] ?? 0) + wilds;
    return have >= length;
  };

  // Compute how to pay for a route of given color/length using player's hand. Returns a map of deductions or null if not payable.
  const computeDeduction = (routeColor) => {
    const length = Number(trainCount) || 0;
    const wilds = playerHand?.rainbow ?? 0;
    if (!length) return null;

    if (routeColor === "gray") {
      // Try each base color to minimize wild usage
      let best = null;
      for (const c of baseColors) {
        const have = playerHand?.[c] ?? 0;
        const useColor = Math.min(have, length);
        const needWild = length - useColor;
        if (needWild <= wilds) {
          if (
            !best ||
            needWild < best.needWild ||
            (needWild === best.needWild && useColor > best.useColor)
          ) {
            best = { color: c, useColor, needWild };
          }
        }
      }
      // Fallback: all wilds if enough
      if (!best && wilds >= length) {
        best = { color: null, useColor: 0, needWild: length };
      }
      if (!best) return null;
      const deduction = {};
      if (best.color) deduction[best.color] = best.useColor;
      if (best.needWild) deduction["rainbow"] = best.needWild;
      return deduction;
    }

    // Colored route
    const have = playerHand?.[routeColor] ?? 0;
    const useColor = Math.min(have, length);
    const needWild = length - useColor;
    if (needWild <= wilds) {
      const deduction = {};
      if (useColor) deduction[routeColor] = useColor;
      if (needWild) deduction["rainbow"] = needWild;
      return deduction;
    }
    return null;
  };

  const toggleTrigger = (index, tileColor, isDisabled) => {
    if (isDisabled) return; // Not enough cards to claim this route

    const trySpend = () => {
      const length = Number(trainCount) || 0;
      // Capacity gate: block if exceeding 17 tiles in total
      if (typeof playerHand?.canPlaceMore === "function") {
        if (!playerHand.canPlaceMore(length)) return false;
      }

      const deduction = computeDeduction(tileColor);
      if (deduction && typeof playerHand?.spendCards === "function") {
        playerHand.spendCards(deduction);
      }

      // Handle scoring: 1:1, 2:2, 3:4, 4:7
      if (typeof playerHand?.addPoints === "function") {
        let points = 0;
        if (length === 1) points = 1;
        else if (length === 2) points = 2;
        else if (length === 3) points = 4;
        else if (length === 4) points = 7;

        if (points > 0) {
          playerHand.addPoints(points);
        }
      }

      if (typeof playerHand?.incrementPlaced === "function") {
        playerHand.incrementPlaced(length);
      }

      return true;
    };

    if (isDouble) {
      const side = index % 2 === 0 ? "even" : "odd";
      // If the other side is already claimed, block further clicks
      if (claimedSide && claimedSide !== side) return;
      // First successful click claims this side and locks the other
      if (!claimedSide) {
        // Spend cards once at claim time
        const ok = trySpend();
        if (!ok) return; // capacity blocked
        setClaimedSide(side);
      }
      if (side === "even") {
        setTrainTrigger(true);
      } else {
        setTrainTriggerDouble(true);
      }
    } else {
      // Single route: claim once (no toggle off) and spend at first claim
      if (!trainTrigger) {
        const ok = trySpend();
        if (!ok) return; // capacity blocked
        setTrainTrigger(true);
      }
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
      className={`flex-shrink-0 rounded-sm shadow-sm border border-gray-300 transition-transform duration-300 relative ${disabled ? "cursor-default" : "cursor-pointer"}`}
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
