"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { EditorInstance } from "../editor/InboxComposerEditor";
import {
  MdFormatBold,
  MdFormatItalic,
  MdFormatUnderlined,
  MdStrikethroughS,
  MdCode,
  MdFormatQuote,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdLink,
  MdUndo,
  MdRedo,
  MdFormatClear,
} from "react-icons/md";

type FormattingToolbarProps = {
  editor: EditorInstance | null;
};

export function FormattingToolbar({ editor }: FormattingToolbarProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!editor) return;
    const handler = () => setTick((t) => t + 1);
    editor.on("selectionUpdate", handler);
    editor.on("transaction", handler);
    return () => {
      editor.off("selectionUpdate", handler);
      editor.off("transaction", handler);
    };
  }, [editor]);

  if (!editor) return null;

  const is = (name: string, attrs?: any) => editor.isActive(name as any, attrs);
  const btn = (
    onClick: () => void,
    icon: ReactNode,
    active?: boolean,
    aria?: string,
  ) => (
    <Button
      aria-label={aria}
      className={active ? "bg-muted" : undefined}
      onClick={onClick}
      size="icon"
      type="button"
      variant="ghost"
    >
      {icon}
    </Button>
  );

  const doLink = () => {
    const href = typeof window !== "undefined" ? window.prompt("Link URL:") : "";
    if (!href) return;
    editor.chain().focus().setLink({ href, target: "_blank" }).run();
  };

  const clear = () => {
    editor.chain().focus().unsetAllMarks().clearNodes().run();
  };

  return (
    <div className="flex items-center gap-1 rounded-md border bg-background px-1 py-1">
      {btn(() => editor.chain().focus().toggleBold().run(), <MdFormatBold className="h-4 w-4" />, is("bold"), "Bold")}
      {btn(() => editor.chain().focus().toggleItalic().run(), <MdFormatItalic className="h-4 w-4" />, is("italic"), "Italic")}
      {btn(() => editor.chain().focus().toggleUnderline().run(), <MdFormatUnderlined className="h-4 w-4" />, is("underline"), "Underline")}
      {btn(() => editor.chain().focus().toggleStrike().run(), <MdStrikethroughS className="h-4 w-4" />, is("strike"), "Strikethrough")}
      <div className="mx-1 h-5 w-px bg-border" />
      {btn(() => editor.chain().focus().toggleCode().run(), <MdCode className="h-4 w-4" />, is("code"), "Inline code")}
      {btn(() => editor.chain().focus().toggleCodeBlock().run(), <MdCode className="h-4 w-4" />, is("codeBlock"), "Code block")}
      {btn(() => editor.chain().focus().toggleBlockquote().run(), <MdFormatQuote className="h-4 w-4" />, is("blockquote"), "Quote")}
      <div className="mx-1 h-5 w-px bg-border" />
      {btn(() => editor.chain().focus().toggleBulletList().run(), <MdFormatListBulleted className="h-4 w-4" />, is("bulletList"), "Bulleted list")}
      {btn(() => editor.chain().focus().toggleOrderedList().run(), <MdFormatListNumbered className="h-4 w-4" />, is("orderedList"), "Numbered list")}
      {btn(doLink, <MdLink className="h-4 w-4" />, is("link"), "Insert link")}
      <div className="mx-1 h-5 w-px bg-border" />
      {btn(() => editor.chain().focus().undo().run(), <MdUndo className="h-4 w-4" />, false, "Undo")}
      {btn(() => editor.chain().focus().redo().run(), <MdRedo className="h-4 w-4" />, false, "Redo")}
      {btn(clear, <MdFormatClear className="h-4 w-4" />, false, "Clear formatting")}
    </div>
  );
}

export default FormattingToolbar;
