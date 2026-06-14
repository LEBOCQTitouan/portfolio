import { useEffect, useReducer, useRef } from "react";
import { initialReactionState, reduceReaction, type Reaction, type ReactionEvent } from "./reaction-state";

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

export function useReaction(muted: boolean): { reaction: Reaction; poke: () => void } {
  const [state, dispatch] = useReducer(reduceReaction, undefined, () => initialReactionState(now()));
  const send = (e: ReactionEvent) => dispatch(e);
  const sendRef = useRef(send);
  sendRef.current = send;

  // mute/unmute
  useEffect(() => {
    sendRef.current(muted ? { type: "mute" } : { type: "unmute", now: now() });
  }, [muted]);

  // activity (pointer move / scroll / key) + idle ticks
  useEffect(() => {
    const onActivity = () => sendRef.current({ type: "activity", now: now() });
    window.addEventListener("pointermove", onActivity, { passive: true });
    window.addEventListener("scroll", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity);
    const tick = window.setInterval(() => sendRef.current({ type: "tick", now: now() }), 1000);
    return () => {
      window.removeEventListener("pointermove", onActivity);
      window.removeEventListener("scroll", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.clearInterval(tick);
    };
  }, []);

  return { reaction: state.reaction, poke: () => sendRef.current({ type: "poke", now: now() }) };
}
