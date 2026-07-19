"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  ReactFlow,
  Background,
  ConnectionMode,
  BackgroundVariant,
  useReactFlow,
  useViewport,
} from "@xyflow/react";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import { useMutation, useHistory, useMyPresence, useOthers } from "@liveblocks/react";
import { LiveObject } from "@liveblocks/client";
import { Minus, Plus, Undo2, Redo2, MousePointer, Hand } from "lucide-react";
import { createPortal } from "react-dom";
import { useUser } from "@clerk/nextjs";
import { NODE_COLORS } from "@/types/canvas";

import { cn } from "@/lib/utils";
import { CanvasNodeComponent } from "./canvas-node";
import { CanvasEdgeComponent } from "./canvas-edge";
import { ShapePanel } from "./shape-panel";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useProject } from "../project-context";
import { StarterTemplatesModal } from "../starter-templates-modal";
import { CanvasTemplate } from "../starter-templates";
import { useAutosave } from "@/hooks/use-autosave";

import "@xyflow/react/dist/style.css";
import "@liveblocks/react-flow/styles.css";

const nodeTypes = {
  canvasNode: CanvasNodeComponent,
};

const edgeTypes = {
  canvasEdge: CanvasEdgeComponent,
};

function PresenceAvatars() {
  const others = useOthers();
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Filter others to exclude current Clerk user
  const collaborators = others.filter((other) => other.id !== user?.id);

  const portalTarget = typeof document !== "undefined" ? document.getElementById("navbar-presence-portal") : null;
  if (!portalTarget) return null;

  if (collaborators.length === 0) return null;

  return createPortal(
    <div className="flex items-center gap-1.5">
      <div className="flex items-center -space-x-2">
        {collaborators.slice(0, 5).map((col) => {
          const name = col.info?.name || "Collaborator";
          const avatar = col.info?.avatar;
          const color = col.info?.color || "#7c3aed";
          const initials = name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          return (
            <div
              key={col.connectionId}
              className="relative rounded-full h-8.5 w-8.5 ring-2 ring-[#080809] flex items-center justify-center overflow-hidden bg-zinc-800 text-[10px] font-bold text-zinc-100 border-2"
              style={{
                borderColor: color,
              }}
              title={name}
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
          );
        })}
        {collaborators.length > 5 && (
          <div className="h-8.5 w-8.5 rounded-full ring-2 ring-[#080809] bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-[10px] font-bold text-zinc-300 z-10">
            +{collaborators.length - 5}
          </div>
        )}
      </div>
      <div className="w-[1.2px] h-4.5 bg-[#27272a] mx-1.5" />
    </div>,
    portalTarget
  );
}

function LiveCursors() {
  const others = useOthers();
  const { x, y, zoom } = useViewport();

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {others.map(({ connectionId, presence, info }) => {
        if (!presence || !presence.cursor) return null;

        const cursor = presence.cursor;
        const color = info?.color || "#7c3aed";
        const name = info?.name || "Collaborator";

        // Convert flow to screen coordinates relative to the flow pane
        const sx = cursor.x * zoom + x;
        const sy = cursor.y * zoom + y;

        return (
          <div
            key={connectionId}
            className="absolute transition-transform duration-75 ease-out"
            style={{
              left: 0,
              top: 0,
              transform: `translate(${sx}px, ${sy}px)`,
            }}
          >
            {/* Cursor Pointer */}
            <svg
              className="h-5 w-5 drop-shadow-md"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.65376 12.3825L19.5638 4.41727C20.6558 3.79198 21.9616 4.79155 21.6111 6.00287L16.8927 22.3168C16.5161 23.6192 14.7335 23.7719 14.1352 22.5647L10.9701 16.1784L5.19515 13.9238C3.99264 13.4542 3.97444 11.7588 5.65376 12.3825Z"
                fill={color}
                stroke="white"
                strokeWidth={1.5}
              />
            </svg>

            {/* Name Badge */}
            <div
              className="ml-4 mt-1 px-2 py-0.5 rounded text-[10px] font-bold text-zinc-950 whitespace-nowrap shadow-md"
              style={{
                backgroundColor: color,
              }}
            >
              {name}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CanvasEditor() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDelete,
  } = useLiveblocksFlow({
    suspense: true,
  });

  const { screenToFlowPosition, zoomIn, zoomOut, fitView } = useReactFlow();
  const [, updatePresence] = useMyPresence();

  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "Shift" && !e.repeat) {
        setIsSelectionModeActive((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const { isTemplatesModalOpen, setIsTemplatesModalOpen, activeProject, setSaveStatus, registerManualSave } = useProject();

  // Run the autosave hook
  const { status: autosaveStatus, save: saveCanvas } = useAutosave(activeProject?.id || "", nodes, edges);

  useEffect(() => {
    setSaveStatus(autosaveStatus);
  }, [autosaveStatus, setSaveStatus]);

  useEffect(() => {
    registerManualSave(saveCanvas);
  }, [saveCanvas, registerManualSave]);

  // Mutation to load canvas from saved state
  const loadSavedCanvas = useMutation(({ storage }, saved: { nodes: any[]; edges: any[] }) => {
    const flow = storage.get("flow");
    if (flow) {
      const nodesMap = flow.get("nodes");
      const edgesMap = flow.get("edges");

      // Delete existing
      Array.from(nodesMap.keys()).forEach((key) => {
        nodesMap.delete(key);
      });
      Array.from(edgesMap.keys()).forEach((key) => {
        edgesMap.delete(key);
      });

      // Insert loaded
      saved.nodes.forEach((node) => {
        nodesMap.set(node.id, new LiveObject(node as any));
      });
      saved.edges.forEach((edge) => {
        edgesMap.set(edge.id, new LiveObject(edge as any));
      });
    }
  }, []);

  // On mount, load saved canvas if room is empty and project has a saved canvas path
  useEffect(() => {
    if (nodes.length === 0 && edges.length === 0 && activeProject?.canvasJsonPath) {
      const fetchAndLoad = async () => {
        try {
          const response = await fetch(`/api/projects/${activeProject.id}/canvas`);
          if (response.ok) {
            const data = await response.json();
            if (data.nodes && data.nodes.length > 0) {
              loadSavedCanvas(data);
              // Fit view after a brief timeout so elements have rendered
              setTimeout(() => {
                fitView({ duration: 400 });
              }, 100);
            }
          }
        } catch (err) {
          console.error("Error loading saved canvas:", err);
        }
      };
      fetchAndLoad();
    }
  }, [nodes.length, edges.length, activeProject, loadSavedCanvas, fitView]);

  const history = useHistory();
  const canUndo = history.canUndo();
  const canRedo = history.canRedo();
  const undo = () => history.undo();
  const redo = () => history.redo();

  const copiedNodesRef = useRef<any[]>([]);
  const copiedEdgesRef = useRef<any[]>([]);

  const pasteNodesAndEdges = useMutation(({ storage }, { copiedNodes, copiedEdges }: { copiedNodes: any[]; copiedEdges: any[] }) => {
    const flow = storage.get("flow");
    if (flow) {
      const nodesMap = flow.get("nodes");
      const edgesMap = flow.get("edges");

      const offset = 40;
      const idMapping: { [oldId: string]: string } = {};

      // 1. Paste Nodes
      copiedNodes.forEach((node) => {
        const newId = `${node.data?.shape || "node"}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        idMapping[node.id] = newId;

        const newNode = {
          ...node,
          id: newId,
          position: {
            x: node.position.x + offset,
            y: node.position.y + offset,
          },
          selected: true,
        };
        nodesMap.set(newId, new LiveObject(newNode));
      });

      // 2. Paste Edges
      copiedEdges.forEach((edge) => {
        const newSource = idMapping[edge.source];
        const newTarget = idMapping[edge.target];

        if (newSource && newTarget) {
          const newEdgeId = `edge-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const newEdge = {
            ...edge,
            id: newEdgeId,
            source: newSource,
            target: newTarget,
            selected: true,
          };
          edgesMap.set(newEdgeId, new LiveObject(newEdge));
        }
      });

      // 3. Unselect old nodes in storage
      Array.from(nodesMap.keys()).forEach((key) => {
        if (!idMapping[key]) {
          const n = nodesMap.get(key);
          if (n) {
            n.set("selected", false);
          }
        }
      });

      // 4. Unselect old edges in storage
      Array.from(edgesMap.keys()).forEach((key) => {
        if (!key.startsWith(`edge-${Date.now()}`)) {
          const e = edgesMap.get(key);
          if (e) {
            e.set("selected", false);
          }
        }
      });
    }
  }, []);

  const handleCopy = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected && n.id !== "ghost-preview-node");
    if (selectedNodes.length > 0) {
      copiedNodesRef.current = JSON.parse(JSON.stringify(selectedNodes));

      const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));
      const connectedEdges = edges.filter(
        (edge) => selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target)
      );
      copiedEdgesRef.current = JSON.parse(JSON.stringify(connectedEdges));
    }
  }, [nodes, edges]);

  const handlePaste = useCallback(() => {
    if (copiedNodesRef.current.length > 0) {
      pasteNodesAndEdges({
        copiedNodes: copiedNodesRef.current,
        copiedEdges: copiedEdgesRef.current,
      });

      // Adjust positions for subsequent pastes
      copiedNodesRef.current = copiedNodesRef.current.map((node) => ({
        ...node,
        position: {
          x: node.position.x + 40,
          y: node.position.y + 40,
        },
      }));
    }
  }, [pasteNodesAndEdges]);

  // Register Keyboard Shortcuts
  useKeyboardShortcuts({
    zoomIn: () => zoomIn({ duration: 300 }),
    zoomOut: () => zoomOut({ duration: 300 }),
    undo,
    redo,
    canUndo,
    canRedo,
    copy: handleCopy,
    paste: handlePaste,
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

  const onPointerMove = (e: React.PointerEvent) => {
    const position = screenToFlowPosition({
      x: e.clientX,
      y: e.clientY,
    });
    updatePresence({
      cursor: { x: position.x, y: position.y },
    });
  };

  const onPointerLeave = () => {
    updatePresence({
      cursor: null,
    });
  };

  return (
    <div className="flex-1 w-full h-full relative bg-transparent overflow-hidden">
      <ReactFlow
        nodes={displayNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{
          type: "canvasEdge",
        }}
        connectionMode={ConnectionMode.Loose}
        panOnDrag={!isSelectionModeActive}
        selectionOnDrag={isSelectionModeActive}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        fitView
        className={cn(
          "w-full h-full text-text-primary bg-transparent border-none shadow-none rounded-none outline-none",
          isSelectionModeActive ? "cursor-default" : "cursor-grab"
        )}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="rgba(255, 255, 255, 0.16)"
          className="opacity-100"
        />
        <LiveCursors />
      </ReactFlow>

      <PresenceAvatars />

      {/* Floating Canvas Ergonomics Control Bar */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        className="nodrag nopan nowheel absolute bottom-6 left-6 z-20 flex items-center gap-1 bg-[#121214]/90 backdrop-blur-md border border-[#27272a] px-2 py-1.5 rounded-full shadow-2xl pointer-events-auto"
      >
        {/* Interaction Mode Toggles */}
        <button
          onClick={() => setIsSelectionModeActive(false)}
          className={cn(
            "p-1.5 rounded-full transition-colors cursor-pointer",
            !isSelectionModeActive
              ? "bg-[#27272a] text-accent-ai"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-[#27272a]"
          )}
          title="Pan Mode (Press Shift to toggle)"
        >
          <Hand className="h-4 w-4" />
        </button>
        <button
          onClick={() => setIsSelectionModeActive(true)}
          className={cn(
            "p-1.5 rounded-full transition-colors cursor-pointer",
            isSelectionModeActive
              ? "bg-[#27272a] text-accent-ai"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-[#27272a]"
          )}
          title="Selection Mode (Press Shift to toggle)"
        >
          <MousePointer className="h-4 w-4" />
        </button>

        {/* Divider */}
        <div className="w-[1px] h-4 bg-[#27272a] mx-1" />

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
