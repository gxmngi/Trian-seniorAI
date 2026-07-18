import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { CanvasTemplate, CANVAS_TEMPLATES } from "./starter-templates";
import { NODE_COLORS } from "@/types/canvas";

interface StarterTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (template: CanvasTemplate) => void;
}

// Lightweight static SVG preview component (no React Flow instance needed)
function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const { nodes, edges } = template;

  if (nodes.length === 0) return null;

  // Calculate bounding box bounds to dynamically scale the preview
  const xCoords = nodes.map((n) => n.position.x);
  const yCoords = nodes.map((n) => n.position.y);
  const xMaxCoords = nodes.map((n) => n.position.x + (n.width || 100));
  const yMaxCoords = nodes.map((n) => n.position.y + (n.height || 60));

  const minX = Math.min(...xCoords);
  const maxX = Math.max(...xMaxCoords);
  const minY = Math.min(...yCoords);
  const maxY = Math.max(...yMaxCoords);

  const width = maxX - minX;
  const height = maxY - minY;

  // Pad the bounds slightly
  const padding = 24;
  const viewBox = `${minX - padding} ${minY - padding} ${width + padding * 2} ${height + padding * 2}`;

  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio="xMidYMidMeet"
      className="w-full h-full select-none"
    >
      {/* Draw Edges */}
      {edges.map((edge) => {
        const src = nodes.find((n) => n.id === edge.source);
        const tgt = nodes.find((n) => n.id === edge.target);
        if (!src || !tgt) return null;

        const srcCX = src.position.x + (src.width || 100) / 2;
        const srcCY = src.position.y + (src.height || 60) / 2;
        const tgtCX = tgt.position.x + (tgt.width || 100) / 2;
        const tgtCY = tgt.position.y + (tgt.height || 60) / 2;

        return (
          <line
            key={edge.id}
            x1={srcCX}
            y1={srcCY}
            x2={tgtCX}
            y2={tgtCY}
            stroke="#27272a"
            strokeWidth={2}
          />
        );
      })}

      {/* Draw Nodes */}
      {nodes.map((node) => {
        const colorName = node.data.color || "gray";
        const colorConfig =
          NODE_COLORS.find((c) => c.name === colorName) || NODE_COLORS[0];

        const l = node.position.x;
        const t = node.position.y;
        const w = node.width || 100;
        const h = node.height || 60;

        const cx = l + w / 2;
        const cy = t + h / 2;
        const r = l + w;
        const b = t + h;

        const renderNodeShape = () => {
          switch (node.data.shape) {
            case "diamond":
              return (
                <polygon
                  points={`${cx},${t + 2} ${r - 2},${cy} ${cx},${b - 2} ${l + 2},${cy}`}
                  className={`${colorConfig.fill} ${colorConfig.stroke}`}
                  strokeWidth={1.5}
                />
              );
            case "hexagon":
              return (
                <polygon
                  points={`${l + w * 0.22},${t + 2} ${l + w * 0.78},${t + 2} ${r - 2},${cy} ${l + w * 0.78},${b - 2} ${l + w * 0.22},${b - 2} ${l + 2},${cy}`}
                  className={`${colorConfig.fill} ${colorConfig.stroke}`}
                  strokeWidth={1.5}
                />
              );
            case "cylinder":
              return (
                <g className={`${colorConfig.fill} ${colorConfig.stroke}`} strokeWidth={1.5}>
                  <path d={`M ${l + 2} ${t + h * 0.15} V ${b - h * 0.15} C ${l + 2} ${b} ${r - 2} ${b} ${r - 2} ${b - h * 0.15} V ${t + h * 0.15} Z`} />
                  <ellipse cx={cx} cy={t + h * 0.15} rx={w / 2 - 2} ry={h * 0.1} />
                </g>
              );
            case "pill":
            case "circle":
              return (
                <rect
                  x={l}
                  y={t}
                  width={w}
                  height={h}
                  rx={9999}
                  className={`${colorConfig.fill} ${colorConfig.stroke}`}
                  strokeWidth={1.5}
                />
              );
            case "rectangle":
            default:
              return (
                <rect
                  x={l}
                  y={t}
                  width={w}
                  height={h}
                  rx={6}
                  className={`${colorConfig.fill} ${colorConfig.stroke}`}
                  strokeWidth={1.5}
                />
              );
          }
        };

        return (
          <g key={node.id}>
            {renderNodeShape()}
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="middle"
              className={`${colorConfig.text} text-[6.5px] font-medium`}
              style={{ pointerEvents: "none" }}
            >
              {node.data.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function StarterTemplatesModal({
  isOpen,
  onClose,
  onImport,
}: StarterTemplatesModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[850px] bg-bg-surface border-border-default text-text-primary rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-lg font-bold text-zinc-100">Import Template</DialogTitle>
          <p className="text-[11px] text-zinc-400 mt-1">
            Choose a starter template to pre-populate your canvas. Any existing nodes will be replaced — use{" "}
            <kbd className="bg-zinc-800 border border-zinc-700/60 text-zinc-300 px-1 py-0.5 rounded text-[10px] font-mono mx-0.5">
              ⌘Z
            </kbd>{" "}
            to undo.
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pb-6">
            {CANVAS_TEMPLATES.map((template) => (
              <div
                key={template.id}
                className="flex flex-col bg-[#0b0b0d] border border-[#1f1f23] hover:border-zinc-700 rounded-xl p-4 transition-all duration-200"
              >
                {/* SVG Visual Preview Viewport */}
                <div className="w-full h-40 bg-[#040405] border border-[#17171a] rounded-lg overflow-hidden flex items-center justify-center p-3 mb-4 relative">
                  <TemplatePreview template={template} />
                </div>

                <div className="flex-1 flex flex-col">
                  <h3 className="text-xs font-bold text-zinc-200 mb-1">{template.name}</h3>
                  <p className="text-[10px] text-zinc-400 leading-relaxed mb-4 flex-1">
                    {template.description}
                  </p>

                  <Button
                    onClick={() => onImport(template)}
                    className="w-full bg-transparent hover:bg-zinc-800 border border-zinc-700/60 text-zinc-200 text-xs font-semibold rounded-lg h-9 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Import
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
