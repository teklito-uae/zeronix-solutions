import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import type { Block } from "../lib/types";
import { createBlock, type InsertableType } from "../lib/blockFactory";
import { BlockRenderer } from "../blocks/BlockRenderer";
import { InsertMenu } from "./InsertMenu";
import { SortableBlock } from "./SortableBlock";

export function BlockEditor({
  blocks,
  onChange,
}: {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function insertAt(index: number, type: InsertableType) {
    const next = [...blocks];
    next.splice(index, 0, createBlock(type));
    onChange(next);
  }

  function updateBlock(id: string, updated: Block) {
    onChange(blocks.map((b) => (b.id === id ? updated : b)));
  }

  function deleteBlock(id: string) {
    onChange(blocks.filter((b) => b.id !== id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    onChange(arrayMove(blocks, oldIndex, newIndex));
  }

  let headingCounter = 0;

  return (
    <div className="pl-9">
      <InsertMenu onInsert={(type) => insertAt(0, type)} />
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          {blocks.map((block, i) => {
            if (block.type === "heading") headingCounter += 1;
            return (
              <div key={block.id}>
                <SortableBlock id={block.id} onDelete={() => deleteBlock(block.id)}>
                  <BlockRenderer
                    block={block}
                    headingNumber={headingCounter}
                    onChange={(updated) => updateBlock(block.id, updated)}
                  />
                </SortableBlock>
                <InsertMenu onInsert={(type) => insertAt(i + 1, type)} />
              </div>
            );
          })}
        </SortableContext>
      </DndContext>
    </div>
  );
}
