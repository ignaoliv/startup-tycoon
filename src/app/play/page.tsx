import { Suspense } from "react";
import { GameShell } from "@/components/GameShell";

export default function PlayPage() {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center text-sm font-bold text-ink/50">Abriendo la oficina…</div>}>
      <GameShell />
    </Suspense>
  );
}
