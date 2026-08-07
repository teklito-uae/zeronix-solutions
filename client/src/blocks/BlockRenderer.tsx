import type { Block } from "../lib/types";
import { CoverBlockView } from "./CoverBlockView";
import { HeadingBlockView } from "./HeadingBlockView";
import { RichTextBlockView } from "./RichTextBlockView";
import { PriceTableBlockView } from "./PriceTableBlockView";
import { GenericTableBlockView } from "./GenericTableBlockView";
import { SignatureBlockView } from "./SignatureBlockView";
import { AboutBlockView } from "./AboutBlockView";

export function BlockRenderer({
  block,
  headingNumber,
  onChange,
}: {
  block: Block;
  headingNumber: number;
  onChange: (b: Block) => void;
}) {
  switch (block.type) {
    case "cover":
      return <CoverBlockView block={block} onChange={onChange} />;
    case "heading":
      return <HeadingBlockView block={block} number={headingNumber} onChange={onChange} />;
    case "richtext":
      return <RichTextBlockView block={block} onChange={onChange} />;
    case "pricetable":
      return <PriceTableBlockView block={block} onChange={onChange} />;
    case "table":
      return <GenericTableBlockView block={block} onChange={onChange} />;
    case "signature":
      return <SignatureBlockView block={block} onChange={onChange} />;
    case "about":
      return <AboutBlockView block={block} onChange={onChange} />;
    case "divider":
      return <hr className="border-gray-200 my-2" />;
    case "pagebreak":
      return (
        <div className="flex items-center gap-2 text-xs text-gray-400 select-none">
          <div className="flex-1 border-t border-dashed border-gray-300" />
          Page break
          <div className="flex-1 border-t border-dashed border-gray-300" />
        </div>
      );
    default:
      return null;
  }
}
