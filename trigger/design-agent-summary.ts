export function buildDesignSummary(
  toolCalls: Array<{ toolName?: string; input?: unknown }> = [],
  fallbackText?: string,
) {
  const trimmedFallback = fallbackText?.trim();
  if (trimmedFallback) {
    return trimmedFallback;
  }

  const actionCounts = toolCalls.reduce<Record<string, number>>((counts, toolCall) => {
    const actionName = toolCall.toolName ?? "unknown";
    counts[actionName] = (counts[actionName] ?? 0) + 1;
    return counts;
  }, {});

  const actions = Object.entries(actionCounts)
    .sort(([, countA], [, countB]) => countB - countA)
    .map(([actionName, count]) => {
      const label = actionName
        .replace(/^add/, "created")
        .replace(/^move/, "moved")
        .replace(/^resize/, "resized")
        .replace(/^update/, "updated")
        .replace(/^delete/, "removed")
        .replace(/^delete/, "removed")
        .replace(/Node$/, " node")
        .replace(/Edge$/, " connection");

      return `${count} ${label}${count > 1 ? "s" : ""}`;
    });

  if (actions.length === 0) {
    return "No canvas changes were applied.";
  }

  const totalActions = toolCalls.length;
  return `Updated the canvas with ${totalActions} action${totalActions === 1 ? "" : "s"}: ${actions.join(", ")}.`;
}
