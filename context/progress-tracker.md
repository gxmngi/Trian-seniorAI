# Progress Tracker

Update this file after every meaningful implementation
change.

## Current Phase

- Feature 20 (AI Sidebar) - Complete

## Current Goal

- TBD

## Completed

- Feature 01: Design System (shadcn/ui configured for Tailwind v4, dark-only theme tokens in globals.css, lucide-react installed, lib/utils.ts cn() helper in place, components/ui/ added with Button, Card, Dialog, Input, Tabs, Textarea, and ScrollArea)
- Feature 02: Editor Chrome (Added EditorNavbar with stateful sidebar toggle, ProjectSidebar with slide-in overlay transition, 'My Projects' and 'Shared' tabs with empty placeholders, and a bottom New Project action button, wired successfully on the main workspace page)
- Feature 03: Auth Setup (Integrated Clerk Authentication, wrapped layout in ClerkProvider with Clerk's dark theme overridden by CSS custom properties, created responsive two-panel sign-in and sign-up pages, configured proxy.ts route protection with auto-proxy path config, added redirects on root `/` route to `/editor`, and added user settings avatar UserButton in the EditorNavbar)
- Feature 04: Project Dialogs (Built `/editor` home view, created custom useProject state hook/provider, implemented Create Project Dialog with live slug preview, Rename Project Dialog with prefilled input and autofocus, and Delete Project Dialog with destructive warning styling, wired sidebar action buttons for owned projects, configured mobile backdrop overlays)
- Feature 05: Prisma Setup (Configured Project and ProjectCollaborator models in prisma/models/project.prisma, built cached singleton Prisma client in lib/prisma.ts branching for pg direct adapter or Accelerate, applied initial migration to database, and generated Prisma client under app/generated/prisma)
- Feature 06: Project APIs (Created backend REST endpoints for GET /api/projects, POST /api/projects, PATCH /api/projects/[projectId], and DELETE /api/projects/[projectId] with Clerk-authenticated owner checks and 401/403 status code handlings)
- Feature 07: Wire Editor Home (Wired editor home sidebar, layout, page, and project provider to real database projects fetched server-side, implemented useProjectActions hook for mutations like create with custom id/roomId alignment, rename, and delete, and updated sidebar list item components as next/link)
- Feature 08: Editor Workspace Shell (Built `/editor/[roomId]` workspace server page with access verification helpers in `lib/project-access.ts` and `AccessDenied` view, updated top navbar with project title and Share/AI triggers, linked AI sidebar visibility state globally through ProjectContext, and loaded workspace client layout with default tab auto-selection in sidebar)
- Feature 09: Share Dialog (Added backend endpoints for listing/inviting/removing collaborators, integrated with Clerk Backend API to enrich emails with display names and avatars, implemented custom glassmorphism style Dialog with clipboard link sharing, owner-only invite/remove permissions, and read-only views for collaborators)
- Feature 10: Liveblocks Setup (Configured liveblocks.config.ts with Presence and UserMeta schemas, created cached Liveblocks node client and deterministic user-color mapper in lib/liveblocks.ts, implemented POST /api/liveblocks-auth with Clerk auth, project access guard, room existence check, and user metadata session token generation)
- Feature 11: Base Canvas (Defined custom canvas node and edge models in types/canvas.ts, configured liveblocks.config.ts Storage with LiveMap collections, built CanvasRoom wrapper using LiveblocksProvider, RoomProvider, and ClientSideSuspense with connection error fallback, and implemented CanvasEditor utilizing useLiveblocksFlow to synchronize React Flow state with Liveblocks storage)
- Feature 12: Shape Panel (Added bottom-center floating shape panel with 6 draggable shapes, configured screen-to-flow coordinates conversions, registered the custom `canvasNode` renderer to paint nodes as styled bordered rectangles, and wired useMutation to insert drops into Liveblocks collaborative storage)
- Feature 13: Node Shape & Drag Preview (Updated types/canvas.ts and components/editor/canvas/canvas-node.tsx to render rectangles, circles, and pills using CSS and diamonds, hexagons, and cylinders using scale-invariant SVGs; added a custom browser-safe drag preview system utilizing local non-storage node injection, centered drag overlays, and drag cancellation event hooks)
- Feature 14: Node Editing (Integrated `NodeResizer` inside `CanvasNodeComponent` with subtle accent handles and a minimum dimension constraint; implemented inline double-click editing utilizing a centered textarea configured with standard React Flow interaction-canceling classes `nodrag nopan nowheel` to avoid canvas movement; wired the storage mutation `updateNodeData` to sync edits to all clients in real-time)
- Feature 15: Node Color Toolbar (Implemented a floating color toolbar that renders centered above selected canvas nodes; displays 8 predefined color swatches with dynamic colored borders and tight, glow shadows matching each hue; configured node background and text updates on swatch click via storage mutations)
- Feature 16: Edge Behavior & Labels (Created custom `CanvasEdgeComponent` with orthogonal smooth-step right-angle routing and rounded ends; configured double-click inline label input with auto-expanding width, Esc/Enter key support, and canvas click isolation using `EdgeLabelRenderer`; added dynamic marker arrowheads and a invisible thick interaction path for easy clicking/hovering)
- Feature 17: Canvas Ergonomics (Created bottom-left floating control bar containing zoom options and history undo/redo buttons; wired history controls to Liveblocks storage timeline hooks `useHistory` and zoom controls to `useReactFlow` API actions; added `useKeyboardShortcuts` hook in `hooks/` to listen for canvas keybind overrides, checking that shortcuts are skipped when typing in inputs/textareas; removed the canvas Minimap component)
- Feature 18: Starter Template Library (Created `components/editor/starter-templates.ts` defining microservices architecture, CI/CD pipeline, and event-driven templates; built `StarterTemplatesModal` displaying a 3-column scrollable templates grid with static auto-scaling SVG diagram previews; integrated 'Templates' button into the workspace navbar; implemented transactional Liveblocks storage mutations to clear and replace canvas nodes/edges, triggering `fitView` after import)
- Feature 19: Presence & Cursors (Configured global Presence schemas; mapped collaborator avatars using a Portal into `EditorNavbar` to place them next to Clerk's `UserButton` with a vertical divider when other users exist, filtering out the current user; implemented pointer tracking on the canvas viewport to broadcast pointer coordinates and clear them on pointer leave; rendered cursors with dynamic SVG pointers and participant-color name badges)
- Feature 20: AI Sidebar (Extracted the AI sidebar to a stateful `components/editor/ai-sidebar.tsx` component; built tabbed layouts for 'AI Architect' and 'Specs' using shadcn components; implemented interactive simulated AI message responses inside the scrollable chat view, starter prompt chips, auto-resizing input textarea (72px to 160px height), and a static demo spec card in the Specs tab with disabled actions)

## In Progress

- None yet.

## Next Up

- TBD

## Open Questions

- None.

## Architecture Decisions

- Feature 17: Extracted zoom, undo, and redo keys logic into hooks/use-keyboard-shortcuts.ts for separation of concerns and simpler testing.

## Session Notes

- Predefined node styling matches references. Zoom and history controls wired and operational. Next.js build verified.
