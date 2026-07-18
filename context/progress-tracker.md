# Progress Tracker

Update this file after every meaningful implementation
change.

## Current Phase

- Feature 09 (Share Dialog) - Complete

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

## In Progress

- None yet.

## Next Up

- TBD

## Open Questions

- [Any unresolved product or technical decisions]

## Architecture Decisions

- [Decisions made that affect the system design or
  data model — include why the decision was made]

## Session Notes

- [Context needed to resume work in the next session]
