import { CanvasNode, CanvasEdge, NodeShape } from "@/types/canvas";

export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

// Helper to construct a node easily
const createNode = (
  id: string,
  label: string,
  shape: NodeShape,
  color: string,
  x: number,
  y: number,
  width: number,
  height: number
): CanvasNode => ({
  id,
  type: "canvasNode",
  position: { x, y },
  data: { label, shape, color },
  style: { width, height },
  width,
  height,
});

// Helper to construct an edge easily
const createEdge = (
  id: string,
  source: string,
  target: string,
  label?: string
): CanvasEdge => ({
  id,
  source,
  target,
  type: "canvasEdge",
  label,
});

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: "microservices",
    name: "Microservices Architecture",
    description: "A secure, resilient multi-service setup featuring an API Gateway, internal microservices, dedicated databases, and a payment processor.",
    nodes: [
      createNode("gw", "API Gateway", "rectangle", "blue", 100, 150, 120, 60),
      createNode("auth", "Auth Service", "pill", "purple", 300, 45, 100, 45),
      createNode("order", "Order Service", "rectangle", "green", 300, 150, 120, 60),
      createNode("pay", "Payment Service", "rectangle", "green", 300, 255, 120, 60),
      createNode("db", "Order Database", "cylinder", "teal", 520, 135, 80, 90),
      createNode("stripe", "Stripe API", "diamond", "orange", 520, 245, 80, 80),
    ],
    edges: [
      createEdge("gw-auth", "gw", "auth", "Verify Token"),
      createEdge("gw-order", "gw", "order", "Route Order"),
      createEdge("gw-pay", "gw", "pay", "Route Payment"),
      createEdge("order-db", "order", "db", "Read/Write DB"),
      createEdge("pay-stripe", "pay", "stripe", "Process Charge"),
    ],
  },
  {
    id: "cicd",
    name: "CI/CD Deployment Pipeline",
    description: "Automated code delivery pipeline routing code commits through build, unit tests, staging, integration tests, and production release stages.",
    nodes: [
      createNode("commit", "GitHub Commit", "pill", "blue", 50, 150, 100, 45),
      createNode("build", "Docker Build", "rectangle", "purple", 200, 142, 120, 60),
      createNode("test", "Unit Tests", "hexagon", "yellow", 370, 132, 100, 80),
      createNode("staging", "Deploy Staging", "rectangle", "orange", 520, 142, 120, 60),
      createNode("int", "Integration Tests", "hexagon", "teal", 690, 132, 100, 80),
      createNode("prod", "Deploy Prod", "rectangle", "green", 840, 142, 120, 60),
    ],
    edges: [
      createEdge("commit-build", "commit", "build"),
      createEdge("build-test", "build", "test", "Build Success"),
      createEdge("test-staging", "test", "staging", "Tests Pass"),
      createEdge("staging-int", "staging", "int"),
      createEdge("int-prod", "int", "prod", "QA Approved"),
    ],
  },
  {
    id: "event-driven",
    name: "Event-Driven Processing",
    description: "Asynchronous processing flow where messages are routed through an Event Broker to downstream subscriber tasks.",
    nodes: [
      createNode("client", "Web Client", "pill", "blue", 50, 150, 100, 45),
      createNode("ingest", "API Ingestion", "rectangle", "gray", 200, 142, 120, 60),
      createNode("broker", "Event Broker", "cylinder", "orange", 370, 127, 80, 90),
      createNode("notify", "Notification Svc", "rectangle", "purple", 520, 40, 120, 60),
      createNode("analytics", "Analytics Engine", "hexagon", "teal", 520, 132, 100, 80),
      createNode("inventory", "Inventory Svc", "rectangle", "green", 520, 240, 120, 60),
    ],
    edges: [
      createEdge("client-ingest", "client", "ingest", "HTTP POST"),
      createEdge("ingest-broker", "ingest", "broker", "Publish"),
      createEdge("broker-notify", "broker", "notify", "Notify Event"),
      createEdge("broker-analytics", "broker", "analytics", "Log Event"),
      createEdge("broker-inventory", "broker", "inventory", "Order Event"),
    ],
  },
];
