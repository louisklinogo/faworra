"use client";

import dynamic from "next/dynamic";
import data from "@emoji-mart/data";
import { MdEmojiEmotions, MdAttachFile, MdMic, MdStop, MdSmartToy, MdArticle, MdVideoCall } from "react-icons/md";
import type { ComponentType, RefObject } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArticleSearchPopover, type ArticleSearchResult } from "./ArticleSearchPopover";

type EmojiPickerProps = { [key: string]: unknown };
const EmojiPicker = dynamic<EmojiPickerProps>(
  async () => (await import("@emoji-mart/react")).default as unknown as ComponentType<EmojiPickerProps>,
  { ssr: false },
);

type MinimalEmoji = { native?: string };

export type ComposerToolbarProps = {
  accountDisconnected: boolean;
  emojiOpen: boolean;
  setEmojiOpen: (open: boolean) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onPickFiles: () => void;
  onFileChange: React.ChangeEventHandler<HTMLInputElement>;
  uploading: boolean;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  recordSeconds: number;
  insertIntoEditor: (value: string) => void;
  templateProvider?: string | null;
  templatesDisabled?: boolean;
  onInsertTemplate: (value: string) => void;
  articleSearchDisabled?: boolean;
  onArticleSelect: (article: ArticleSearchResult) => void;
};

export function ComposerToolbar({
  accountDisconnected,
  emojiOpen,
  setEmojiOpen,
  fileInputRef,
  onPickFiles,
  onFileChange,
  uploading,
  isRecording,
  onStartRecording,
  onStopRecording,
  recordSeconds,
  insertIntoEditor,
  templateProvider,
  templatesDisabled,
  onInsertTemplate,
  articleSearchDisabled,
  onArticleSelect,
}: ComposerToolbarProps) {
  return (
    <div className="flex items-center gap-2">
      <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button disabled={accountDisconnected} size="icon" variant="ghost">
                <MdEmojiEmotions className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Emoji</p>
          </TooltipContent>
        </Tooltip>
        <PopoverContent align="start" className="w-[320px] p-2">
          <EmojiPicker
            data={data}
            onEmojiSelect={(v: unknown) => {
              const emoji = (v as MinimalEmoji)?.native || "";
              if (emoji) insertIntoEditor(emoji);
              setEmojiOpen(false);
            }}
            previewPosition="none"
            skinTonePosition="none"
            searchPosition="top"
            autoFocus
            theme="light"
          />
        </PopoverContent>
      </Popover>

      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <input
              className="hidden"
              multiple
              onChange={onFileChange}
              ref={fileInputRef}
              type="file"
            />
            <Button disabled={uploading} onClick={onPickFiles} size="icon" variant="ghost">
              <MdAttachFile className="h-5 w-5" />
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Attach image/video/document</p>
        </TooltipContent>
      </Tooltip>

      {/* Templates hidden for Chat channels; can be re-enabled per provider */}
      {templateProvider === "email" ? null : null}

      {templateProvider === "email" ? (
        <ArticleSearchPopover disabled={articleSearchDisabled || accountDisconnected} onSelect={onArticleSelect} />
      ) : null}

      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Button
              disabled={accountDisconnected}
              onClick={() => (isRecording ? onStopRecording() : onStartRecording())}
              size="icon"
              variant={isRecording ? "default" : "ghost"}
            >
              {isRecording ? <MdStop className="h-5 w-5" /> : <MdMic className="h-5 w-5" />}
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isRecording ? `Stop • ${recordSeconds}s` : "Record audio"}</p>
        </TooltipContent>
      </Tooltip>

      {/* AI Assistance chip */}
      <Button disabled={accountDisconnected} onClick={() => alert("AI assistance not configured")} size="sm" variant="secondary" className="rounded-full px-3">
        <MdSmartToy className="mr-2 h-4 w-4" /> AI Assist
      </Button>

      {/* Video Call */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Button disabled={accountDisconnected} onClick={() => alert("Video call not configured")} size="icon" variant="ghost">
              <MdVideoCall className="h-5 w-5" />
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Start video call</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
