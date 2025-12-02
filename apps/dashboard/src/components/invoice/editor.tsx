"use client";

import { Editor as BaseEditor } from "@/components/ui/editor";
import type { Editor as EditorInstance, JSONContent } from "@tiptap/react";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  initialContent?: JSONContent;
  className?: string;
  onChange?: (content?: JSONContent | null) => void;
  onBlur?: (content: JSONContent | null) => void;
  placeholder?: string;
  disablePlaceholder?: boolean;
  tabIndex?: number;
};

export function Editor({
  initialContent,
  className,
  onChange,
  onBlur,
  placeholder,
  disablePlaceholder = false,
  tabIndex,
}: Props) {
  const [isFocused, setIsFocused] = useState(false);
  const [content, setContent] = useState<JSONContent | null | undefined>(initialContent);

  const handleUpdate = useCallback(
    (editor: EditorInstance) => {
      const json = editor.getJSON();
      const newIsEmpty = editor.state.doc.textContent.length === 0;

      const next = newIsEmpty ? null : json;
      setContent(next);
      onChange?.(next);
    },
    [onChange],
  );

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.(content ?? null);
  }, [content, onBlur]);

  const showPlaceholder = !disablePlaceholder && !content && !isFocused;

  return (
    <BaseEditor
      className={cn(
        "font-mono text-[11px] leading-[18px] text-primary invoice-editor",
        showPlaceholder &&
          "w-full bg-[repeating-linear-gradient(-60deg,#DBDBDB,#DBDBDB_1px,transparent_1px,transparent_5px)] dark:bg-[repeating-linear-gradient(-60deg,#2C2C2C,#2C2C2C_1px,transparent_1px,transparent_5px)]",
        className,
      )}
      placeholder={placeholder}
      initialContent={content ?? undefined}
      onUpdate={handleUpdate}
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
      tabIndex={tabIndex}
    />
  );
}
