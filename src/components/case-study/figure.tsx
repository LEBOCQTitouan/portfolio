import { DitherImage } from "@/components/dither/dither-image";

export function Figure({
  src,
  alt,
  caption,
}: {
  src?: string;
  alt?: string;
  caption?: string;
}) {
  return (
    <figure className="my-6">
      {src ? (
        <DitherImage
          src={src}
          alt={alt ?? caption ?? ""}
          className="w-full rounded-panel border border-border"
        />
      ) : (
        <div className="flex min-h-40 items-center justify-center rounded-panel border border-dashed border-accent/40 bg-[var(--accent-soft)] p-6 text-center text-sm text-muted">
          {caption ?? "Figure"}
        </div>
      )}
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-muted">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
