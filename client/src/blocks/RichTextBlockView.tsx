import { RichTextEditor } from "../components/RichTextEditor";
import type { RichTextBlock } from "../lib/types";

export function RichTextBlockView({
  block,
  onChange,
}: {
  block: RichTextBlock;
  onChange: (b: RichTextBlock) => void;
}) {
  return (
    <RichTextEditor
      html={block.html}
      onChange={(html) => onChange({ ...block, html })}
    />
  );
}
