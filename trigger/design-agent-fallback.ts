export type FallbackAction = {
  toolName: "addNode" | "addEdge" | "updateNodeData";
  input: Record<string, unknown>;
};

type FallbackNode = {
  label: string;
  shape: "rectangle" | "diamond" | "circle" | "pill" | "cylinder" | "hexagon";
  color: "gray" | "blue" | "purple" | "orange" | "red" | "yellow" | "green" | "teal";
  position: { x: number; y: number };
  width?: number;
  height?: number;
};

type FallbackEdge = {
  source: string;
  target: string;
  label: string;
};

const fallbackBlueprints: Array<{
  keywords: string[];
  nodes: FallbackNode[];
  edges: FallbackEdge[];
}> = [
  {
    // Detailed E-Commerce Blueprint
    keywords: ["e-commerce", "shop", "store", "checkout", "order"],
    nodes: [
      { label: "Client App (Web/Mobile)", shape: "circle", color: "orange", position: { x: 80, y: 300 }, width: 130, height: 70 },
      { label: "API Gateway", shape: "diamond", color: "blue", position: { x: 260, y: 300 }, width: 130, height: 80 },
      { label: "Auth Service (Clerk/JWT)", shape: "pill", color: "teal", position: { x: 440, y: 140 }, width: 160, height: 70 },
      { label: "Product Catalog Service", shape: "rectangle", color: "purple", position: { x: 440, y: 290 }, width: 180, height: 75 },
      { label: "Redis Cache (Catalog)", shape: "cylinder", color: "teal", position: { x: 670, y: 190 }, width: 140, height: 75 },
      { label: "MongoDB (Catalog Data)", shape: "cylinder", color: "green", position: { x: 670, y: 310 }, width: 145, height: 75 },
      { label: "Order Processing Service", shape: "rectangle", color: "purple", position: { x: 440, y: 440 }, width: 180, height: 75 },
      { label: "RabbitMQ (Message Queue)", shape: "hexagon", color: "yellow", position: { x: 670, y: 440 }, width: 160, height: 80 },
      { label: "Order Worker (Consumer)", shape: "rectangle", color: "orange", position: { x: 890, y: 440 }, width: 170, height: 75 },
      { label: "PostgreSQL Database (Orders)", shape: "cylinder", color: "green", position: { x: 1110, y: 440 }, width: 155, height: 75 },
    ],
    edges: [
      { source: "Client App (Web/Mobile)", target: "API Gateway", label: "HTTPS Request" },
      { source: "API Gateway", target: "Auth Service (Clerk/JWT)", label: "Verify Token" },
      { source: "API Gateway", target: "Product Catalog Service", label: "HTTP GET" },
      { source: "API Gateway", target: "Order Processing Service", label: "HTTP POST" },
      { source: "Product Catalog Service", target: "Redis Cache (Catalog)", label: "Cache Read/Write" },
      { source: "Product Catalog Service", target: "MongoDB (Catalog Data)", label: "Read Catalog Data" },
      { source: "Order Processing Service", target: "RabbitMQ (Message Queue)", label: "Publish Order Event" },
      { source: "RabbitMQ (Message Queue)", target: "Order Worker (Consumer)", label: "Consume Order Event" },
      { source: "Order Worker (Consumer)", target: "PostgreSQL Database (Orders)", label: "Save Order to SQL" },
    ],
  },
  {
    // Detailed AI Chatbot Blueprint
    keywords: ["ai", "agent", "assistant", "llm", "chat"],
    nodes: [
      { label: "Chat UI Client", shape: "circle", color: "orange", position: { x: 80, y: 250 }, width: 130, height: 70 },
      { label: "BFF / Web Server", shape: "rectangle", color: "blue", position: { x: 260, y: 250 }, width: 150, height: 75 },
      { label: "Orchestrator Agent", shape: "hexagon", color: "purple", position: { x: 460, y: 250 }, width: 170, height: 80 },
      { label: "Vector Database (Qdrant)", shape: "cylinder", color: "green", position: { x: 680, y: 140 }, width: 160, height: 75 },
      { label: "Gemini API (LLM)", shape: "diamond", color: "red", position: { x: 680, y: 340 }, width: 150, height: 85 },
      { label: "External Tool Service", shape: "rectangle", color: "yellow", position: { x: 890, y: 250 }, width: 160, height: 75 },
    ],
    edges: [
      { source: "Chat UI Client", target: "BFF / Web Server", label: "WebSocket / HTTP" },
      { source: "BFF / Web Server", target: "Orchestrator Agent", label: "gRPC Call" },
      { source: "Orchestrator Agent", target: "Vector Database (Qdrant)", label: "Query Context Embeddings" },
      { source: "Orchestrator Agent", target: "Gemini API (LLM)", label: "Generate Prompt Response" },
      { source: "Orchestrator Agent", target: "External Tool Service", label: "Execute Registered Tool" },
    ],
  },
  {
    // Detailed Data Pipeline Blueprint
    keywords: ["data", "pipeline", "analytics", "warehouse", "stream"],
    nodes: [
      { label: "Data Sources", shape: "circle", color: "orange", position: { x: 80, y: 250 }, width: 130, height: 70 },
      { label: "Ingestion (Kafka Stream)", shape: "hexagon", color: "yellow", position: { x: 260, y: 250 }, width: 160, height: 80 },
      { label: "Spark Processing Engine", shape: "rectangle", color: "purple", position: { x: 470, y: 250 }, width: 180, height: 75 },
      { label: "ClickHouse (Analytics DB)", shape: "cylinder", color: "green", position: { x: 700, y: 140 }, width: 170, height: 75 },
      { label: "S3 Cold Storage (Data Lake)", shape: "cylinder", color: "blue", position: { x: 700, y: 340 }, width: 170, height: 75 },
      { label: "Superset Dashboard UI", shape: "rectangle", color: "teal", position: { x: 920, y: 140 }, width: 180, height: 75 },
    ],
    edges: [
      { source: "Data Sources", target: "Ingestion (Kafka Stream)", label: "Stream Data Event" },
      { source: "Ingestion (Kafka Stream)", target: "Spark Processing Engine", label: "Consume Batch Data" },
      { source: "Spark Processing Engine", target: "ClickHouse (Analytics DB)", label: "Insert Structured Aggregates" },
      { source: "Spark Processing Engine", target: "S3 Cold Storage (Data Lake)", label: "Archive Raw JSON Blobs" },
      { source: "Superset Dashboard UI", target: "ClickHouse (Analytics DB)", label: "Execute SQL Queries" },
    ],
  },
];

export function buildFallbackDesignActions(prompt: string): FallbackAction[] {
  const normalized = prompt.toLowerCase();
  const blueprint = fallbackBlueprints.find((entry) => entry.keywords.some((keyword) => normalized.includes(keyword))) ?? fallbackBlueprints[0];

  const actions: FallbackAction[] = [];
  const createdNodeIds = new Map<string, string>();

  blueprint.nodes.forEach((node, index) => {
    const nodeId = `node-${index + 1}`;
    createdNodeIds.set(node.label, nodeId);
    actions.push({
      toolName: "addNode",
      input: {
        id: nodeId,
        label: node.label,
        shape: node.shape,
        color: node.color,
        position: node.position,
        width: node.width || 160,
        height: node.height || 80,
      },
    });
  });

  blueprint.edges.forEach((edge, index) => {
    const sourceId = createdNodeIds.get(edge.source);
    const targetId = createdNodeIds.get(edge.target);
    if (!sourceId || !targetId) return;

    actions.push({
      toolName: "addEdge",
      input: {
        id: `edge-${index + 1}`,
        source: sourceId,
        target: targetId,
        label: edge.label,
      },
    });
  });

  return actions;
}
