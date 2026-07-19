import {
  __name,
  init_esm
} from "./chunk-5A2LE32G.mjs";

// trigger/design-agent-fallback.ts
init_esm();
var fallbackBlueprints = [
  {
    keywords: ["e-commerce", "shop", "store", "checkout", "order"],
    nodes: [
      { label: "API Gateway", kind: "service", color: "#4f46e5" },
      { label: "User Service / Auth", kind: "service", color: "#0f766e" },
      { label: "Product Catalog Service", kind: "service", color: "#b45309" },
      { label: "Order Processing", kind: "service", color: "#be185d" }
    ],
    edges: [
      ["API Gateway", "User Service / Auth"],
      ["API Gateway", "Product Catalog Service"],
      ["API Gateway", "Order Processing"]
    ]
  },
  {
    keywords: ["ai", "agent", "assistant", "llm", "chat"],
    nodes: [
      { label: "Orchestrator Agent", kind: "service", color: "#2563eb" },
      { label: "Knowledge Layer", kind: "database", color: "#7c3aed" },
      { label: "Tool Runner", kind: "service", color: "#dc2626" }
    ],
    edges: [
      ["Orchestrator Agent", "Knowledge Layer"],
      ["Orchestrator Agent", "Tool Runner"]
    ]
  },
  {
    keywords: ["data", "pipeline", "analytics", "warehouse", "stream"],
    nodes: [
      { label: "Ingestion Pipeline", kind: "service", color: "#0284c7" },
      { label: "Warehouse", kind: "database", color: "#0891b2" },
      { label: "Analytics Dashboard", kind: "service", color: "#16a34a" }
    ],
    edges: [
      ["Ingestion Pipeline", "Warehouse"],
      ["Analytics Dashboard", "Warehouse"]
    ]
  }
];
function buildFallbackDesignActions(prompt) {
  const normalized = prompt.toLowerCase();
  const blueprint = fallbackBlueprints.find((entry) => entry.keywords.some((keyword) => normalized.includes(keyword))) ?? fallbackBlueprints[0];
  const actions = [];
  const createdNodeIds = /* @__PURE__ */ new Map();
  blueprint.nodes.forEach((node, index) => {
    const nodeId = `node-${index + 1}`;
    createdNodeIds.set(node.label, nodeId);
    actions.push({
      toolName: "addNode",
      input: {
        id: nodeId,
        label: node.label,
        shape: index === 0 ? "hexagon" : "rectangle",
        color: node.color,
        position: {
          x: 120 + index * 220,
          y: 120 + index % 2 * 140
        },
        width: 160,
        height: 80
      }
    });
  });
  blueprint.edges.forEach(([sourceLabel, targetLabel], index) => {
    const sourceId = createdNodeIds.get(sourceLabel);
    const targetId = createdNodeIds.get(targetLabel);
    if (!sourceId || !targetId) return;
    actions.push({
      toolName: "addEdge",
      input: {
        id: `edge-${index + 1}`,
        source: sourceId,
        target: targetId,
        label: index === 0 ? "HTTP" : "data"
      }
    });
  });
  const firstNodeId = createdNodeIds.get(blueprint.nodes[0].label);
  if (firstNodeId) {
    actions.push({
      toolName: "updateNodeData",
      input: {
        id: firstNodeId,
        label: blueprint.nodes[0].label,
        color: blueprint.nodes[0].color
      }
    });
  }
  return actions;
}
__name(buildFallbackDesignActions, "buildFallbackDesignActions");

export {
  buildFallbackDesignActions
};
//# sourceMappingURL=chunk-DVFLQKCG.mjs.map
