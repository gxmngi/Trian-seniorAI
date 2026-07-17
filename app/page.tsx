export default function Home() {
  return (
    <div className="flex-1 relative flex items-center justify-center">
      {/* Canvas background dot grid style */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--border-default)_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Centered Watermark */}
      <div className="z-10 text-center select-none pointer-events-none">
        <h1 className="text-6xl font-bold tracking-tighter opacity-15 bg-gradient-to-b from-text-primary to-transparent bg-clip-text text-transparent">
          ghost AI
        </h1>
        <p className="text-xs text-text-muted mt-2 tracking-widest uppercase opacity-20">
          Design Canvas &amp; Spec Workspace
        </p>
      </div>
    </div>
  );
}
