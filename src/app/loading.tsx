export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div
          aria-label="Yukleniyor"
          className="h-10 w-10 animate-spin rounded-full border-4 border-muted-foreground/30 border-t-primary"
        />
        <span className="text-sm text-muted-foreground">Yukleniyor...</span>
      </div>
    </div>
  );
}