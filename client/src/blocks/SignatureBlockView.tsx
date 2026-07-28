import type { SignatureBlock } from "../lib/types";

export function SignatureBlockView({
  block,
  onChange,
}: {
  block: SignatureBlock;
  onChange: (b: SignatureBlock) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-8 border border-gray-200 rounded-md bg-white p-4 text-sm">
      <div className="space-y-1">
        <div className="font-semibold text-brand-navy">Prepared By</div>
        <input
          value={block.leftCompany}
          onChange={(e) => onChange({ ...block, leftCompany: e.target.value })}
          className="w-full outline-none border-b border-gray-100 py-1"
          placeholder="Company name"
        />
        <div className="text-gray-400 text-xs pt-2">Authorized Signatory</div>
        <input
          value={block.leftName}
          onChange={(e) => onChange({ ...block, leftName: e.target.value })}
          className="w-full outline-none border-b border-gray-100 py-1"
          placeholder="Name"
        />
      </div>
      <div className="space-y-1">
        <div className="font-semibold text-brand-navy">Accepted By</div>
        <input
          value={block.rightLabel}
          onChange={(e) => onChange({ ...block, rightLabel: e.target.value })}
          className="w-full outline-none border-b border-gray-100 py-1"
          placeholder="Client company name"
        />
        <div className="text-gray-400 text-xs pt-2">Authorized Signatory</div>
        <div className="text-gray-300 py-1 border-b border-gray-100">Name: __________________</div>
      </div>
    </div>
  );
}
