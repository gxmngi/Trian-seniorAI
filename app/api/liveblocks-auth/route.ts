import { auth, currentUser } from "@clerk/nextjs/server";
import { getLiveblocks, getUserColor } from "@/lib/liveblocks";
import { checkProjectAccess } from "@/lib/project-access";

export async function POST(request: Request) {
  // 1. Require Clerk authentication
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Parse Liveblocks roomId (passed as { room: "..." })
  const bodyData = await request.json().catch(() => ({}));
  const projectId = bodyData.room;

  if (!projectId) {
    return new Response(JSON.stringify({ error: "Room ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Verify project access using the existing access helper
  const { hasAccess, error } = await checkProjectAccess(projectId);
  if (!hasAccess) {
    return new Response(JSON.stringify({ error: error || "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const liveblocks = getLiveblocks();

    // 3. Ensure the Liveblocks room exists (create only if needed)
    await liveblocks.getOrCreateRoom(projectId, {
      defaultAccesses: [], // Private by default
    });

    // Fetch user info from Clerk
    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress || userId;
    const name =
      user?.fullName ||
      `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
      email;
    const avatar = user?.imageUrl || "";
    const color = getUserColor(userId);

    // 4. Return a session token with user info
    const session = liveblocks.prepareSession(userId, {
      userInfo: {
        name,
        avatar,
        color,
      },
    });

    // Grant access to the room
    session.allow(projectId, session.FULL_ACCESS);

    const { status, body } = await session.authorize();
    return new Response(body, {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error("Liveblocks auth error:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
