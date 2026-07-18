import React from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { CanvasNode, NODE_COLORS } from "@/types/canvas";

export function CanvasNodeComponent({ data, selected }: NodeProps<CanvasNode>) {
  // Find node color configuration from NODE_COLORS
  const colorName = data.color || "gray";
  const colorConfig =
    NODE_COLORS.find((c) => c.name === colorName) || NODE_COLORS[0];

  return (
    <div
      className={`relative w-full h-full min-w-[60px] min-h-[40px] rounded-lg border px-3 py-1.5 flex items-center justify-center shadow-sm select-none transition-all duration-150 ${colorConfig.bg} ${colorConfig.border} ${colorConfig.text} ${
        selected ? "ring-2 ring-accent-primary/60 border-accent-primary" : ""
      }`}
    >
      <span className="text-xs font-semibold text-center leading-tight truncate max-w-full">
        {data.label}
      </span>

      {/* Connection Handles (Top, Bottom, Left, Right) */}
      <Handle
        type="target"
        position={Position.Top}
        id="t"
        className="!w-2 !h-2 !bg-accent-primary border-none opacity-0 group-hover/node:opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="b"
        className="!w-2 !h-2 !bg-accent-primary border-none opacity-0 group-hover/node:opacity-100 transition-opacity"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="l"
        className="!w-2 !h-2 !bg-accent-primary border-none opacity-0 group-hover/node:opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="r"
        className="!w-2 !h-2 !bg-accent-primary border-none opacity-0 group-hover/node:opacity-100 transition-opacity"
      />
    </div>
  );
}
