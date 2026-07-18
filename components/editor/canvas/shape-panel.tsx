"use client";

import React from "react";
import { NodeShape, SHAPE_DEFAULTS } from "@/types/canvas";

const SHAPES: { type: NodeShape; label: string; icon: React.ReactNode }[] = [
  {
    type: "rectangle",
    label: "Rectangle",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="stroke-current pointer-events-none">
        <rect x="3" y="6" width="18" height="12" rx="2" />
      </svg>
    ),
  },
  {
    type: "diamond",
    label: "Diamond",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="stroke-current pointer-events-none">
        <path d="M12 2L2 12l10 10 10-10z" />
      </svg>
    ),
  },
  {
    type: "circle",
    label: "Circle",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="stroke-current pointer-events-none">
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  },
  {
    type: "pill",
    label: "Pill",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="stroke-current pointer-events-none">
        <rect x="2" y="7" width="20" height="10" rx="5" />
      </svg>
    ),
  },
  {
    type: "cylinder",
    label: "Cylinder",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="stroke-current pointer-events-none">
        <ellipse cx="12" cy="5" rx="7" ry="2.5" />
        <path d="M5 5v10c0 1.38 3.13 2.5 7 2.5s7-1.12 7-2.5V5" />
        <ellipse cx="12" cy="15" rx="7" ry="2.5" />
      </svg>
    ),
  },
  {
    type: "hexagon",
    label: "Hexagon",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="stroke-current pointer-events-none">
        <path d="M12 2l8.66 5v10L12 22l-8.66-5V7z" />
      </svg>
    ),
  },
];

export function ShapePanel() {
  const handleDragStart = (e: React.DragEvent, shape: NodeShape) => {
    const payload = {
      shape,
      ...SHAPE_DEFAULTS[shape],
    };
    const serialized = JSON.stringify(payload);
    e.dataTransfer.setData("application/reactflow", serialized);
    e.dataTransfer.setData("text/plain", serialized);
    e.dataTransfer.effectAllowed = "move";

    if (typeof window !== "undefined") {
      (window as any).__draggedShape = payload;
    }
  };

  const handleDragEnd = () => {
    if (typeof window !== "undefined") {
      (window as any).__draggedShape = null;
      if (typeof (window as any).__onDragEnd === "function") {
        (window as any).__onDragEnd();
      }
    }
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-bg-surface/90 backdrop-blur-md border border-border-default px-3 py-2 rounded-full shadow-2xl transition-all duration-300 pointer-events-auto">
      {SHAPES.map((shape) => (
        <div
          key={shape.type}
          draggable
          onDragStart={(e) => handleDragStart(e, shape.type)}
          onDragEnd={handleDragEnd}
          className="group relative flex items-center justify-center h-9 w-9 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-subtle active:scale-90 transition-all duration-150 cursor-grab active:cursor-grabbing"
          title={shape.label}
        >
          {shape.icon}
          {/* Subtle tooltip */}
          <span className="absolute bottom-11 scale-0 group-hover:scale-100 transition-all duration-150 bg-bg-surface border border-border-subtle text-text-primary text-[10px] font-semibold px-2 py-1 rounded-md shadow-md whitespace-nowrap pointer-events-none">
            {shape.label}
          </span>
        </div>
      ))}
    </div>
  );
}
