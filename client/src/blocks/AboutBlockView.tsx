import { RichTextEditor } from "../components/RichTextEditor";
import { newId } from "../lib/id";
import type { AboutBlock } from "../lib/types";

export function AboutBlockView({
  block,
  onChange,
}: {
  block: AboutBlock;
  onChange: (b: AboutBlock) => void;
}) {
  function updateService(id: string, patch: Partial<{ title: string; description: string }>) {
    onChange({
      ...block,
      services: block.services.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  }

  function addService() {
    onChange({
      ...block,
      services: [...block.services, { id: newId("svc"), title: "", description: "" }],
    });
  }

  function removeService(id: string) {
    onChange({ ...block, services: block.services.filter((s) => s.id !== id) });
  }

  return (
    <div className="border border-gray-200 rounded-md bg-white p-4 space-y-4">
      <input
        value={block.heading}
        onChange={(e) => onChange({ ...block, heading: e.target.value })}
        placeholder="About Us"
        className="w-full text-lg font-semibold text-brand-navy outline-none border-b border-gray-100 py-1"
      />

      <RichTextEditor
        html={block.description}
        onChange={(description) => onChange({ ...block, description })}
      />

      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Services / Products
        </div>
        {block.services.map((service) => (
          <div key={service.id} className="flex gap-2 items-start border border-gray-100 rounded-md p-2">
            <div className="flex-1 space-y-1">
              <input
                value={service.title}
                onChange={(e) => updateService(service.id, { title: e.target.value })}
                placeholder="Service or product name"
                className="w-full font-medium outline-none border-b border-gray-100 py-1"
              />
              <textarea
                value={service.description}
                onChange={(e) => updateService(service.id, { description: e.target.value })}
                placeholder="Short description"
                rows={2}
                className="w-full text-sm text-gray-600 outline-none resize-none"
              />
            </div>
            <button
              onClick={() => removeService(service.id)}
              className="text-gray-400 hover:text-red-500 px-1"
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={addService}
          className="text-xs px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-100"
        >
          + Add Service / Product
        </button>
      </div>
    </div>
  );
}
