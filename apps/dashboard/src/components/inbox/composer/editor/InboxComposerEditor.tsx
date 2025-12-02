"use client";

import type { ClipboardEventHandler, KeyboardEventHandler } from "react";
import type { Editor as EditorInstance, JSONContent } from "@tiptap/react";
import { EditorContent, useEditor } from "@tiptap/react";
import { createComposerExtensions } from "./extensions";

type InboxComposerEditorProps = {
  initialContent?: JSONContent | string;
  placeholder?: string;
  className?: string;
  tabIndex?: number;
  onReady?: (editor: EditorInstance) => void;
  onUpdate?: (editor: EditorInstance) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
  onPaste?: ClipboardEventHandler<HTMLDivElement>;
};

export function InboxComposerEditor({
  initialContent,
  placeholder,
  className,
  tabIndex,
  onReady,
  onUpdate,
  onFocus,
  onBlur,
  onKeyDown,
  onPaste,
}: InboxComposerEditorProps) {
  const editor = useEditor({
    extensions: createComposerExtensions({ placeholder }),
    content: initialContent,
    immediatelyRender: false,
    onCreate: ({ editor }) => {
      onReady?.(editor);
    },
    onUpdate: ({ editor }) => {
      onUpdate?.(editor);
    },
    onFocus,
    onBlur,
  });

  if (!editor) return null;

  return (
    <EditorContent
      className={className}
      editor={editor}
      tabIndex={tabIndex}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
    />
  );
}

export type { EditorInstance };
