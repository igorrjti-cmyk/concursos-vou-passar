export default function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050810]">
      <div className="flex items-center gap-3 text-sm text-white/40">
        <span className="h-2 w-2 animate-pulse rounded-full bg-gold" />
        Preparando seu ambiente…
      </div>
    </div>
  );
}
