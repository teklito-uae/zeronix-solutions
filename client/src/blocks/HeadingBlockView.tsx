import type { HeadingBlock } from "../lib/types";

export function HeadingBlockView({
  block,
  number,
  onChange,
}: {
  block: HeadingBlock;
  number: number;
  onChange: (b: HeadingBlock) => void;
}) {
  return (
    <div className="flex items-baseline gap-2 border-b border-gray-200 pb-2">
      <span className="text-brand-navy font-bold">{number}.</span>
      <input
        value={block.text}
        onChange={(e) => onChange({ ...block, text: e.target.value })}
        placeholder="SECTION TITLE"
        className="flex-1 outline-none font-bold text-lg text-brand-navy uppercase bg-transparent"
      />
    </div>
  );
}
