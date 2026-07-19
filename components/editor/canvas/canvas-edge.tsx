import React, { useState, useEffect, useRef } from "react";
import { EdgeProps, getSmoothStepPath, EdgeLabelRenderer, Position } from "@xyflow/react";
import { useMutation } from "@liveblocks/react";

export function CanvasEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition = Position.Right,
  targetPosition = Position.Left,
  selected,
  label,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(label ? String(label) : "");
  const inputRef = useRef<HTMLInputElement>(null);

  const isActive = selected || isHovered;

  useEffect(() => {
    if (!isEditing) {
      setEditValue(label ? String(label) : "");
    }
  }, [label, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Mutation to update edge label properties collaboratively
  const updateEdgeLabel = useMutation(({ storage }, edgeId: string, newLabel: string) => {
    const flow = storage.get("flow");
    if (flow) {
      const edgesMap = flow.get("edges");
      const edge = edgesMap.get(edgeId);
      if (edge) {
        edge.set("label", newLabel);
      }
    }
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleBlur = () => {
    setIsEditing(false);
    updateEdgeLabel(id, editValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setIsEditing(false);
      updateEdgeLabel(id, editValue);
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditValue(label ? String(label) : "");
    }
  };

  // Define stroke styling matching screenshot theme
  const strokeColor = isActive ? "var(--accent-primary)" : "#3f3f46";
  const strokeWidth = isActive ? 2 : 1.5;

  return (
    <>
      {/* Interaction path (thick, invisible) */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={15}
        className="cursor-pointer pointer-events-auto animate-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      />
      {/* Visible path */}
      <path
        d={edgePath}
        fill="none"
        style={{
          stroke: strokeColor,
          strokeWidth: strokeWidth,
        }}
        markerEnd={`url(#arrow-${id})`}
        className="transition-all duration-150 pointer-events-none"
      />
      {/* Marker Definition (Dynamic arrow color) */}
      <defs>
        <marker
          id={`arrow-${id}`}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path
            d="M 0 1.5 L 8 5 L 0 8.5 z"
            fill={strokeColor}
            className="transition-colors duration-150"
          />
        </marker>
      </defs>

      {/* Edge Label Renderer */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan nowheel z-30 select-none"
          onClick={handleClick}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={handleInputChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                width: `${Math.max(editValue.length * 6 + 18, 50)}px`,
              }}
              className="bg-[#121214] border border-[#27272a] px-2 py-0.5 rounded text-[10px] text-text-primary text-center font-semibold focus:ring-1 focus:ring-accent-primary outline-none"
            />
          ) : label ? (
            <div className="bg-[#121214] border border-[#27272a] text-zinc-300 px-2 py-0.5 rounded-full text-[9px] font-semibold shadow-md shadow-black/30">
              {String(label)}
            </div>
          ) : isActive ? (
            <div className="bg-[#121214]/80 border border-dashed border-[#27272a]/60 text-zinc-400 opacity-40 hover:opacity-100 hover:border-zinc-500 px-2 py-0.5 rounded-full text-[9px] font-normal cursor-pointer transition-all duration-150">
              Label
            </div>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
