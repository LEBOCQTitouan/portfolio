import { useEffect, useRef, type RefObject } from "react";
import type { Reaction } from "./reaction-state";
import type { EyeShape } from "./eyes";
import {
  BLINK, blinkTransform, nextBlinkDelay, wantsDoubleBlink,
  saccadeTarget, saccadeIntensity, blinkAllowed, focusScale,
  EYE_GAZE_PX, SACCADE, STARTLE_AMP,
} from "./eye-life";

export type EyeLifeInputs = {
  containerRef: RefObject<HTMLDivElement | null>;
  reaction: Reaction;
  shape: EyeShape;
  /** Identity of the active narration section; a change fires a "blink for a reason". */
  activeKey: string | null;
  hovering: boolean;
  /** Increments on each poke; a change fires a startle widen. */
  pokeNonce: number;
  gaze: { x: number; y: number };
  reducedMotion: boolean;
  /** True when the Orb is mounted (lines.length > 0). Included in the rAF effect
   *  deps so the loop re-binds to freshly-mounted eye nodes after the Orb unmounts
   *  on no-narration routes (e.g. /blog) and remounts on the way back. */
  orbMounted: boolean;
};

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

export function useEyeLife(inputs: EyeLifeInputs) {
  // Latest inputs, read inside the rAF loop without re-subscribing.
  const ref = useRef(inputs);
  // eslint-disable-next-line react-hooks/refs -- intentional: latest-props-in-a-ref so the rAF loop reads live inputs without re-creating
  ref.current = inputs;
  // Commands from React effects into the running loop.
  const cmd = useRef({ wantBlink: false, wantStartle: false });

  // Fire a blink when the active section changes.
  useEffect(() => {
    cmd.current.wantBlink = true;
  }, [inputs.activeKey]);

  // Startle widen on poke.
  useEffect(() => {
    if (inputs.pokeNonce > 0) cmd.current.wantStartle = true;
  }, [inputs.pokeNonce]);

  useEffect(() => {
    if (inputs.reducedMotion) return;
    const container = inputs.containerRef.current;
    if (!container) return;
    const wraps = Array.from(container.querySelectorAll<HTMLElement>(".companion-eye"));
    const lids = Array.from(container.querySelectorAll<HTMLElement>(".companion-eye__lid"));
    if (wraps.length === 0 || lids.length === 0) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[useEyeLife] no .companion-eye/.companion-eye__lid nodes in containerRef; eyes will not animate");
      }
      return;
    }

    let raf = 0;
    let sx = 0, sy = 0; // eased saccade offset (px)
    let tx = 0, ty = 0; // current saccade target (px)
    let focus = 1; // eased hover focus scale
    let startle = 0; // decaying startle pulse
    let blinkStart = -Infinity; // performance.now of the active blink
    let secondBlinkAt = Infinity; // queued double-blink time
    let lastScrollAt = -Infinity;
    let nextBlinkAt = now() + nextBlinkDelay(Math.random);

    const onScroll = () => { lastScrollAt = now(); };
    window.addEventListener("scroll", onScroll, { passive: true });

    const tryStartBlink = (t: number, inp: EyeLifeInputs) => {
      if (blinkAllowed(inp.reaction, inp.shape) && blinkStart === -Infinity) blinkStart = t;
    };

    const loop = () => {
      const t = now();
      const inp = ref.current;

      // Commands from effects.
      if (cmd.current.wantBlink) { cmd.current.wantBlink = false; tryStartBlink(t, inp); }
      if (cmd.current.wantStartle) { cmd.current.wantStartle = false; startle = STARTLE_AMP; }

      // Idle blink schedule.
      if (t >= nextBlinkAt) {
        tryStartBlink(t, inp);
        if (wantsDoubleBlink(Math.random)) secondBlinkAt = t + BLINK.totalMs + 120;
        nextBlinkAt = t + nextBlinkDelay(Math.random);
      }
      if (t >= secondBlinkAt) { secondBlinkAt = Infinity; tryStartBlink(t, inp); }

      // Saccade: pick a new dart once we've settled on the last one.
      const intensity = saccadeIntensity(t - lastScrollAt);
      if (Math.abs(sx - tx) < 0.2 && Math.abs(sy - ty) < 0.2) {
        const tgt = saccadeTarget(Math.random, intensity);
        tx = tgt.x; ty = tgt.y;
      }
      sx += (tx - sx) * SACCADE.smooth;
      sy += (ty - sy) * SACCADE.smooth;

      // Wrapper translate = gaze + saccade.
      const gx = inp.gaze.x * EYE_GAZE_PX + sx;
      const gy = inp.gaze.y * EYE_GAZE_PX + sy;
      for (const w of wraps) w.style.transform = `translate(${gx.toFixed(2)}px, ${gy.toFixed(2)}px)`;

      // Lid scale = blink × (focus + startle), only in alert-open states. In
      // suppressed states (asleep/angry/annoyed) clear the inline transform so the
      // CSS resting shape (closed line, angry rotate) shows.
      const allow = blinkAllowed(inp.reaction, inp.shape);
      focus += (focusScale(inp.hovering) - focus) * 0.18;
      startle += (0 - startle) * 0.12;
      if (allow) {
        let bx = 1, by = 1;
        if (blinkStart > -Infinity) {
          const b = blinkTransform(t - blinkStart, inp.shape);
          bx = b.scaleX; by = b.scaleY;
          if (b.done) blinkStart = -Infinity;
        }
        const f = focus * (1 + startle);
        for (const l of lids) l.style.transform = `scaleX(${(bx * f).toFixed(3)}) scaleY(${(by * f).toFixed(3)})`;
      } else {
        blinkStart = -Infinity;
        for (const l of lids) l.style.transform = "";
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      for (const w of wraps) w.style.transform = "";
      for (const l of lids) l.style.transform = "";
    };
    // Re-create the loop only when the binding context changes; live values are
    // read through `ref`. `shape`/`reaction`/`gaze`/`hovering` deliberately omitted.
    // `orbMounted` is included so the effect tears down and re-runs when the Orb
    // unmounts/remounts across routes, re-querying the fresh eye nodes — same reason
    // the spring loop in companion.tsx includes it.
  }, [inputs.reducedMotion, inputs.containerRef, inputs.orbMounted]);
}
