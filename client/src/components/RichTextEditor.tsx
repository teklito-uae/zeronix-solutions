import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import { useEffect } from "react";

function ToolbarButton({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`px-2 py-1 text-xs rounded border ${
        active
          ? "bg-brand-navy text-white border-brand-navy"
          : "bg-background text-muted-foreground border-border hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

type HeadingChoice = "paragraph" | "1" | "2" | "3";

/**
 * Shared Tiptap rich-text editor used both by the quote block editor
 * (RichTextBlockView) and the enquiry "scope of work" field. Keep the Tiptap
 * extension config in exactly one place.
 */
export function RichTextEditor({
  html,
  onChange,
  className,
  editorClassName,
  placeholder,
}: {
  html: string;
  onChange: (html: string) => void;
  className?: string;
  editorClassName?: string;
  placeholder?: string;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Underline,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: html,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== html) {
      editor.commands.setContent(html, { emitUpdate: false });
    }
    // Only re-sync when the editor instance itself changes; keystrokes flow
    // the other way via onUpdate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  if (!editor) return null;

  const headingValue: HeadingChoice = editor.isActive("heading", { level: 1 })
    ? "1"
    : editor.isActive("heading", { level: 2 })
      ? "2"
      : editor.isActive("heading", { level: 3 })
        ? "3"
        : "paragraph";

  function setHeading(value: HeadingChoice) {
    if (value === "paragraph") {
      editor!.chain().focus().setParagraph().run();
    } else {
      editor!.chain().focus().toggleHeading({ level: Number(value) as 1 | 2 | 3 }).run();
    }
  }

  return (
    <div className={`rounded-md border border-border bg-background ${className ?? ""}`}>
      <div className="flex flex-wrap items-center gap-1 border-b border-border p-1.5">
        <select
          value={headingValue}
          onChange={(e) => setHeading(e.target.value as HeadingChoice)}
          onMouseDown={(e) => e.stopPropagation()}
          className="text-xs border border-border rounded px-1.5 py-1 bg-background text-muted-foreground"
          title="Paragraph style"
        >
          <option value="paragraph">Paragraph</option>
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
        </select>
        <div className="w-px bg-border mx-1 self-stretch" />
        <ToolbarButton title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          B
        </ToolbarButton>
        <ToolbarButton title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <span className="italic">I</span>
        </ToolbarButton>
        <ToolbarButton title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <span className="underline">U</span>
        </ToolbarButton>
        <ToolbarButton title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <span className="line-through">S</span>
        </ToolbarButton>
        <ToolbarButton title="Highlight" active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight({ color: "#fef08a" }).run()}>
          <span className="bg-yellow-200 px-0.5">H</span>
        </ToolbarButton>
        <div className="w-px bg-border mx-1 self-stretch" />
        <ToolbarButton title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          • List
        </ToolbarButton>
        <ToolbarButton title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          1. List
        </ToolbarButton>
        <div className="w-px bg-border mx-1 self-stretch" />
        <ToolbarButton title="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          L
        </ToolbarButton>
        <ToolbarButton title="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          C
        </ToolbarButton>
        <ToolbarButton title="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          R
        </ToolbarButton>
        <div className="w-px bg-border mx-1 self-stretch" />
        <label className="flex items-center gap-1 px-1 text-xs text-muted-foreground" title="Text color">
          <input
            type="color"
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            className="w-5 h-5 border-0 p-0 bg-transparent cursor-pointer"
          />
        </label>
        <ToolbarButton
          title="Clear formatting"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        >
          Clear
        </ToolbarButton>
      </div>
      <EditorContent
        editor={editor}
        className={`prose prose-sm max-w-none p-3 min-h-[3rem] focus:outline-none ${editorClassName ?? ""}`}
        placeholder={placeholder}
      />
    </div>
  );
}
