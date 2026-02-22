"use client";

import React, { useContext, useState } from "react";

export const PlayerHandContext = React.createContext({
  red: 0,
  blue: 0,
  green: 0,
  yellow: 0,
  orange: 0,
  black: 0,
  rainbow: 0,
  placedTiles: 0,
  spendCards: () => {},
  addPoints: () => {},
  canPlaceMore: () => true,
  incrementPlaced: () => {},
  incrementTurn: () => {},
  cardsDrawn: 0,
  isAiTurn: false,
  claimedRoutes: {},
  claimRoute: () => {},
});

export function TrainTileCont({
  children,
  trainCount,
  x,
  y,
  isDouble,
  routeId,
}) {
  const [trainTrigger, setTrainTrigger] = useState(false);
  const [trainTriggerDouble, setTrainTriggerDouble] = useState(false);
  const [claimedSide, setClaimedSide] = useState(null);
  const playerHand = useContext(PlayerHandContext);

  const baseColors = ["orange", "yellow", "blue", "green", "black", "red"];

  const canClaimWithColor = (routeColor, side) => {
    if (playerHand?.claimedRoutes?.[`${routeId}_${side}`]) return false;
    if (playerHand?.isAiTurn) return false;
    if (playerHand?.cardsDrawn > 0) return false;
    const length = Number(trainCount) || 0,
      wilds = playerHand?.rainbow ?? 0;
    if (
      !length ||
      (playerHand?.canPlaceMore && !playerHand.canPlaceMore(length))
    )
      return false;
    if (routeColor === "gray")
      return (
        baseColors.some((c) => (playerHand?.[c] ?? 0) + wilds >= length) ||
        wilds >= length
      );
    return (playerHand?.[routeColor] ?? 0) + wilds >= length;
  };

  const computeDeduction = (routeColor) => {
    const length = Number(trainCount) || 0;
    const wilds = playerHand?.rainbow ?? 0;
    if (!length) return null;

    if (routeColor === "gray") {
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
      if (!best && wilds >= length) {
        best = { color: null, useColor: 0, needWild: length };
      }
      if (!best) return null;
      const deduction = {};
      if (best.color) deduction[best.color] = best.useColor;
      if (best.needWild) deduction["rainbow"] = best.needWild;
      return deduction;
    }

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
    if (isDisabled) return;
    const trySpend = () => {
      const length = Number(trainCount) || 0;
      if (playerHand?.canPlaceMore && !playerHand.canPlaceMore(length))
        return false;
      const deduction = computeDeduction(tileColor);
      if (deduction && playerHand?.spendCards) playerHand.spendCards(deduction);
      if (playerHand?.addPoints) {
        const points = { 1: 1, 2: 2, 3: 4, 4: 7 }[length] || 0;
        if (points) playerHand.addPoints(points);
      }
      if (playerHand?.incrementPlaced) playerHand.incrementPlaced(length);
      if (playerHand?.incrementTurn) playerHand.incrementTurn();
      return true;
    };
    if (isDouble) {
      const side = index % 2 === 0 ? "even" : "odd";
      if (playerHand?.claimedRoutes?.[`${routeId}_${side}`]) return;
      if (claimedSide && claimedSide !== side) return;
      if (!claimedSide && !trySpend()) return;
      if (!claimedSide) {
        setClaimedSide(side);
        if (playerHand?.claimRoute)
          playerHand.claimRoute(routeId, side, "player");
      }
      side === "even" ? setTrainTrigger(true) : setTrainTriggerDouble(true);
    } else {
      if (
        playerHand?.claimedRoutes?.[`${routeId}_single`] ||
        playerHand?.claimedRoutes?.[`${routeId}_even`] ||
        playerHand?.claimedRoutes?.[`${routeId}_odd`]
      )
        return;
      if (trainTrigger) return;
      if (!trySpend()) return;
      setTrainTrigger(true);
      if (playerHand?.claimRoute)
        playerHand.claimRoute(routeId, "single", "player");
    }
  };

  const renderNestedChildren = (childrenArray, index = 0) => {
    if (childrenArray.length === 0) return null;
    const [first, ...rest] = childrenArray;

    let childPosition = { left: "100%", top: "-1px" };

    if (isDouble) {
      if (index % 2 === 0) {
        childPosition = { left: "0", top: "32px" };
      } else {
        childPosition = { left: "100%", top: "-33px" };
      }
    }

    const side = isDouble ? (index % 2 === 0 ? "even" : "odd") : "single";
    const claimType = playerHand?.claimedRoutes?.[`${routeId}_${side}`];

    let currentTrigger = isDouble
      ? side === "even"
        ? trainTrigger
        : trainTriggerDouble
      : trainTrigger;

    if (claimType) currentTrigger = true;

    const tileColor = first.props?.color;
    let disabled = !canClaimWithColor(tileColor, side);
    if (isDouble && claimedSide && claimedSide !== side) {
      disabled = true;
      if (!claimType) currentTrigger = false;
    }
    if (isDouble && claimedSide && claimedSide === side) {
      currentTrigger = true;
    }

    return React.cloneElement(first, {
      trainTrigger: currentTrigger,
      trainColor: claimType === "ai" ? "red" : "yellow",
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
    top: "-1px",
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
      className={`flex-shrink-0 rounded-sm shadow-sm border border-gray-300 transition-transform duration-300 relative flex items-center justify-center ${disabled ? "cursor-default" : "cursor-pointer"}`}
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
        className={`absolute inset-0 transition-opacity duration-300 ${trainTrigger ? "opacity-100" : "opacity-0"} pointer-events-none flex items-center justify-center`}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 80 32"
          preserveAspectRatio="none"
        >
          <line
            x1="10"
            y1="5"
            x2="70"
            y2="27"
            stroke={trainColor || "black"}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <line
            x1="70"
            y1="5"
            x2="10"
            y2="27"
            stroke={trainColor || "black"}
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {children && <div style={combinedPosition}>{children}</div>}
    </div>
  );
}
