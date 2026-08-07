import { useEffect, useState } from "react";
import {
  FileText,
  Heading as HeadingIcon,
  TextAlignStart,
  Building2,
  Table2,
  Rows3,
  PenLine,
  Minus,
  FileStack,
} from "lucide-react";
import type { Block } from "../lib/types";
import { blockOutlineLabel } from "../lib/blockFactory";

const ICONS: Record<Block["type"], React.ComponentType<{ className?: string }>> = {
  cover: FileText,
  heading: HeadingIcon,
  richtext: TextAlignStart,
  about: Building2,
  pricetable: Table2,
  table: Rows3,
  signature: PenLine,
  divider: Minus,
  pagebreak: FileStack,
};

export function QuoteOutline({ blocks }: { blocks: Block[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const elements = blocks
      .map((b) => document.getElementById(`block-${b.id}`))
      .filter((el): el is HTMLElement => !!el);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setActiveId((current) => {
          const visible = entries.filter((e) => e.isIntersecting);
          if (visible.length === 0) return current;
          const topMost = visible.reduce((a, b) =>
            a.boundingClientRect.top < b.boundingClientRect.top ? a : b
          );
          return topMost.target.id.replace("block-", "");
        });
      },
      { rootMargin: "-96px 0px -65% 0px", threshold: 0 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [blocks]);

  function scrollTo(id: string) {
    document.getElementById(`block-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (blocks.length === 0) {
    return (
      <p className="px-1 text-xs text-muted-foreground">
        Blocks you add will be listed here for quick navigation.
      </p>
    );
  }

  let headingCounter = 0;

  return (
    <nav className="-mr-1 max-h-[calc(100vh-11rem)] space-y-0.5 overflow-y-auto pr-1">
      {blocks.map((block) => {
        if (block.type === "heading") headingCounter += 1;
        const Icon = ICONS[block.type];
        const label = blockOutlineLabel(block, headingCounter);
        const active = activeId === block.id;
        return (
          <button
            key={block.id}
            type="button"
            onClick={() => scrollTo(block.id)}
            title={label}
            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
              active
                ? "bg-primary/10 font-medium text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
