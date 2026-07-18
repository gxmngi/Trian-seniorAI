"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  ConnectionMode,
  BackgroundVariant,
  useReactFlow,
} from "@xyflow/react";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import { useMutation, useHistory } from "@liveblocks/react";
import { LiveObject } from "@liveblocks/client";
import { Minus, Plus, Undo2, Redo2 } from "lucide-react";

import { CanvasNodeComponent } from "./canvas-node";
import { CanvasEdgeComponent } from "./canvas-edge";
import { ShapePanel } from "./shape-panel";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useProject } from "../project-context";
import { StarterTemplatesModal } from "../starter-templates-modal";
import { CanvasTemplate } from "../starter-templates";

import "@xyflow/react/dist/style.css";
import "@liveblocks/react-flow/styles.css";

const nodeTypes = {
  canvasNode: CanvasNodeComponent,
};

const edgeTypes = {
  canvasEdge: CanvasEdgeComponent,
};

export function CanvasEditor() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
  } = useLiveblocksFlow({
    suspense: true,
  });

  const { screenToFlowPosition, zoomIn, zoomOut, fitView } = useReactFlow();

  const { isTemplatesModalOpen, setIsTemplatesModalOpen } = useProject();

  const history = useHistory();
  const canUndo = history.canUndo();
  const canRedo = history.canRedo();
  const undo = () => history.undo();
  const redo = () => history.redo();

  // Register Keyboard Shortcuts
  useKeyboardShortcuts({
    zoomIn: () => zoomIn({ duration: 300 }),
    zoomOut: () => zoomOut({ duration: 300 }),
    undo,
    redo,
    canUndo,
    canRedo,
  });

  // Mutation to clear the canvas and import a template
  const importTemplate = useMutation(({ storage }, template: CanvasTemplate) => {
    const flow = storage.get("flow");
    if (flow) {
      const nodesMap = flow.get("nodes");
      const edgesMap = flow.get("edges");

      // LiveMap does not have a .clear() method. We delete keys manually.
      Array.from(nodesMap.keys()).forEach((key) => {
        nodesMap.delete(key);
      });
      Array.from(edgesMap.keys()).forEach((key) => {
        edgesMap.delete(key);
      });

      template.nodes.forEach((node) => {
        nodesMap.set(node.id, new LiveObject(node as any));
      });

      template.edges.forEach((edge) => {
        edgesMap.set(edge.id, new LiveObject(edge as any));
      });
    }
  }, []);

  const handleImportTemplate = (template: CanvasTemplate) => {
    importTemplate(template);
    setIsTemplatesModalOpen(false);
    // Wait for the next render frame so React Flow loads new elements, then fit view
    setTimeout(() => {
      fitView({ duration: 400 });
    }, 50);
  };

  // Local drag preview state (ghost shape)
  const [draggedShape, setDraggedShape] = useState<{
    shape: any;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // Synchronize cancellation / drag end events
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__onDragEnd = () => {
        setDraggedShape(null);
      };
    }
    return () => {
      if (typeof window !== "undefined") {
        (window as any).__onDragEnd = null;
      }
    };
  }, []);

  // Mutation to add a new node to Liveblocks Storage
  const addNode = useMutation(({ storage }, node: any) => {
    const flow = storage.get("flow");
    if (flow) {
      const nodesMap = flow.get("nodes");
      nodesMap.set(node.id, new LiveObject(node));
    }
  }, []);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    if (typeof window !== "undefined" && (window as any).__draggedShape) {
      const payload = (window as any).__draggedShape;
      const position = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      setDraggedShape({
        shape: payload.shape,
        // Center the preview node on the cursor position
        x: position.x - payload.width / 2,
        y: position.y - payload.height / 2,
        width: payload.width,
        height: payload.height,
      });
    }
  };

  const onDragLeave = () => {
    setDraggedShape(null);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedShape(null);
    if (typeof window !== "undefined") {
      (window as any).__draggedShape = null;
    }

    const rawPayload = e.dataTransfer.getData("application/reactflow") || e.dataTransfer.getData("text/plain");
    if (!rawPayload) return;

    try {
      const payload = JSON.parse(rawPayload);
      const position = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      // Generate node ID from shape name, timestamp, and a random counter
      const nodeId = `${payload.shape}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Calculate centered position for dropped node (same offset as preview!)
      const centeredPosition = {
        x: position.x - payload.width / 2,
        y: position.y - payload.height / 2,
      };

      const newNode = {
        id: nodeId,
        type: "canvasNode",
        position: centeredPosition,
        data: {
          label: "",
          shape: payload.shape,
          color: "gray",
        },
        style: {
          width: payload.width,
          height: payload.height,
        },
        width: payload.width,
        height: payload.height,
      };

      addNode(newNode);
    } catch (err) {
      console.error("Error parsing drop payload:", err);
    }
  };

  // Combine shared nodes with the local ghost preview node
  const displayNodes = useMemo(() => {
    if (!draggedShape) return nodes;

    const ghostNode = {
      id: "ghost-preview-node",
      type: "canvasNode",
      position: { x: draggedShape.x, y: draggedShape.y },
      data: {
        label: "",
        shape: draggedShape.shape,
        color: "gray",
        isGhost: true,
      },
      style: {
        width: draggedShape.width,
        height: draggedShape.height,
      },
      width: draggedShape.width,
      height: draggedShape.height,
    };

    return [...nodes, ghostNode];
  }, [nodes, draggedShape]);

  return (
    <div className="flex-1 w-full h-full relative bg-transparent overflow-hidden">
      <ReactFlow
        nodes={displayNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{
          type: "canvasEdge",
        }}
        connectionMode={ConnectionMode.Loose}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        fitView
        className="w-full h-full text-text-primary bg-transparent border-none shadow-none rounded-none outline-none"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="rgba(255, 255, 255, 0.16)"
          className="opacity-100"
        />
      </ReactFlow>

      {/* Floating Canvas Ergonomics Control Bar */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        className="nodrag nopan nowheel absolute bottom-6 left-6 z-20 flex items-center gap-1 bg-[#121214]/90 backdrop-blur-md border border-[#27272a] px-2 py-1.5 rounded-full shadow-2xl pointer-events-auto"
      >
        {/* Zoom Controls */}
        <button
          onClick={() => zoomOut({ duration: 300 })}
          className="p-1.5 rounded-full hover:bg-[#27272a] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          title="Zoom Out (-)"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          onClick={() => fitView({ duration: 300 })}
          className="px-2 py-1 rounded-md hover:bg-[#27272a] text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          title="Fit View"
        >
          Fit
        </button>
        <button
          onClick={() => zoomIn({ duration: 300 })}
          className="p-1.5 rounded-full hover:bg-[#27272a] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          title="Zoom In (+)"
        >
          <Plus className="h-4 w-4" />
        </button>

        {/* Divider */}
        <div className="w-[1px] h-4 bg-[#27272a] mx-1" />

        {/* History Controls */}
        <button
          onClick={undo}
          disabled={!canUndo}
          className="p-1.5 rounded-full hover:bg-[#27272a] text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400 transition-colors cursor-pointer"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="p-1.5 rounded-full hover:bg-[#27272a] text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400 transition-colors cursor-pointer"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="h-4 w-4" />
        </button>
      </div>

      <ShapePanel />

      <StarterTemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        onImport={handleImportTemplate}
      />
    </div>
  );
}
