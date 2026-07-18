import type { Node, Edge } from "@xyflow/react";

export const NODE_SHAPES = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
] as const;

export type NodeShape = typeof NODE_SHAPES[number];

export const SHAPE_DEFAULTS: Record<NodeShape, { width: number; height: number }> = {
  rectangle: { width: 120, height: 60 },
  diamond: { width: 100, height: 100 },
  circle: { width: 80, height: 80 },
  pill: { width: 100, height: 50 },
  cylinder: { width: 90, height: 80 },
  hexagon: { width: 100, height: 80 },
};

export interface ColorPair {
  name: string;
  bg: string;
  border: string;
  text: string;
}

export const NODE_COLORS: ColorPair[] = [
  { name: "gray", bg: "bg-bg-subtle", border: "border-border-default", text: "text-text-primary" },
  { name: "red", bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400" },
  { name: "orange", bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400" },
  { name: "yellow", bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400" },
  { name: "green", bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400" },
  { name: "teal", bg: "bg-teal-500/10", border: "border-teal-500/30", text: "text-teal-400" },
  { name: "blue", bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400" },
  { name: "purple", bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400" },
];

export interface CanvasNodeData extends Record<string, unknown> {
  label: string;
  color?: string; // name from NODE_COLORS (e.g. "gray", "red")
  shape: NodeShape;
}

export type CanvasNode = Node<CanvasNodeData, "canvasNode">;
export type CanvasEdge = Edge;

