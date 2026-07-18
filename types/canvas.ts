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
  fill: string;
  stroke: string;
}

export const NODE_COLORS: ColorPair[] = [
  { name: "gray", bg: "bg-[#18181b] backdrop-blur-xs", border: "border-zinc-800", text: "text-zinc-200", fill: "fill-[#18181b]", stroke: "stroke-zinc-800" },
  { name: "blue", bg: "bg-[#0c1a30] backdrop-blur-xs", border: "border-[#1e3d75]/70", text: "text-blue-400", fill: "fill-[#0c1a30]", stroke: "stroke-[#1e3d75]/70" },
  { name: "purple", bg: "bg-[#18122b] backdrop-blur-xs", border: "border-[#3f2375]/70", text: "text-purple-400", fill: "fill-[#18122b]", stroke: "stroke-[#3f2375]/70" },
  { name: "orange", bg: "bg-[#241508] backdrop-blur-xs", border: "border-[#6b350a]/70", text: "text-orange-400", fill: "fill-[#241508]", stroke: "stroke-[#6b350a]/70" },
  { name: "red", bg: "bg-[#280c0c] backdrop-blur-xs", border: "border-[#7a1818]/70", text: "text-red-400", fill: "fill-[#280c0c]", stroke: "stroke-[#7a1818]/70" },
  { name: "yellow", bg: "bg-[#280c20] backdrop-blur-xs", border: "border-[#751252]/70", text: "text-pink-400", fill: "fill-[#280c20]", stroke: "stroke-[#751252]/70" },
  { name: "green", bg: "bg-[#061c12] backdrop-blur-xs", border: "border-[#114f30]/70", text: "text-green-400", fill: "fill-[#061c12]", stroke: "stroke-[#114f30]/70" },
  { name: "teal", bg: "bg-[#042222] backdrop-blur-xs", border: "border-[#0e5c54]/70", text: "text-teal-400", fill: "fill-[#042222]", stroke: "stroke-[#0e5c54]/70" },
];

export interface CanvasNodeData extends Record<string, unknown> {
  label: string;
  color?: string; // name from NODE_COLORS (e.g. "gray", "red")
  shape: NodeShape;
}

export type CanvasNode = Node<CanvasNodeData, "canvasNode">;
export type CanvasEdge = Edge;

