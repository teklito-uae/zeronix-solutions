import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export function SortableBlock({
  id,
  onDelete,
  children,
}: {
  id: string;
  onDelete: () => void;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group/block">
      <div className="absolute -left-9 top-1 flex flex-col gap-0.5 opacity-0 group-hover/block:opacity-100 transition-opacity">
        <button
          {...attributes}
          {...listeners}
          className="w-6 h-6 rounded border border-gray-200 bg-white text-gray-400 text-xs cursor-grab active:cursor-grabbing hover:bg-gray-50"
          title="Drag to reorder"
        >
          ⠿
        </button>
        <button
          onClick={onDelete}
          className="w-6 h-6 rounded border border-gray-200 bg-white text-gray-400 text-xs hover:bg-red-50 hover:text-red-500"
          title="Delete block"
        >
          ×
        </button>
      </div>
      {children}
    </div>
  );
}
