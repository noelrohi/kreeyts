import { IconCopy, IconPhoto, IconQuote } from "@tabler/icons-react"
import { toast } from "sonner"

import type { ReferenceAsset } from "@/lib/higgsfield/types"

interface CreativeSourceSummaryProps {
  prompt: string
  references: ReferenceAsset[]
  openOutput: (target?: string | null) => Promise<void>
}

export function CreativeSourceSummary({
  prompt,
  references,
  openOutput,
}: CreativeSourceSummaryProps) {
  const handleCopyPrompt = () => {
    void navigator.clipboard.writeText(prompt)
    toast("Prompt copied to clipboard")
  }

  return (
    <section className="mt-4 overflow-hidden rounded-2xl border border-border/70 bg-card/35 p-4 shadow-[0_18px_60px_-40px_rgba(0,0,0,0.65)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-ember/10 text-ember ring-1 ring-ember/20 ring-inset">
            <IconQuote className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-mono text-[0.65rem] tracking-[0.2em] text-muted-foreground uppercase">
                Creation prompt
              </p>
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="grid size-5 shrink-0 place-items-center rounded text-muted-foreground transition hover:bg-ember/10 hover:text-ember"
                title="Copy prompt"
                aria-label="Copy prompt"
              >
                <IconCopy className="size-3.5" />
              </button>
            </div>
            <p
              className="mt-1 line-clamp-2 text-sm leading-6 text-foreground/85"
              title={prompt}
            >
              {prompt}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-start gap-3 sm:max-w-[55%] sm:border-l sm:border-border/60 sm:pl-6">
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-ember/10 text-ember ring-1 ring-ember/20 ring-inset">
            <IconPhoto className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[0.65rem] tracking-[0.2em] text-muted-foreground uppercase">
              Source reference{references.length === 1 ? "" : "s"}
            </p>
            {references.length > 0 ? (
              <div className="mt-1.5 flex flex-wrap gap-2">
                {references.map((reference) => (
                  <button
                    key={reference.id}
                    type="button"
                    disabled={!reference.filePath}
                    onClick={() => void openOutput(reference.filePath)}
                    className="group size-12 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border/60 ring-inset transition hover:ring-ember/50 disabled:cursor-default disabled:hover:ring-border/60"
                    title={
                      reference.filePath
                        ? `Reveal ${reference.name}`
                        : reference.name
                    }
                  >
                    <img
                      src={reference.url}
                      alt={reference.name}
                      className="size-full object-cover transition group-hover:scale-[1.05]"
                    />
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                No reference images were saved for this creative.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
