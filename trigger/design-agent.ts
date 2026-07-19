import { task } from "@trigger.dev/sdk/v3";
import { getLiveblocks } from "../lib/liveblocks";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { z } from "zod";
import { LiveObject } from "@liveblocks/client";
import { SHAPE_DEFAULTS, NodeShape } from "../types/canvas";
import { buildDesignSummary } from "./design-agent-summary";
import { buildFallbackDesignActions } from "./design-agent-fallback";

export interface DesignAgentPayload {
  prompt: string;
  roomId: string;
}

const AI_USER_INFO = {
  name: "Ghost AI",
  avatar: "",
  color: "#6457f9",
};

export const designAgent = task({
  id: "design-agent",
  run: async (payload: DesignAgentPayload) => {
    const { prompt, roomId } = payload;
    const liveblocks = getLiveblocks();

    console.log(`Starting design-agent for room: ${roomId} with prompt: "${prompt}"`);

    // 1. Initialize AI presence (thinking & status message)
    await liveblocks.setPresence(roomId, {
      userId: "ai-agent",
      userInfo: AI_USER_INFO,
      data: {
        cursor: null,
        isThinking: true,
        thinking: true,
        statusMessage: "Ghost AI: Analyzing requirements...",
      },
    });

    try {
      // 2. Fetch current canvas state to give to the LLM
      const storage = (await liveblocks.getStorageDocument(roomId, "json")) as any;
      const currentNodes = storage?.flow?.nodes || {};
      const currentEdges = storage?.flow?.edges || {};

      // 3. Initialize Gemini
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
      if (!apiKey) {
        throw new Error("Missing GEMINI_API_KEY or GOOGLE_AI_API_KEY environment variable");
      }
      const google = createGoogleGenerativeAI({ apiKey });

      await liveblocks.setPresence(roomId, {
        userId: "ai-agent",
        userInfo: AI_USER_INFO,
        data: {
          cursor: null,
          isThinking: true,
          thinking: true,
          statusMessage: "Ghost AI: Generating layout plan...",
        },
      });

      const toolsConfig = {
        addNode: {
          description: "Add a new node to the collaborative canvas.",
          inputSchema: z.object({
            id: z.string().describe("A unique ID for the new node. Typically shape-timestamp-random."),
            label: z.string().describe("The label/title of the node."),
            shape: z.enum(["rectangle", "diamond", "circle", "pill", "cylinder", "hexagon"]),
            color: z.enum(["gray", "blue", "purple", "orange", "red", "yellow", "green", "teal"]),
            position: z.object({
              x: z.number(),
              y: z.number(),
            }),
            width: z.number().optional(),
            height: z.number().optional(),
          }),
        },
        moveNode: {
          description: "Move an existing node to a new position on the canvas.",
          inputSchema: z.object({
            id: z.string().describe("The ID of the node to move."),
            position: z.object({
              x: z.number(),
              y: z.number(),
            }),
          }),
        },
        resizeNode: {
          description: "Resize an existing node.",
          inputSchema: z.object({
            id: z.string().describe("The ID of the node to resize."),
            width: z.number(),
            height: z.number(),
          }),
        },
        updateNodeData: {
          description: "Update the label, color, or shape of an existing node.",
          inputSchema: z.object({
            id: z.string().describe("The ID of the node to update."),
            label: z.string().optional(),
            color: z.enum(["gray", "blue", "purple", "orange", "red", "yellow", "green", "teal"]).optional(),
            shape: z.enum(["rectangle", "diamond", "circle", "pill", "cylinder", "hexagon"]).optional(),
          }),
        },
        deleteNode: {
          description: "Delete an existing node and clean up its connected edges.",
          inputSchema: z.object({
            id: z.string().describe("The ID of the node to delete."),
          }),
        },
        addEdge: {
          description: "Add a connection (edge) between two nodes.",
          inputSchema: z.object({
            id: z.string().describe("A unique ID for the new edge. Typically edge-timestamp-random."),
            source: z.string().describe("The source node ID."),
            target: z.string().describe("The target node ID."),
            label: z.string().optional().describe("Optional label for the edge."),
          }),
        },
        deleteEdge: {
          description: "Delete an existing edge.",
          inputSchema: z.object({
            id: z.string().describe("The ID of the edge to delete."),
          }),
        },
      };

      const systemPrompt = `You are an expert system architect and UI designer.
A user wants to design: "${prompt}" on a collaborative canvas.
Here are the existing nodes and edges on the canvas:
${JSON.stringify({ nodes: currentNodes, edges: currentEdges }, null, 2)}

Please use the provided tools (addNode, moveNode, resizeNode, updateNodeData, deleteNode, addEdge, deleteEdge) to fulfill the user's request.
Call as many tools as needed to implement the requested design.

Rules for High-Detail Architecture:
- COMPREHENSIVE DETAIL: Do not draw simple placeholder diagrams. Deconstruct the architecture into highly detailed components: include client entry points (e.g., Browser/Mobile App, IoT), load balancers/gateways, individual microservices, caches (e.g. Redis), primary & read-replica databases, message queues (e.g. RabbitMQ/Kafka), consumer workers, and external third-party service nodes (e.g., Auth, Payments).
- Shapes: Use "cylinder" for databases/data storage, "diamond" for decision gates/load balancers/routers/gateways, "circle" or "pill" for entry/start/end points/clients, "rectangle" or "hexagon" for general services or background workers.
- Colors: Use colors to group or distinguish parts of the system (e.g., "green" for database/storage, "blue" for API gateways or main services, "orange" for clients/users/frontend, "red" for external or third-party APIs/Auth, "purple" for workers/queues, "teal" for CDN/cache).
- Layout: Align nodes on a grid or sequence (left-to-right or top-to-bottom). Do not overlap nodes! Space them out generously (e.g., 200px to 350px apart) so they are easy to read.
- Existing items: Keep, modify, or extend existing nodes and edges if they are present. Do not delete them unless requested or required.
- IMPORTANT — Edges: ALWAYS call addEdge after you have added the relevant nodes. The "source" and "target" fields in addEdge MUST exactly match the "id" values you used in addNode calls. Always add a short descriptive label to every edge specifying the protocol or action (e.g., "HTTPS Request", "Verify Token", "Cache Read", "Publish Order Event", "Consume Job", "SQL Write"). Do NOT leave edge labels empty.`;

      let response;
      // Versioned model IDs supported by Gemini API (used by @ai-sdk/google)
      const modelsToTry = [
        "gemini-2.0-flash",        // Standard Gemini 2.0 Flash
        "gemini-1.5-flash",        // Standard Gemini 1.5 Flash
        "gemini-1.5-pro",          // Fallback Gemini 1.5 Pro
      ];

      let lastError: any = null;
      for (const modelName of modelsToTry) {
        try {
          console.log(`Attempting design generation with ${modelName}...`);
          response = await generateText({
            model: google(modelName),
            tools: toolsConfig,
            toolChoice: "required",
            prompt: systemPrompt,
          });
          console.log(`Successfully generated design using ${modelName}`);
          break;
        } catch (err: any) {
          const reason = err?.message || String(err);
          console.warn(`[${modelName}] failed: ${reason}`);
          lastError = err;
          // Don't retry on non-availability errors (auth, quota exhausted)
          if (reason.includes("API_KEY_INVALID") || reason.includes("PERMISSION_DENIED")) {
            console.error("API key error — stopping retries.");
            break;
          }
        }
      }

      const fallbackToolCalls = buildFallbackDesignActions(prompt).map((action, index) => ({
        type: "tool-call" as const,
        toolCallId: `fallback-${index}`,
        toolName: action.toolName,
        input: action.input,
      }));

      let toolCalls: any[] | undefined = response?.toolCalls as any;
      if (!toolCalls || toolCalls.length === 0) {
        console.warn("Gemini did not return any tool calls; using fallback layout planner.");
        await liveblocks.setPresence(roomId, {
          userId: "ai-agent",
          userInfo: AI_USER_INFO,
          data: {
            cursor: null,
            isThinking: true,
            thinking: true,
            statusMessage: "Ghost AI: Using fallback layout plan...",
          },
        });
        toolCalls = fallbackToolCalls;
      }

      if (!toolCalls || toolCalls.length === 0) {
        const lastMsg = lastError?.message || "All Gemini models failed.";
        throw new Error(`Design generation failed: ${lastMsg}`);
      }

      console.log(`Gemini generated ${toolCalls.length} tool calls.`);

      // 5. Apply the actions one-by-one to show a progressive drawing effect
      for (let i = 0; i < toolCalls.length; i++) {
        const toolCall = toolCalls[i];
        const action = toolCall.toolName;
        const actionPayload = (toolCall as any).input;

        if (!action || !actionPayload) continue;

        let statusMsg = "Ghost AI: Applying layout...";
        let cursorX = 0;
        let cursorY = 0;

        if (action === "addNode") {
          statusMsg = `Ghost AI: Adding node "${actionPayload.label}"...`;
          cursorX = actionPayload.position?.x || 0;
          cursorY = actionPayload.position?.y || 0;
        } else if (action === "moveNode") {
          statusMsg = `Ghost AI: Moving node...`;
          cursorX = actionPayload.position?.x || 0;
          cursorY = actionPayload.position?.y || 0;
        } else if (action === "updateNodeData") {
          statusMsg = `Ghost AI: Updating node info...`;
        } else if (action === "deleteNode") {
          statusMsg = `Ghost AI: Deleting node...`;
        } else if (action === "addEdge") {
          statusMsg = `Ghost AI: Connecting components...`;
        }

        // Move cursor and update status message
        await liveblocks.setPresence(roomId, {
          userId: "ai-agent",
          userInfo: AI_USER_INFO,
          data: {
            cursor: cursorX || cursorY ? { x: cursorX, y: cursorY } : null,
            isThinking: true,
            thinking: true,
            statusMessage: statusMsg,
          },
        });

        try {
          // Mutate Liveblocks storage for this action
          await liveblocks.mutateStorage(roomId, ({ root }) => {
            const flow = root.get("flow") as any;
            if (!flow) return;

            const nodesMap = flow.get("nodes");
            const edgesMap = flow.get("edges");

            if (action === "addNode") {
              const shape = actionPayload.shape || "rectangle";
              const size = SHAPE_DEFAULTS[shape as NodeShape] || { width: 120, height: 60 };
              const newNode = {
                id: actionPayload.id,
                type: "canvasNode",
                position: {
                  x: actionPayload.position?.x || 0,
                  y: actionPayload.position?.y || 0,
                },
                data: {
                  label: actionPayload.label || "Node",
                  shape: shape,
                  color: actionPayload.color || "gray",
                },
                width: actionPayload.width || size.width,
                height: actionPayload.height || size.height,
                selected: false,
              };
              nodesMap.set(actionPayload.id, new LiveObject(newNode));
            } else if (action === "moveNode") {
              const node = nodesMap.get(actionPayload.id);
              if (node) {
                const position = node.get("position");
                if (position && typeof (position as any).set === "function") {
                  (position as any).set("x", actionPayload.position.x);
                  (position as any).set("y", actionPayload.position.y);
                } else {
                  node.set("position", actionPayload.position);
                }
              }
            } else if (action === "resizeNode") {
              const node = nodesMap.get(actionPayload.id);
              if (node) {
                node.set("width", actionPayload.width);
                node.set("height", actionPayload.height);
              }
            } else if (action === "updateNodeData") {
              const node = nodesMap.get(actionPayload.id);
              if (node) {
                const data = node.get("data");
                if (data && typeof (data as any).set === "function") {
                  if (actionPayload.label !== undefined) (data as any).set("label", actionPayload.label);
                  if (actionPayload.color !== undefined) (data as any).set("color", actionPayload.color);
                  if (actionPayload.shape !== undefined) (data as any).set("shape", actionPayload.shape);
                } else if (data) {
                  const newData = { ...data };
                  if (actionPayload.label !== undefined) newData.label = actionPayload.label;
                  if (actionPayload.color !== undefined) newData.color = actionPayload.color;
                  if (actionPayload.shape !== undefined) newData.shape = actionPayload.shape;
                  node.set("data", newData);
                }
              }
            } else if (action === "deleteNode") {
              nodesMap.delete(actionPayload.id);
              // Clean up any connected edges
              Array.from(edgesMap.keys()).forEach((edgeId) => {
                const edge = edgesMap.get(edgeId) as any;
                if (edge && (edge.get("source") === actionPayload.id || edge.get("target") === actionPayload.id)) {
                  edgesMap.delete(edgeId);
                }
              });
            } else if (action === "addEdge") {
              const edgeLabel = actionPayload.label || "";
              const newEdge = {
                id: actionPayload.id,
                source: actionPayload.source,
                target: actionPayload.target,
                sourceHandle: null,
                targetHandle: null,
                type: "canvasEdge",
                label: edgeLabel,
                selected: false,
                animated: false,
                data: {},
              };
              edgesMap.set(actionPayload.id, new LiveObject(newEdge));
            } else if (action === "deleteEdge") {
              edgesMap.delete(actionPayload.id);
            }
          });
        } catch (mutateErr) {
          console.error(`Error applying action ${action}:`, mutateErr);
        }

        // Small delay to make the drawing process visible in real-time
        await new Promise((resolve) => setTimeout(resolve, 350));
      }

      await liveblocks.setPresence(roomId, {
        userId: "ai-agent",
        userInfo: AI_USER_INFO,
        data: {
          cursor: null,
          isThinking: false,
          thinking: false,
          statusMessage: "Ghost AI: Complete!",
        },
      });

      const summary = buildDesignSummary(toolCalls);

      return {
        success: true,
        actionsAppliedCount: toolCalls.length,
        summary,
      };
    } catch (err: any) {
      console.error("Design agent execution failed:", err);
      // Update status to show error
      try {
        await liveblocks.setPresence(roomId, {
          userId: "ai-agent",
          userInfo: AI_USER_INFO,
          data: {
            cursor: null,
            isThinking: false,
            thinking: false,
            statusMessage: `Ghost AI Error: ${err.message || "Failed to generate design."}`,
          },
        });
      } catch (e) {
        console.error("Failed to set error presence:", e);
      }
      throw err;
    } finally {
      // Clear AI presence after a short delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      try {
        await liveblocks.setPresence(roomId, {
          userId: "ai-agent",
          userInfo: AI_USER_INFO,
          data: {
            cursor: null,
            isThinking: false,
            thinking: false,
            statusMessage: "",
          },
        });
      } catch (e) {
        console.error("Failed to clear AI presence in finally block:", e);
      }
    }
  },
});
