import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

function toRoutePattern(value: string | undefined, fallback: string) {
  const normalized = (value ?? fallback).split("?")[0].split("#")[0];
  const pathname = normalized.startsWith("http://") || normalized.startsWith("https://")
    ? new URL(normalized).pathname
    : normalized;
  return `${pathname.replace(/\/$/, "")}(.*)`;
}

const isPublicRoute = createRouteMatcher([
  toRoutePattern(process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL, "/sign-in"),
  toRoutePattern(process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL, "/sign-up"),
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
