import type { CoverBlock } from "../lib/types";

export function CoverBlockView({
  block,
  onChange,
}: {
  block: CoverBlock;
  onChange: (b: CoverBlock) => void;
}) {
  return (
    <div className="rounded-lg overflow-hidden bg-gradient-to-b from-brand-navy to-brand-black text-white p-10">
      <textarea
        value={block.title}
        onChange={(e) => onChange({ ...block, title: e.target.value })}
        rows={2}
        placeholder="Proposal Title"
        className="w-full bg-transparent text-3xl font-extrabold text-brand-green outline-none resize-none placeholder:text-brand-green/50"
      />
      <hr className="my-6 border-white/20" />
      <div className="space-y-2 text-sm text-gray-200">
        <div className="flex items-center gap-2">
          <span className="uppercase tracking-wide text-gray-400 w-32 shrink-0">Prepared For</span>
          <input
            value={block.preparedFor}
            onChange={(e) => onChange({ ...block, preparedFor: e.target.value })}
            className="bg-transparent border-b border-white/20 outline-none flex-1 py-1"
            placeholder="Client company name"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="uppercase tracking-wide text-gray-400 w-32 shrink-0">Prepared By</span>
          <input
            value={block.preparedBy}
            onChange={(e) => onChange({ ...block, preparedBy: e.target.value })}
            className="bg-transparent border-b border-white/20 outline-none flex-1 py-1"
          />
        </div>
      </div>
    </div>
  );
}
