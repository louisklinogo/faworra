"use client";

import type { Editor as EditorInstance } from "@tiptap/react";
import type { MutableRefObject } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ComposerControlsProps = {
  canned?: any[];
  editorRef: MutableRefObject<EditorInstance | null>;
  execMacro: { mutate: (input: { threadId: string; macroId: string }) => void };
  macros?: any[];
  setSendKey: (value: "enter" | "mod+enter") => void;
  setText: (updater: (prev: string) => string) => void;
  sendKey: "enter" | "mod+enter";
  threadId: string | null;
  remaining: number;
};

export function ComposerControls({
  canned,
  editorRef,
  execMacro,
  macros,
  setSendKey,
  setText,
  sendKey,
  threadId,
  remaining,
}: ComposerControlsProps) {
  const onSelectCanned = (id: string) => {
    const item = (canned ?? []).find((c) => c.id === id);
    if (!item) return;
    if (editorRef.current) {
      editorRef.current.chain().focus().insertContent(item.body ?? "").run();
    } else {
      setText((prev) => (prev ? prev + "\n" : "") + (item.body ?? ""));
    }
  };

  const onRunMacro = (macroId: string) => {
    if (!threadId || !macroId) return;
    execMacro.mutate({ threadId, macroId });
  };

  return (
    <div className="flex flex-col gap-2 border-b px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Select onValueChange={(value: "enter" | "mod+enter") => setSendKey(value)} value={sendKey}>
          <SelectTrigger className="h-8 w-[160px] text-xs">
            <SelectValue placeholder="Send key" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="enter">Send: Enter</SelectItem>
            <SelectItem value="mod+enter">Send: Ctrl/Cmd+Enter</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-muted-foreground text-xs">{remaining.toLocaleString()} chars left</div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          onValueChange={(value: string) => {
            if (value === "__manage_macros__") {
              window.location.href = "/inbox/macros";
              return;
            }
            onSelectCanned(value);
          }}
          value="canned"
        >
          <SelectTrigger className="h-8 w-[200px] text-xs">
            <SelectValue placeholder="Insert canned response" />
          </SelectTrigger>
          <SelectContent>
            {(canned || []).map((c: any) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
            <div className="my-1 border-t" />
            <SelectItem value="__manage_macros__">Manage macros…</SelectItem>
          </SelectContent>
        </Select>

        {threadId && (macros?.length ?? 0) > 0 && (
          <Select onValueChange={onRunMacro} value="run-macro">
            <SelectTrigger className="h-8 w-[200px] text-xs">
              <SelectValue placeholder="Run macro" />
            </SelectTrigger>
            <SelectContent>
              {(macros || []).map((m: any) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
