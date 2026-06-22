import { BP, BP_FRAME } from "@/design/blueprint";

// Overall column dimension (768) + gutter sub-dimension (24). Mono, static, decorative.
export function Dimension() {
  return (
    <div className="bp-dim" aria-hidden="true">
      <div className="bp-dim__line">
        <i className="bp-arr l" /><span className="bp-ln" />
        <b className="bp-v">{BP.COLUMN}</b>
        <span className="bp-ln" /><i className="bp-arr r" />
      </div>
      <div className="bp-dim__gutter">
        <i className="bp-arr l" /><span className="bp-ln" /><i className="bp-arr r" />
        <b className="bp-v">{BP.GUTTER}</b>
      </div>
    </div>
  );
}

// Designed title-block plate (ledger). Accent hairline is the one sanctioned colour.
export function TitleBlock({ lang }: { lang: string }) {
  const rows: Array<[string, string]> = [
    ["TITLE", BP_FRAME.title],
    ["REV", BP_FRAME.rev],
    ["SHEET", BP_FRAME.sheet],
    ["LANG", lang.toUpperCase()],
    ["SCALE", BP_FRAME.scale],
    ["STATUS", BP_FRAME.status],
  ];
  return (
    <div className="bp-tb" aria-hidden="true">
      <div className="bp-tb__head">
        <span className="bp-tb__name">{BP_FRAME.name}</span>
        <span className="bp-tb__idx">{BP_FRAME.sheet}</span>
      </div>
      <div className="bp-tb__grid">
        {rows.map(([k, v]) => (
          <div key={k}><b>{k}</b><s>{v}</s></div>
        ))}
      </div>
    </div>
  );
}

// Registration crosshair + scale bar.
export function DraftingMarks() {
  return (
    <div className="bp-marks" aria-hidden="true">
      <span className="bp-reg"><i /></span>
      <span className="bp-scale">
        <span className="bp-scale__bar"><span /><span /><span /><span /></span>
        <span className="bp-scale__cap"><span>0</span><span>96px</span></span>
      </span>
    </div>
  );
}
