"use client";

import "./styles.css";

import type React from "react";
import {
  EditorContent,
  type Editor as EditorInstance,
  type JSONContent,
  useEditor,
} from "@tiptap/react";
import { BubbleMenu } from "./extentions/bubble-menu";
import { registerExtensions } from "./extentions/register";

type EditorProps = {
  initialContent?: JSONContent | string;
  placeholder?: string;
  onUpdate?: (editor: EditorInstance) => void;
  onReady?: (editor: EditorInstance) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  className?: string;
  tabIndex?: number;
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
  onPaste?: React.ClipboardEventHandler<HTMLDivElement>;
};

export function Editor({
  initialContent,
  placeholder,
  onUpdate,
  onReady,
  onBlur,
  onFocus,
  className,
  tabIndex,
  onKeyDown,
  onPaste,
}: EditorProps) {
  const editor = useEditor({
    extensions: registerExtensions({ placeholder }),
    content: initialContent,
    immediatelyRender: false,
    onCreate: ({ editor }) => {
      onReady?.(editor);
    },
    onBlur,
    onFocus,
    onUpdate: ({ editor }) => {
      onUpdate?.(editor);
    },
  });

  if (!editor) return null;

  return (
    <>
      <EditorContent
        className={className}
        editor={editor}
        tabIndex={tabIndex}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
      />
      <BubbleMenu editor={editor} />
    </>
  );
}
