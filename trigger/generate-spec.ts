import { task } from "@trigger.dev/sdk/v3";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { z } from "zod";
import { put } from "@vercel/blob";
import { prisma } from "../lib/prisma";

// Zod schemas for validation
const chatMessageSchema = z.object({
  id: z.string(),
  createdAt: z.number().optional(),
  sender: z.string(),
  role: z.enum(["user", "ai"]),
  content: z.string(),
  timestamp: z.number(),
});

const nodeSchema = z.object({
  id: z.string(),
  type: z.string().optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.object({
    label: z.string(),
    shape: z.string().optional(),
    color: z.string().optional(),
  }),
  width: z.number().optional(),
  height: z.number().optional(),
});

const edgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
});

export interface GenerateSpecPayload {
  projectId: string;
  roomId: string;
  chatHistory: Array<z.infer<typeof chatMessageSchema>>;
  nodes: Array<z.infer<typeof nodeSchema>>;
  edges: Array<z.infer<typeof edgeSchema>>;
}

export const generateSpec = task({
  id: "generate-spec",
  run: async (payload: GenerateSpecPayload) => {
    // 1. Zod input validation
    const parsedPayload = z.object({
      projectId: z.string(),
      roomId: z.string(),
      chatHistory: z.array(chatMessageSchema),
      nodes: z.array(nodeSchema),
      edges: z.array(edgeSchema),
    }).parse(payload);

    const { projectId, roomId, chatHistory, nodes, edges } = parsedPayload;

    console.log(`Starting generate-spec for room: ${parsedPayload.roomId}`);

    // 2. Initialize Gemini API Key
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY or GOOGLE_AI_API_KEY environment variable");
    }
    const google = createGoogleGenerativeAI({ apiKey });

    // 3. Prepare system prompt and query for LLM
    const systemPrompt = `You are a principal systems architect and tech lead.
Your task is to generate a comprehensive, professional Markdown technical specification document based on a collaborative system architecture canvas (nodes and edges) and the architectural chat history between the user and the AI.

Be structured, precise, and thorough. Write in clear, technical, professional English.

Format the specification using clean Markdown with the following structure:
- **Title**: A professional title for the architecture.
- **1. Executive Summary**: A high-level overview of the system and business value.
- **2. System Architecture**: Details about the components, services, and their interactions.
- **3. Data flow & Protocols**: Explanation of connection pathways, protocols (HTTP, gRPC, event-driven), and sequences.
- **4. Component Breakdown**: A table/list detail for each node (shape, responsibility, technology choice, and grouping).
- **5. Scalability & Availability Considerations**: Performance, bottlenecks, cache strategies, queues, and database scaling.

Here is the current canvas state:
- Nodes:
${JSON.stringify(nodes, null, 2)}
- Edges (Connections):
${JSON.stringify(edges, null, 2)}

Here is the conversation history:
${JSON.stringify(chatHistory, null, 2)}`;

    // Try multiple model endpoints to find an available one (similar to design-agent)
    // Try multiple model endpoints to find an available one (similar to design-agent)
    const modelsToTry = [
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
    ];

    let response;
    const errorsList: string[] = [];

    for (const modelName of modelsToTry) {
      try {
        console.log(`Attempting spec generation with ${modelName}...`);
        response = await generateText({
          model: google(modelName),
          prompt: systemPrompt,
        });
        console.log(`Successfully generated spec using ${modelName}`);
        break;
      } catch (err: any) {
        const reason = err?.message || String(err);
        console.warn(`[${modelName}] failed: ${reason}`);
        errorsList.push(`${modelName}: ${reason}`);
        if (reason.includes("API_KEY_INVALID") || reason.includes("PERMISSION_DENIED")) {
          console.error("API key error — stopping retries.");
          break;
        }
      }
    }

    let markdownContent = "";
    if (response?.text) {
      markdownContent = response.text;
    } else {
      console.warn("All Gemini model generation attempts failed. Falling back to local blueprint spec generator.");
      markdownContent = generateLocalFallbackSpec(nodes, edges, chatHistory);
    }

    // 4. Save generated spec to Vercel Blob and Prisma
    let blobUrl = "";
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      // Production Vercel Blob upload
      const blob = await put(`spec-${projectId}-${Date.now()}.md`, markdownContent, {
        access: "private",
        contentType: "text/markdown",
        addRandomSuffix: true,
      });
      blobUrl = blob.url;
    } else {
      console.warn("BLOB_READ_WRITE_TOKEN is missing. Using local dev mock backup.");
      const specFileName = `spec-${projectId}-${Date.now()}.md`;
      blobUrl = `https://mock-blob-url.local/${specFileName}`;

      // Persist locally for dev testing
      const fs = require("fs");
      const path = require("path");
      const dir = path.join(process.cwd(), "scratch");
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(
        path.join(dir, specFileName),
        markdownContent
      );
    }

    // Save ProjectSpec metadata in Prisma
    await prisma.projectSpec.create({
      data: {
        projectId,
        filePath: blobUrl,
      },
    });

    return markdownContent;
  },
});

function generateLocalFallbackSpec(
  nodes: any[],
  edges: any[],
  chatHistory: any[]
): string {
  const serviceNodes = nodes.filter(n => n.data?.type === "service" || n.data?.label?.toLowerCase().includes("service"));
  const dbNodes = nodes.filter(n => ["database", "nosql", "mongodb", "postgres", "sql", "redis", "cache"].some(k => n.data?.label?.toLowerCase().includes(k)));
  const gatewayNodes = nodes.filter(n => ["gateway", "router", "load balancer", "ingress"].some(k => n.data?.label?.toLowerCase().includes(k)));
  const queueNodes = nodes.filter(n => ["queue", "rabbitmq", "kafka", "pubsub", "message"].some(k => n.data?.label?.toLowerCase().includes(k)));

  const title = nodes.length > 0 
    ? `${nodes.map(n => n.data?.label).slice(0, 3).join(" & ")} System Architecture` 
    : "System Architecture Specification";

  let markdown = `# Technical Specification: ${title}

## 1. Executive Summary
This technical specification outlines the system architecture for the proposed software backend design. The system is designed to achieve high availability, fault tolerance, and horizontal scalability by employing decoupled microservices and asynchronous communication patterns.

The architecture comprises ${nodes.length} structural components (Nodes) and ${edges.length} integration channels (Edges) designed to facilitate secure and reliable data processing.

## 2. Component Directory
Below is the inventory of active components identified in the current canvas design:

`;

  if (nodes.length === 0) {
    markdown += `*No components have been placed on the canvas yet.*\n\n`;
  } else {
    markdown += `| Component Name | Type | Description |\n|---|---|---|\n`;
    for (const node of nodes) {
      const label = node.data?.label || "Unnamed Component";
      const type = node.data?.type || "Generic Component";
      let desc = `Coordinates: (x: ${Math.round(node.position?.x || 0)}, y: ${Math.round(node.position?.y || 0)}).`;
      if (label.toLowerCase().includes("gateway")) desc += " Acts as the single entry point for routing external requests.";
      else if (label.toLowerCase().includes("auth")) desc += " Manages token validation, user authentication, and authorization.";
      else if (label.toLowerCase().includes("cache") || label.toLowerCase().includes("redis")) desc += " Memory-backed cache layer to handle high traffic and reduce database load.";
      else if (label.toLowerCase().includes("queue") || label.toLowerCase().includes("rabbitmq")) desc += " Asynchronous message queue for event-driven message distribution.";
      else if (label.toLowerCase().includes("service")) desc += " Core domain business logic worker.";
      else if (dbNodes.includes(node)) desc += " Primary relational or non-relational database store.";
      markdown += `| **${label}** | \`${type}\` | ${desc} |\n`;
    }
    markdown += `\n`;
  }

  markdown += `## 3. Communication and Integration Flows
The components interact via the following communication flows and protocols:

`;

  if (edges.length === 0) {
    markdown += `*No integration flows have been defined on the canvas yet.*\n\n`;
  } else {
    markdown += `| Source Component | Target Component | Protocol / Action |\n|---|---|---|\n`;
    for (const edge of edges) {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      const sourceName = sourceNode?.data?.label || edge.source;
      const targetName = targetNode?.data?.label || edge.target;
      const label = edge.data?.label || edge.label || "Direct Connection";
      markdown += `| **${sourceName}** | **${targetName}** | \`${label}\` |\n`;
    }
    markdown += `\n`;
  }

  markdown += `## 4. Key Architectural Patterns

### 4.1. Request Routing and Ingress
`;
  if (gatewayNodes.length > 0) {
    markdown += `External clients connect through the API Gateway (**${gatewayNodes.map(n => n.data?.label).join(", ")}**). The gateway acts as a reverse proxy, dispatching requests to down-stream microservices, enforcing security policies, and managing rate limiting.\n`;
  } else {
    markdown += `External clients connect directly to services. Implementing an API Gateway pattern is recommended for production environments to handle authentication and path routing.\n`;
  }

  markdown += `
### 4.2. Database & Data Storage
`;
  if (dbNodes.length > 0) {
    markdown += `Data storage is handled by specialized database nodes (**${dbNodes.map(n => n.data?.label).join(", ")}**). This setup follows the "Database-per-Service" microservice pattern, ensuring domain isolation and allowing independent scaling.\n`;
  } else {
    markdown += `No dedicated databases were detected in the canvas. It is recommended to attach database components to the business services to persist state.\n`;
  }

  markdown += `
### 4.3. Event-Driven Messaging
`;
  if (queueNodes.length > 0) {
    markdown += `Asynchronous communication between services is managed via the message brokers (**${queueNodes.map(n => n.data?.label).join(", ")}**). This decouples write-heavy transactions, enabling background tasks to execute without blocking the user-facing web server.\n`;
  } else {
    markdown += `Services communicate synchronously. For heavy workloads (e.g. order processing), introducing a Message Queue is highly recommended to improve system resilience.\n`;
  }

  if (chatHistory && chatHistory.length > 0) {
    markdown += `\n## 5. Summary of Discussed Requirements\nBased on your discussion history, the following items were analyzed:\n\n`;
    for (const msg of chatHistory.slice(-5)) {
      if (msg.role === "user") {
        markdown += `- **User Request**: "${msg.content}"\n`;
      }
    }
    markdown += `\n`;
  }

  markdown += `\n---
*Note: This technical specification was generated locally using the canvas state blueprint due to LLM provider quota limits.*
`;
  return markdown;
}
