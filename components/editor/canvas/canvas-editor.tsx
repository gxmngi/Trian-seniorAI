"use client";

import React from "react";
import {
  ReactFlow,
  Background,
  MiniMap,
  ConnectionMode,
  BackgroundVariant,
  useReactFlow,
} from "@xyflow/react";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import { useMutation } from "@liveblocks/react";
import { LiveObject } from "@liveblocks/client";

import { CanvasNodeComponent } from "./canvas-node";
import { ShapePanel } from "./shape-panel";

import "@xyflow/react/dist/style.css";
import "@liveblocks/react-flow/styles.css";

const nodeTypes = {
  canvasNode: CanvasNodeComponent,
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

  const { screenToFlowPosition } = useReactFlow();

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
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();

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

      const newNode = {
        id: nodeId,
        type: "canvasNode",
        position,
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

  return (
    <div className="flex-1 w-full h-full relative bg-transparent overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        onDragOver={onDragOver}
        onDrop={onDrop}
        fitView
        className="w-full h-full text-text-primary bg-transparent border-none shadow-none rounded-none outline-none"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="var(--border-default)"
          className="opacity-55"
        />
        <MiniMap
          nodeColor={() => "var(--bg-surface)"}
          maskColor="rgba(0, 0, 0, 0.3)"
          className="!bg-bg-surface !border-border-default !rounded-xl !shadow-lg border overflow-hidden hidden sm:block"
        />
      </ReactFlow>
      <ShapePanel />
    </div>
  );
}

