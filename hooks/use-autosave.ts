import { useState, useEffect, useRef, useCallback } from "react";

export type SaveStatus = "saving" | "saved" | "error" | "idle";

export function useAutosave(
  projectId: string,
  nodes: any[],
  edges: any[]
) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const isFirstRender = useRef(true);
  const lastSavedString = useRef("");

  const latestData = useRef({ nodes, edges });
  useEffect(() => {
    latestData.current = { nodes, edges };
  }, [nodes, edges]);

  const save = useCallback(async () => {
    const { nodes: currentNodes, edges: currentEdges } = latestData.current;
    const currentString = JSON.stringify({ nodes: currentNodes, edges: currentEdges });
    setStatus("saving");
    try {
      const response = await fetch(`/api/projects/${projectId}/canvas`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: currentString,
      });

      if (response.ok) {
        setStatus("saved");
        lastSavedString.current = currentString;
        return true;
      } else {
        setStatus("error");
        return false;
      }
    } catch (err) {
      console.error("Save error:", err);
      setStatus("error");
      return false;
    }
  }, [projectId]);

  useEffect(() => {
    const currentString = JSON.stringify({ nodes, edges });

    // Skip saving on the very first mount/render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      lastSavedString.current = currentString;
      return;
    }

    // If data hasn't changed, skip triggering save
    if (currentString === lastSavedString.current) {
      return;
    }

    setStatus("saving");

    const debounceTimer = setTimeout(async () => {
      await save();
    }, 2000); // 2-second debounce

    return () => clearTimeout(debounceTimer);
  }, [nodes, edges, save]);

  return { status, save };
}

