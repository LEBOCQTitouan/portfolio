import { useTypewriter } from "./use-typewriter";

export function SpeechBubble({
  text,
  reducedMotion,
}: {
  text: string;
  reducedMotion: boolean;
}) {
  const shown = useTypewriter(text, !reducedMotion);
  return <div className="companion-bubble">{shown}</div>;
}
