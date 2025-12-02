"use client";

import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { Editor as EditorInstance } from "@tiptap/react";
import { cn } from "@/lib/utils";

type InlineSuggestionListProps = {
  filteredCanned: any[];
  filteredMembers: any[];
  filteredVariables: { key: string; label: string }[];
  editorRef: MutableRefObject<EditorInstance | null>;
  // Mentions
  mentionIndex: number;
  setShowMentions: Dispatch<SetStateAction<boolean>>;
  setMentionQuery: Dispatch<SetStateAction<string>>;
  mentionTriggerPosRef: MutableRefObject<number | null>;
  showMentions: boolean;
  // Canned
  cannedIndex: number;
  setShowCannedMenu: Dispatch<SetStateAction<boolean>>;
  setCannedQuery: Dispatch<SetStateAction<string>>;
  triggerPosRef: MutableRefObject<number | null>;
  showCannedMenu: boolean;
  // Variables
  showVariables: boolean;
  variableIndex: number;
  setShowVariables: Dispatch<SetStateAction<boolean>>;
  setVariableQuery: Dispatch<SetStateAction<string>>;
  variableTriggerPosRef: MutableRefObject<number | null>;
};

export function InlineSuggestionList({
  filteredCanned,
  filteredMembers,
  filteredVariables,
  editorRef,
  mentionIndex,
  setShowMentions,
  setMentionQuery,
  mentionTriggerPosRef,
  showMentions,
  cannedIndex,
  setShowCannedMenu,
  setCannedQuery,
  triggerPosRef,
  showCannedMenu,
  showVariables,
  setShowVariables,
  variableIndex,
  setVariableQuery,
  variableTriggerPosRef,
}: InlineSuggestionListProps) {
  const insertAndClose = (content: string, options: { type: "canned" | "mention" | "variable" }) => {
    const editor = editorRef.current;
    if (!editor) return;
    const sel = editor.state.selection;
    if (options.type === "canned") {
      const from = Math.max(1, (triggerPosRef.current ?? sel.from) - 1);
      const to = sel.from;
      editor
        .chain()
        .focus()
        .deleteRange({ from, to })
        .insertContent(content)
        .run();
      setShowCannedMenu(false);
      setCannedQuery("");
      triggerPosRef.current = null;
      return;
    }
    if (options.type === "mention") {
      const from = Math.max(1, (mentionTriggerPosRef.current ?? sel.from) - 1);
      const to = sel.from;
      editor
        .chain()
        .focus()
        .deleteRange({ from, to })
        .insertContent(content)
        .run();
      setShowMentions(false);
      setMentionQuery("");
      mentionTriggerPosRef.current = null;
      return;
    }
    const from = Math.max(1, (variableTriggerPosRef.current ?? sel.from) - 2);
    const to = sel.from;
    editor
      .chain()
      .focus()
      .deleteRange({ from, to })
      .insertContent(content)
      .run();
    setShowVariables(false);
    setVariableQuery("");
    variableTriggerPosRef.current = null;
  };

  return (
    <>
      {showCannedMenu && (filteredCanned?.length ?? 0) > 0 && (
        <div className="absolute bottom-12 left-0 z-10 max-h-64 w-[320px] overflow-auto rounded-md border bg-popover p-1 shadow-md">
          {filteredCanned.map((c, idx) => (
            <button
              className={cn(
                "flex w-full cursor-pointer items-center justify-start gap-2 rounded px-2 py-1 text-left text-xs hover:bg-muted",
                idx === cannedIndex && "bg-muted",
              )}
              key={c.id}
              onClick={() => insertAndClose(c.body || "", { type: "canned" })}
              type="button"
            >
              <span className="truncate font-medium">{c.name}</span>
            </button>
          ))}
        </div>
      )}

      {showMentions && filteredMembers.length > 0 && (
        <div className="absolute bottom-12 left-0 z-10 max-h-64 w-[320px] overflow-auto rounded-md border bg-popover p-1 shadow-md">
          {filteredMembers.map((m: any, idx: number) => (
            <button
              className={cn(
                "flex w-full cursor-pointer items-center justify-start gap-2 rounded px-2 py-1 text-left text-xs hover:bg-muted",
                idx === mentionIndex && "bg-muted",
              )}
              key={m.id}
              onClick={() => {
                const label = m.fullName || m.name || m.email || "user";
                insertAndClose(`@${label} `, { type: "mention" });
              }}
              type="button"
            >
              <span className="truncate font-medium">{m.fullName || m.name || m.email}</span>
            </button>
          ))}
        </div>
      )}

      {showVariables && filteredVariables.length > 0 && (
        <div className="absolute bottom-12 left-0 z-10 max-h-64 w-[320px] overflow-auto rounded-md border bg-popover p-1 shadow-md">
          {filteredVariables.map((v, idx: number) => (
            <button
              className={cn(
                "flex w-full cursor-pointer items-center justify-start gap-2 rounded px-2 py-1 text-left text-xs hover:bg-muted",
                idx === variableIndex && "bg-muted",
              )}
              key={v.key}
              onClick={() => insertAndClose(`{{${v.key}}}`, { type: "variable" })}
              type="button"
            >
              <span className="truncate font-medium">{v.label}</span>
              <span className="ml-auto text-[10px] text-muted-foreground">{`{{${v.key}}}`}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
