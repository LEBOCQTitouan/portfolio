import { Orb } from "@/components/companion/orb";

export function CompanionSandbox() {
  return (
    <div
      className="flex items-center justify-center overflow-hidden rounded-2xl border border-border p-10"
      style={{
        background:
          "radial-gradient(120% 90% at 80% 0%, var(--accent-soft), transparent 55%), var(--surface)",
      }}
    >
      <div style={{ width: 120, height: 120, position: "relative" }}>
        <Orb mood="calm" reaction="active" gaze={{ x: 0, y: 0 }} style={{ width: 120, height: 120 }} />
      </div>
    </div>
  );
}
