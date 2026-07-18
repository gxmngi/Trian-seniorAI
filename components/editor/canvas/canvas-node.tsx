import React, { useState, useEffect, useRef } from "react";
import { Handle, Position, NodeProps, NodeResizer } from "@xyflow/react";
import { useMutation } from "@liveblocks/react";
import { LiveObject } from "@liveblocks/client";
import { CanvasNode, NODE_COLORS, ColorPair } from "@/types/canvas";

export function CanvasNodeComponent({ id, data, selected }: NodeProps<CanvasNode>) {
  // Find node color configuration from NODE_COLORS
  const colorName = data.color || "gray";
  const colorConfig =
    NODE_COLORS.find((c) => c.name === colorName) || NODE_COLORS[0];

  const { shape, label, isGhost } = data;

  const isSvgShape = ["diamond", "hexagon", "cylinder"].includes(shape);
  const isSelected = selected && !isGhost;

  // Local inline editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(label);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync edit value when database label changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(label);
    }
  }, [label, isEditing]);

  // Focus and select text when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  // Mutation to update node data properties collaboratively
  const updateNodeData = useMutation(({ storage }, nodeId: string, newData: any) => {
    const flow = storage.get("flow");
    if (flow) {
      const node = flow.get("nodes").get(nodeId);
      if (node) {
        node.set("data", {
          ...node.get("data"),
          ...newData,
        });
      }
    }
  }, []);

  // CSS Border and shadow styling
  const borderClass = isSelected
    ? "border-zinc-300 shadow-md shadow-black/30"
    : `${colorConfig.border} shadow-sm`;

  // SVG Fill and Stroke styling
  const svgFillClass = colorConfig.fill;
  const svgStrokeClass = isSelected
    ? "stroke-zinc-300 stroke-[1.5px]"
    : `${colorConfig.stroke} stroke-[1.2px]`;

  const ghostClass = isGhost ? "opacity-50" : "";

  // Render SVG shapes
  const renderSvgShape = () => {
    switch (shape) {
      case "diamond":
        return (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <polygon
              points="50,4 96,50 50,96 4,50"
              className={`${svgFillClass} ${svgStrokeClass} transition-colors duration-150`}
              strokeDasharray={isGhost ? "5,5" : undefined}
            />
          </svg>
        );
      case "hexagon":
        return (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <polygon
              points="25,4 75,4 96,50 75,96 25,96 4,50"
              className={`${svgFillClass} ${svgStrokeClass} transition-colors duration-150`}
              strokeDasharray={isGhost ? "5,5" : undefined}
            />
          </svg>
        );
      case "cylinder":
        return (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Main cylinder body */}
            <path
              d="M4,15 v70 c0,10 92,10 92,0 v-70"
              className={`${svgFillClass} ${svgStrokeClass} transition-colors duration-150`}
              strokeDasharray={isGhost ? "5,5" : undefined}
            />
            {/* Top cap */}
            <ellipse
              cx="50"
              cy="15"
              rx="46"
              ry="10"
              className={`${svgFillClass} ${svgStrokeClass} transition-colors duration-150`}
              strokeDasharray={isGhost ? "5,5" : undefined}
            />
            {/* Bottom cap border overlay */}
            <path
              d="M4,85 c0,10 92,10 92,0"
              fill="none"
              className={`${svgStrokeClass} transition-colors duration-150`}
              strokeDasharray={isGhost ? "5,5" : undefined}
            />
          </svg>
        );
      default:
        return null;
    }
  };

  // CSS shape classes
  const getCssShapeClass = () => {
    switch (shape) {
      case "pill":
        return "rounded-full";
      case "circle":
        return "rounded-full aspect-square";
      case "rectangle":
      default:
        return "rounded-lg";
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isGhost) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      setIsEditing(false);
    } else if (e.key === "Escape") {
      setIsEditing(false);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setEditValue(val);
    updateNodeData(id, { label: val });
  };

  const getSwatchBgClass = (pair: ColorPair) => {
    switch (pair.name) {
      case "gray": return "bg-[#e4e4e7]";
      case "blue": return "bg-[#3b82f6]";
      case "purple": return "bg-[#8b5cf6]";
      case "orange": return "bg-[#f97316]";
      case "red": return "bg-[#ef4444]";
      case "yellow": return "bg-[#ec4899]"; // Styled as Pink
      case "green": return "bg-[#10b981]";
      case "teal": return "bg-[#14b8a6]";
      default: return "bg-[#e4e4e7]";
    }
  };

  const getSwatchBorderClass = (pair: ColorPair, isActive: boolean) => {
    if (isActive) {
      return "border-white ring-1 ring-white/70";
    }
    return "border-[#121214] hover:border-white/35";
  };

  const getSwatchGlowStyle = (pair: ColorPair) => {
    const glowColors: Record<string, string> = {
      gray: "rgba(255, 255, 255, 0.35)",
      blue: "rgba(59, 130, 246, 0.45)",
      purple: "rgba(139, 92, 246, 0.45)",
      orange: "rgba(249, 115, 22, 0.45)",
      red: "rgba(239, 68, 68, 0.45)",
      yellow: "rgba(236, 72, 153, 0.45)",
      green: "rgba(16, 185, 129, 0.45)",
      teal: "rgba(20, 184, 166, 0.45)",
    };
    const shadowColor = glowColors[pair.name] || glowColors.gray;
    return {
      "--hover-glow": `0 0 7px 1.5px ${shadowColor}`,
    };
  };

  const displayLabel = label || (isEditing ? "" : "Label");
  const placeholderClass = !label && !isEditing ? "opacity-30 text-[10px] font-light tracking-wide" : "";

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className={`relative w-full h-full flex items-center justify-center select-none transition-all duration-150 group/node ${ghostClass} ${
        isSvgShape
          ? "bg-transparent border-none shadow-none"
          : `${getCssShapeClass()} border ${colorConfig.bg} ${borderClass} ${colorConfig.text} ${
              isGhost ? "border-dashed" : ""
            }`
      }`}
    >
      {/* Floating Color Toolbar (Only when node is selected) */}
      {isSelected && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="nodrag nopan nowheel absolute -top-11 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-[#121214] border border-[#27272a] px-1.5 py-1 rounded-full shadow-2xl shadow-black/85 animate-in fade-in zoom-in-95 duration-100 pointer-events-auto"
        >
          {NODE_COLORS.map((pair) => {
            const isActive = colorName === pair.name;
            const bgClass = getSwatchBgClass(pair);
            const borderStyleClass = getSwatchBorderClass(pair, isActive);
            const glowStyle = getSwatchGlowStyle(pair);

            return (
              <button
                key={pair.name}
                type="button"
                onClick={() => updateNodeData(id, { color: pair.name })}
                style={glowStyle as any}
                className={`h-3.5 w-3.5 rounded-full border transition-all duration-150 active:scale-90 hover:shadow-[var(--hover-glow)] cursor-pointer ${bgClass} ${borderStyleClass}`}
                title={`Set color to ${pair.name}`}
              />
            );
          })}
        </div>
      )}

      {/* Node Resizer */}
      {!isGhost && (
        <NodeResizer
          isVisible={selected}
          minWidth={60}
          minHeight={40}
          handleClassName="!w-2 !h-2 !bg-bg-base !border !border-zinc-500 !rounded-full"
          lineClassName="!border-zinc-500/30"
        />
      )}

      {/* SVG Shape background & border */}
      {isSvgShape && renderSvgShape()}

      {/* Center content wrapper */}
      <div className="relative z-10 w-full h-full flex items-center justify-center p-3 select-none pointer-events-none">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editValue}
            onChange={handleTextareaChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="nodrag nopan nowheel w-full h-full bg-transparent border-none outline-none resize-none text-xs font-semibold text-center leading-tight focus:ring-0 p-0 m-0 text-text-primary pointer-events-auto"
          />
        ) : (
          <span className={`text-xs font-semibold text-center leading-tight break-words max-w-full select-none pointer-events-none ${isSvgShape ? colorConfig.text : ""} ${placeholderClass}`}>
            {displayLabel}
          </span>
        )}
      </div>

      {/* Connection Handles (Only if not a ghost preview) */}
      {!isGhost && (
        <>
          <Handle
            type="target"
            position={Position.Top}
            id="t"
            className={`!w-2 !h-2 !bg-white !border !border-zinc-950 shadow-md transition-opacity duration-150 ${
              isSelected ? "opacity-100" : "opacity-0 group-hover/node:opacity-100"
            }`}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="b"
            className={`!w-2 !h-2 !bg-white !border !border-zinc-950 shadow-md transition-opacity duration-150 ${
              isSelected ? "opacity-100" : "opacity-0 group-hover/node:opacity-100"
            }`}
          />
          <Handle
            type="target"
            position={Position.Left}
            id="l"
            className={`!w-2 !h-2 !bg-white !border !border-zinc-950 shadow-md transition-opacity duration-150 ${
              isSelected ? "opacity-100" : "opacity-0 group-hover/node:opacity-100"
            }`}
          />
          <Handle
            type="source"
            position={Position.Right}
            id="r"
            className={`!w-2 !h-2 !bg-white !border !border-zinc-950 shadow-md transition-opacity duration-150 ${
              isSelected ? "opacity-100" : "opacity-0 group-hover/node:opacity-100"
            }`}
          />
        </>
      )}
    </div>
  );
}
