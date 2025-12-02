"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Editor as EditorInstance } from "@tiptap/react";
import { MdClose } from "react-icons/md";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/tag-input";
import { trpc } from "@/lib/trpc/client";
import { createBrowserClient } from "@Faworra/supabase/client";
import { useRealtimeMessages } from "@/hooks/use-realtime-messages";
import { useRealtime } from "@/components/realtime/RealtimeProvider";
// Removed ComposerControls to match Chatwoot footer (no mid controls row)
import { AttachmentList } from "./components/attachment-list";
import { InlineSuggestionList } from "./components/inline-suggestion-list";
import { InboxComposerEditor } from "./editor/InboxComposerEditor";
import FormattingToolbar from "./components/FormattingToolbar";
import { ComposerFooter } from "./components/ComposerFooter";
import type { ComposerToolbarProps } from "./components/ComposerToolbar";
import type { ArticleSearchResult } from "./components/ArticleSearchPopover";
import { ComposerTopPanel } from "./components/ComposerTopPanel";
import { EmailHeaderRow } from "./components/EmailHeaderRow";
import { SignatureManagerDialog, type SignatureTemplate } from "./components/SignatureManagerDialog";
import { SignaturePreview } from "./components/SignaturePreview";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

type ComposerProps = {
  threadId: string | null;
  accountDisconnected: boolean;
  platform?: "whatsapp" | "instagram" | string | null;
  contactEmail?: string | null;
};

export function Composer({ threadId, accountDisconnected, platform, contactEmail }: ComposerProps) {
  const SIGNATURE_ENABLED_KEY = "inbox:signatureEnabled";
  const SIGNATURES_KEY = "inbox:signatures";
  const LEGACY_SIGNATURE_TEXT_KEY = "inbox:signatureText";
  const ACTIVE_SIGNATURE_KEY = "inbox:activeSignatureId";
  const CC_BANNER_KEY = "inbox:composerCcBanner";
  const QUOTED_BANNER_KEY = "inbox:composerQuotedBanner";
  const POPOUT_KEY = "inbox:composerPopout";
  const DEFAULT_SIGNATURE = "Best regards,\nTeam Faworra";

  const [text, setText] = useState("");
  const [showPrivate, setShowPrivate] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadXhrs, setUploadXhrs] = useState<Record<string, XMLHttpRequest>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editorRef = useRef<EditorInstance | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [showCannedMenu, setShowCannedMenu] = useState(false);
  const [cannedIndex, setCannedIndex] = useState(0);
  const [cannedQuery, setCannedQuery] = useState("");
  const triggerPosRef = useRef<number | null>(null);
  const { toast } = useToast();
  const [signatureEnabled, setSignatureEnabled] = useState(false);
  const [signatures, setSignatures] = useState<SignatureTemplate[]>([]);
  const [activeSignatureId, setActiveSignatureId] = useState<string | null>(null);
  const [signatureManagerOpen, setSignatureManagerOpen] = useState(false);
  const [showCcBanner, setShowCcBanner] = useState(false);
  const [showQuotedBanner, setShowQuotedBanner] = useState(false);
  const [toRecipients, setToRecipients] = useState<string[]>([]);
  const [ccRecipients, setCcRecipients] = useState<string[]>([]);
  const [bccRecipients, setBccRecipients] = useState<string[]>([]);
  const [quotedBody, setQuotedBody] = useState("");
  const [subject, setSubject] = useState("");
  const [isPopout, setIsPopout] = useState(false);
  const previousBodyOverflowRef = useRef<string | null>(null);
  const { socket } = useRealtime();

  const sendMessage = trpc.communications.messages.send.useMutation();
  const { data: canned } = trpc.communications.canned.list.useQuery();
  const { data: members = [] } = trpc.transactions.members.useQuery();
  const { data: macros = [] } = trpc.communications.macros.list.useQuery();
  const execMacro = trpc.communications.macros.execute.useMutation();
  const isEmail = platform === "email";
  const { messages } = useRealtimeMessages(threadId);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedEnabled = localStorage.getItem(SIGNATURE_ENABLED_KEY);
      if (storedEnabled != null) setSignatureEnabled(storedEnabled === "1");

      const storedSignaturesRaw = localStorage.getItem(SIGNATURES_KEY);
      let initialSignatures: SignatureTemplate[] = [];
      if (storedSignaturesRaw) {
        const parsed = JSON.parse(storedSignaturesRaw);
        if (Array.isArray(parsed)) {
          initialSignatures = parsed
            .filter((sig) => sig && typeof sig.id === "string" && typeof sig.label === "string" && typeof sig.text === "string")
            .map((sig) => ({
              id: sig.id as string,
              label: sig.label as string,
              text: sig.text as string,
              updatedAt: typeof sig.updatedAt === "number" ? (sig.updatedAt as number) : Date.now(),
            }));
        }
      }

      if (initialSignatures.length === 0) {
        const legacySignature = localStorage.getItem(LEGACY_SIGNATURE_TEXT_KEY) || DEFAULT_SIGNATURE;
        initialSignatures = [
          {
            id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
            label: "Default",
            text: legacySignature,
            updatedAt: Date.now(),
          },
        ];
      }
      setSignatures(initialSignatures);

      const storedActiveSignature = localStorage.getItem(ACTIVE_SIGNATURE_KEY);
      if (storedActiveSignature && initialSignatures.some((sig) => sig.id === storedActiveSignature)) {
        setActiveSignatureId(storedActiveSignature);
      } else {
        setActiveSignatureId(initialSignatures[0]?.id ?? null);
      }

      const storedCc = localStorage.getItem(CC_BANNER_KEY);
      if (storedCc != null) setShowCcBanner(storedCc === "1");
      const storedQuoted = localStorage.getItem(QUOTED_BANNER_KEY);
      if (storedQuoted != null) setShowQuotedBanner(storedQuoted === "1");
      const storedPopout = localStorage.getItem(POPOUT_KEY);
      if (storedPopout === "1") setIsPopout(true);
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(SIGNATURE_ENABLED_KEY, signatureEnabled ? "1" : "0");
    } catch {}
  }, [signatureEnabled]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(SIGNATURES_KEY, JSON.stringify(signatures));
    } catch {}
  }, [signatures]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (activeSignatureId) {
        localStorage.setItem(ACTIVE_SIGNATURE_KEY, activeSignatureId);
      } else {
        localStorage.removeItem(ACTIVE_SIGNATURE_KEY);
      }
    } catch {}
  }, [activeSignatureId]);

  useEffect(() => {
    if (signatures.length === 0) {
      setActiveSignatureId(null);
      if (signatureEnabled) setSignatureEnabled(false);
      return;
    }
    if (!activeSignatureId || !signatures.some((sig) => sig.id === activeSignatureId)) {
      setActiveSignatureId(signatures[0]?.id ?? null);
    }
  }, [signatures, activeSignatureId, signatureEnabled]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(CC_BANNER_KEY, showCcBanner ? "1" : "0");
      localStorage.setItem(QUOTED_BANNER_KEY, showQuotedBanner ? "1" : "0");
    } catch {}
  }, [showCcBanner, showQuotedBanner]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(POPOUT_KEY, isPopout ? "1" : "0");
    } catch {}
  }, [isPopout]);

  useEffect(() => {
    setSubject("");
  }, [threadId, isEmail]);

  // Prefill recipients and quoted content for email threads
  useEffect(() => {
    if (!threadId || !isEmail || showPrivate) return;
    // Prefill "To" from contact if available
    if (contactEmail && toRecipients.length === 0) {
      const email = contactEmail.trim();
      if (EMAIL_REGEX.test(email)) setToRecipients([email]);
    }
    // Prefill CC/BCC from last outbound email
    const msgs = Array.isArray(messages) ? messages : [];
    const lastOut = [...msgs].reverse().find((m) => m.direction === "out" && !m.meta?.privateNote && (m.meta?.cc || m.meta?.bcc));
    if (lastOut?.meta?.cc && ccRecipients.length === 0) setCcRecipients(lastOut.meta.cc);
    if (lastOut?.meta?.bcc && bccRecipients.length === 0) setBccRecipients(lastOut.meta.bcc);
    // Prefill quoted body from last inbound
    const lastIn = [...msgs].reverse().find((m) => m.direction === "in" && !m.meta?.privateNote && m.content && m.content.trim());
    if (lastIn && !quotedBody) {
      setQuotedBody(lastIn.content.trim());
      setShowQuotedBanner(true);
    }
  }, [threadId, isEmail, showPrivate, contactEmail, messages]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const body = document.body;
    if (isPopout) {
      previousBodyOverflowRef.current = body.style.overflow;
      body.style.overflow = "hidden";
      return () => {
        body.style.overflow = previousBodyOverflowRef.current ?? "";
      };
    }
    body.style.overflow = previousBodyOverflowRef.current ?? "";
    return () => {
      body.style.overflow = previousBodyOverflowRef.current ?? "";
    };
  }, [isPopout]);

  const filteredCanned = useMemo(() => {
    const list = canned || [];
    if (!showCannedMenu) return list;
    const q = cannedQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c: any) => {
      const name = (c.name || "").toLowerCase();
      const body = (c.body || "").toLowerCase();
      return name.includes(q) || body.includes(q);
    });
  }, [canned, cannedQuery, showCannedMenu]);

  const activeSignature = useMemo(() => {
    if (!activeSignatureId) return null;
    return signatures.find((sig) => sig.id === activeSignatureId) ?? null;
  }, [activeSignatureId, signatures]);
  const signatureText = activeSignature?.text ?? "";
  const signatureLabel = activeSignature?.label ?? "";
  const [html, setHtml] = useState("");

  const buildMessageWithSignature = useCallback(
    (base: string) => {
      const trimmedBase = base.trim();
      if (!signatureEnabled) return trimmedBase;
      const signatureBody = signatureText.trim();
      if (!signatureBody) return trimmedBase;
      if (!trimmedBase) return signatureBody;
      return `${trimmedBase}\n\n${signatureBody}`;
    },
    [signatureEnabled, signatureText],
  );

  const [sendKey, setSendKey] = useState<"enter" | "mod+enter">(() => {
    try {
      const v = localStorage.getItem("inbox:sendKey");
      return v === "mod+enter" ? "mod+enter" : "enter";
    } catch {
      return "enter";
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("inbox:sendKey", sendKey);
    } catch {}
  }, [sendKey]);

  const updateTextFromControls = useCallback(
    (updater: (prev: string) => string) => {
      setText((prev) => updater(prev));
    },
    [],
  );

  const maxLength = useMemo(() => {
    if (platform === "whatsapp") return 4096;
    if (platform === "instagram") return 1000;
    return 4096;
  }, [platform]);
  const finalMessagePreview = useMemo(() => buildMessageWithSignature(text), [text, buildMessageWithSignature]);
  const remaining = Math.max(0, maxLength - finalMessagePreview.length);

  const [showMentions, setShowMentions] = useState(false);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState("");
  const mentionTriggerPosRef = useRef<number | null>(null);
  const filteredMembers = useMemo(() => {
    const list: any[] = Array.isArray(members) ? (members as any[]) : [];
    if (!showMentions) return list;
    const q = mentionQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((m: any) => {
      const name = (m.fullName || m.name || "").toLowerCase();
      const email = (m.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [members, mentionQuery, showMentions]);

  const VARIABLE_CATALOG = [
    { key: "contact_name", label: "Contact name" },
    { key: "team_name", label: "Team name" },
    { key: "today_date", label: "Today (date)" },
  ];
  const [showVariables, setShowVariables] = useState(false);
  const [variableIndex, setVariableIndex] = useState(0);
  const [variableQuery, setVariableQuery] = useState("");
  const variableTriggerPosRef = useRef<number | null>(null);
  const filteredVariables = useMemo(() => {
    if (!showVariables) return VARIABLE_CATALOG;
    const q = variableQuery.trim().toLowerCase();
    if (!q) return VARIABLE_CATALOG;
    return VARIABLE_CATALOG.filter((v) => v.key.includes(q) || v.label.toLowerCase().includes(q));
  }, [variableQuery, showVariables]);
  const lastKeyWasBraceRef = useRef(false);


  const typingChannelRef = useRef<RealtimeChannel | null>(null);
  const typingIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const myPresenceKeyRef = useRef<string>("anonymous");

  useEffect(() => {
    if (!threadId) return;
    const supabase = createBrowserClient();
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const uid = data.user?.id || `anon-${Math.random().toString(36).slice(2)}`;
        myPresenceKeyRef.current = uid;
        const channel = supabase.channel(`typing:thread:${threadId}`, {
          config: { presence: { key: uid } },
        });
        typingChannelRef.current = channel;
        await channel.subscribe();
        channel.track({ typing: false });
      } catch {}
    })();
    return () => {
      if (typingIdleTimerRef.current) {
        clearTimeout(typingIdleTimerRef.current);
        typingIdleTimerRef.current = null;
      }
      try {
        typingChannelRef.current?.unsubscribe();
      } catch {}
      typingChannelRef.current = null;
    };
  }, [threadId]);

  const signalTyping = () => {
    const ch = typingChannelRef.current;
    if (!ch) return;
    try {
      ch.track({ typing: true });
      if (typingIdleTimerRef.current) clearTimeout(typingIdleTimerRef.current);
      typingIdleTimerRef.current = setTimeout(() => {
        try {
          ch.track({ typing: false });
        } catch {}
        try { if (socket && threadId) (socket as any).emit?.("typing.stop", threadId); } catch {}
      }, 3000);
    } catch {}
    try { if (socket && threadId) (socket as any).emit?.("typing.start", threadId); } catch {}
  };

  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const [previews, setPreviews] = useState<Record<string, string>>({});
  useEffect(() => {
    const next: Record<string, string> = {};
    const keys: string[] = [];
    attachments.forEach((f) => {
      if (f && f.type?.startsWith("image/")) {
        const key = `${f.name}-${f.lastModified}`;
        keys.push(key);
        if (!previews[key]) {
          next[key] = URL.createObjectURL(f);
        } else {
          next[key] = previews[key];
        }
      }
    });
    setPreviews(next);
    return () => {
      Object.entries(previews).forEach(([k, url]) => {
        if (!next[k]) URL.revokeObjectURL(url);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachments]);

  const stopTimer = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
  };

  const handleFiles = (files: File[]) => {
    if (!files.length) return;
    const isAllowedType = (file: File) => {
      const t = file.type || "";
      return (
        t.startsWith("image/") ||
        t.startsWith("video/") ||
        t.startsWith("audio/") ||
        t === "application/pdf" ||
        t === "text/plain"
      );
    };
    const allowed = files.filter(isAllowedType).filter((f) => f.size <= 15 * 1024 * 1024);
    const rejected = files.filter((f) => !isAllowedType(f) || f.size > 15 * 1024 * 1024);
    if (rejected.length) {
      toast({ title: "Some files skipped", description: `${rejected.length} not accepted (type/size)` });
    }
    if (allowed.length) setAttachments((prev) => [...prev, ...allowed]);
  };

  const startRecording = async () => {
    if (accountDisconnected || isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recordedChunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        stopTimer();
        setIsRecording(false);
        try {
          const blob = new Blob(recordedChunksRef.current, { type: "audio/webm" });
          const file = new File([blob], `recording-${Date.now()}.webm`, { type: "audio/webm" });
          handleFiles([file]);
        } catch (err) {
          console.error("Failed to create audio file", err);
          toast({ title: "Recording error", description: "Could not save audio." });
        }
        stream.getTracks().forEach((t) => t.stop());
        setRecordSeconds(0);
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecording(true);
      setRecordSeconds(0);
      stopTimer();
      recordTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch (err) {
      console.error("Mic permission/record error", err);
      toast({ title: "Microphone not available", description: "Check browser permissions and try again." });
    }
  };

  const stopRecording = () => {
    try {
      mediaRecorderRef.current?.stop();
    } catch {}
  };

  useEffect(() => () => {
    stopTimer();
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!threadId) return;
    const key = `inbox:thread:${threadId}:draft`;
    const saved = localStorage.getItem(key);
    if (saved) setText(saved);
    return () => {
      const val = text.trim();
      if (val) localStorage.setItem(key, val);
      else localStorage.removeItem(key);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);
  useEffect(() => {
    if (!threadId) return;
    const key = `inbox:thread:${threadId}:draft`;
    const h = setTimeout(() => {
      const val = text.trim();
      if (val) localStorage.setItem(key, val);
      else localStorage.removeItem(key);
    }, 300);
    return () => clearTimeout(h);
  }, [text, threadId]);

  const insertIntoEditor = (val: string) => {
    const ed = editorRef.current;
    if (!ed) {
      setText((prev) => prev + val);
      return;
    }
    ed.chain().focus().insertContent(val).run();
    setText(ed.getText());
  };

  const removeAttachmentAt = (idx: number) => {
    const file = attachments[idx];
    const key = `${file.name}-${file.lastModified}`;
    const xhr = uploadXhrs[key];
    if (uploading && xhr) {
      try {
        xhr.abort();
      } catch {}
      setUploadXhrs((m) => {
        const n = { ...m };
        delete n[key];
        return n;
      });
    }
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadFile = async (file: File) => {
    return new Promise<{ path: string; filename?: string }>((resolve, reject) => {
      const form = new FormData();
      form.append("file", file, file.name);

      const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const xhr = new XMLHttpRequest();
      const key = `${file.name}-${file.lastModified}`;
      const t = toast({ title: "Uploading…", description: file.name, progress: 0 });
      xhr.upload.onprogress = (evt) => {
        if (!evt.lengthComputable) return;
        const pct = Math.round((evt.loaded / evt.total) * 100);
        setUploadProgress((p) => ({ ...p, [key]: pct }));
        t.update({ id: t.id, title: "Uploading…", description: file.name, progress: pct });
      };
      xhr.onerror = () => {
        t.update({ id: t.id, title: "Upload failed", description: file.name });
        setUploadXhrs((m) => {
          const n = { ...m };
          delete n[key];
          return n;
        });
        reject(new Error("Upload failed"));
      };
      xhr.onload = () => {
        try {
          const upJson = JSON.parse(xhr.responseText);
          t.update({ id: t.id, title: "Uploaded", description: file.name, progress: 100 });
          resolve({ path: upJson.path, filename: upJson.filename || file.name });
        } catch (e) {
          t.update({ id: t.id, title: "Upload failed", description: file.name });
          reject(e);
        }
      };
      xhr.open("POST", `${base}/communications/uploads`);
      xhr.send(form);
      setUploadXhrs((m) => ({ ...m, [key]: xhr }));
    });
  };

  const resetComposerState = () => {
    setText("");
    setShowCannedMenu(false);
    setShowMentions(false);
    setShowVariables(false);
    setCannedQuery("");
    setMentionQuery("");
    setVariableQuery("");
    triggerPosRef.current = null;
    mentionTriggerPosRef.current = null;
    variableTriggerPosRef.current = null;
    if (editorRef.current) editorRef.current.commands.setContent("");
    setAttachments([]);
    setCcRecipients([]);
    setBccRecipients([]);
    setQuotedBody("");
    setSubject("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const send = async () => {
    if (!threadId) return;

    const decoratedText = buildMessageWithSignature(text);
    const meta: Record<string, unknown> = {};
    if (!showPrivate) {
      if (isEmail) {
        const subjectValue = subject.trim();
        if (!subjectValue) {
          toast({ title: "Subject required", description: "Add a subject before sending an email reply." });
          return;
        }
        meta.subject = subjectValue;
        if (toRecipients.length) (meta as any).to = toRecipients;
        if (ccRecipients.length) (meta as any).cc = ccRecipients;
        if (bccRecipients.length) (meta as any).bcc = bccRecipients;
      }
      if (showQuotedBanner && quotedBody.trim()) {
        const quoted = quotedBody.trim();
        meta.quotedHtml = quoted;
        meta.quotedText = quoted;
      }
    }
    if (signatureEnabled && activeSignature && signatureText) {
      meta.signature = {
        id: activeSignature.id,
        label: signatureLabel || undefined,
        text: signatureText,
      };
    }
    const metaPayload = Object.keys(meta).length ? meta : undefined;

    if (isEmail && attachments.length > 0) {
      toast({ title: "Attachments not supported yet", description: "Email attachments are not yet supported in this composer." });
      return;
    }

    if (attachments.length > 0) {
      try {
        setUploading(true);
        const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

        for (let i = 0; i < attachments.length; i++) {
          const file = attachments[i];
          const mediaType = file.type.startsWith("image/")
            ? "image"
            : file.type.startsWith("video/")
              ? "video"
              : file.type.startsWith("audio/")
                ? "audio"
                : "document";

          const upJson = await uploadFile(file);

          const clientMessageId = (crypto as Crypto).randomUUID?.() ?? Math.random().toString(36).slice(2);

          const res = await fetch(`${base}/communications/threads/${threadId}/send-media`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mediaPath: upJson.path,
              mediaType,
              filename: upJson.filename || file.name,
              caption: (() => {
                if (i !== 0) return undefined;
                if (!decoratedText) return undefined;
                if (decoratedText.length <= maxLength) return decoratedText;
                toast({
                  title: "Caption too long",
                  description: `Dropping caption over ${maxLength} chars for this channel`,
                });
                return undefined;
              })(),
              clientMessageId,
              ...(metaPayload && i === 0 ? { meta: metaPayload } : {}),
            }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({} as unknown));
            throw new Error((err as { error?: string }).error || `Failed to send media (${res.status})`);
          }
        }

        resetComposerState();
      } catch (err) {
        console.error("Failed to send media:", err);
        toast({ title: "Failed to send media", description: String(err || "") });
      } finally {
        setUploading(false);
      }
      return;
    }

    if (!decoratedText) return;
    if (decoratedText.length > maxLength) {
      toast({ title: "Message too long", description: `Limit is ${maxLength} characters for this channel.` });
      return;
    }
    const clientMessageId = (crypto as Crypto).randomUUID?.() ?? Math.random().toString(36).slice(2);
    try {
      const payload: Parameters<typeof sendMessage.mutateAsync>[0] = {
        threadId,
        text: decoratedText,
        clientMessageId,
        privateNote: showPrivate,
        ...(metaPayload ? { meta: metaPayload } : {}),
      };
      // Adhere to MessageMetaSchema (no html field at present)
      await sendMessage.mutateAsync(payload);
      resetComposerState();
    } catch (err) {
      console.error("Failed to send message:", err);
      toast({ title: "Failed to send", description: String(err || "") });
    }
  };

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    handleFiles(Array.from(event.target.files || []));
    const input = event.target as HTMLInputElement | null;
    if (input) {
      try {
        input.value = "";
      } catch {}
    }
  };

  // No mid controls row (send key/canned/macro) for Chatwoot parity

  const toolbarProps: ComposerToolbarProps = {
    accountDisconnected,
    emojiOpen,
    setEmojiOpen,
    fileInputRef,
    onPickFiles: () => fileInputRef.current?.click(),
    onFileChange,
    uploading,
    isRecording,
    onStartRecording: startRecording,
    onStopRecording: stopRecording,
    recordSeconds,
    insertIntoEditor,
    templateProvider: platform ?? undefined,
    templatesDisabled: !threadId,
    onInsertTemplate: (value: string) => {
      if (!value) return;
      const needsNewline = value.endsWith("\n") ? value : `${value}\n`;
      insertIntoEditor(needsNewline);
    },
    articleSearchDisabled: !threadId,
    onArticleSelect: (article: ArticleSearchResult) => {
      const parts = [article.title.trim()].filter(Boolean);
      if (article.summary) parts.push(article.summary.trim());
      if (article.url) parts.push(article.url.trim());
      const payload = parts.join("\n");
      if (payload) insertIntoEditor(`${payload}\n`);
    },
  };

  const applyEmailList = useCallback(
    (values: string[], setter: (next: string[]) => void) => {
      const normalized = values.map((value) => value.trim()).filter(Boolean);
      const unique = Array.from(new Set(normalized.map((value) => value.toLowerCase())));
      const invalid = unique.filter((email) => !EMAIL_REGEX.test(email));
      if (invalid.length) {
        toast({ title: "Invalid email", description: `Removed invalid addresses: ${invalid.join(", ")}` });
      }
      const valid = unique.filter((email) => EMAIL_REGEX.test(email));
      setter(valid);
    },
    [toast],
  );

  const updateCcRecipients = useCallback(
    (values: string[]) => {
      applyEmailList(values, setCcRecipients);
    },
    [applyEmailList],
  );

  const updateToRecipients = useCallback(
    (values: string[]) => {
      applyEmailList(values, setToRecipients);
    },
    [applyEmailList],
  );

  const updateBccRecipients = useCallback(
    (values: string[]) => {
      applyEmailList(values, setBccRecipients);
    },
    [applyEmailList],
  );

  const handleModeChange = useCallback(
    (mode: "public" | "private") => {
      setShowPrivate(mode === "private");
    },
    [],
  );

  const toggleCcBanner = useCallback(() => {
    setShowCcBanner((prev) => !prev);
  }, []);

  const toggleQuotedBanner = useCallback(() => {
    setShowQuotedBanner((prev) => !prev);
  }, []);

  const handleSignatureChange = useCallback(
    (enabled: boolean) => {
      if (enabled) {
        if (!signatures.length) {
          setSignatureManagerOpen(true);
          return;
        }
        if (!activeSignatureId && signatures[0]) {
          setActiveSignatureId(signatures[0].id);
        }
      }
      setSignatureEnabled(enabled);
    },
    [activeSignatureId, signatures],
  );

  const handlePopoutToggle = useCallback(() => {
    setIsPopout((prev) => !prev);
  }, []);

  const handleSignatureSelect = useCallback(
    (id: string | null) => {
      if (!id) return;
      if (!signatures.some((sig) => sig.id === id)) return;
      setActiveSignatureId(id);
    },
    [signatures],
  );

  const handleSignatureManagerSave = useCallback(
    (next: SignatureTemplate[]) => {
      setSignatures(next);
      if (next.length === 0) {
        setActiveSignatureId(null);
        setSignatureEnabled(false);
      } else if (!next.some((sig) => sig.id === activeSignatureId)) {
        setActiveSignatureId(next[0].id);
      }
    },
    [activeSignatureId],
  );

  const composerCard = (
    <div className="rounded-lg border bg-background shadow-sm">
      <ComposerTopPanel
        ccActive={showCcBanner}
        isPopout={isPopout}
        onModeChange={handleModeChange}
        onOpenSignatureManager={() => setSignatureManagerOpen(true)}
        onSelectSignature={handleSignatureSelect}
        onSignatureChange={handleSignatureChange}
        onToggleCc={toggleCcBanner}
        onTogglePopout={handlePopoutToggle}
        onToggleQuoted={toggleQuotedBanner}
        quotedActive={showQuotedBanner}
        showPrivate={showPrivate}
        showSubjectField={isEmail && !showPrivate}
        signatureEnabled={signatureEnabled}
        signatures={signatures.map((sig) => ({ id: sig.id, label: sig.label }))}
        selectedSignatureId={activeSignatureId}
        subject={subject}
        onSubjectChange={setSubject}
      />

      {/* Mid controls removed for Chatwoot parity */}

      {isEmail && !showPrivate ? (
        <EmailHeaderRow
          to={toRecipients}
          cc={ccRecipients}
          bcc={bccRecipients}
          onToChange={updateToRecipients}
          onCcChange={updateCcRecipients}
          onBccChange={updateBccRecipients}
        />
      ) : null}

      <div className="space-y-3 border-t px-3 py-3">
        <FormattingToolbar editor={editorRef.current} />
        {isEmail && showCcBanner && (
          <div className="space-y-3 rounded-md border border-dashed border-yellow-400/60 bg-yellow-50/40 p-3 dark:border-yellow-500/40 dark:bg-yellow-950/30">
            <Alert className="flex items-start justify-between gap-3" variant="warning">
              <div>
                <AlertTitle>CC & BCC enabled</AlertTitle>
                <AlertDescription>
                  Additional recipients will receive copies once email routing is configured. Manage recipients
                  from the conversation header.
                </AlertDescription>
              </div>
              <Button aria-label="Dismiss CC/BCC banner" onClick={() => setShowCcBanner(false)} size="icon" variant="ghost">
                <MdClose className="h-4 w-4" />
              </Button>
            </Alert>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">CC recipients</p>
                <TagInput
                  onChange={updateCcRecipients}
                  placeholder="Add CC email addresses"
                  value={ccRecipients}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">BCC recipients</p>
                <TagInput
                  onChange={updateBccRecipients}
                  placeholder="Add BCC email addresses"
                  value={bccRecipients}
                />
              </div>
            </div>
          </div>
        )}

        {isEmail && showQuotedBanner && (
          <div className="space-y-3 rounded-md border border-dashed border-muted-foreground/30 bg-muted/40 p-3">
            <Alert className="flex items-start justify-between gap-3" variant="default">
              <div>
                <AlertTitle>Quoted email included</AlertTitle>
                <AlertDescription>
                  The original customer message will be embedded below your reply. Edit or clear the quoted
                  content before sending.
                </AlertDescription>
              </div>
              <Button aria-label="Dismiss quoted banner" onClick={() => setShowQuotedBanner(false)} size="icon" variant="ghost">
                <MdClose className="h-4 w-4" />
              </Button>
            </Alert>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Quoted email</p>
              <Textarea
                rows={4}
                onChange={(event) => setQuotedBody(event.target.value)}
                placeholder="> Customer wrote..."
                value={quotedBody}
              />
            </div>
          </div>
        )}

        <AttachmentList
          attachments={attachments}
          previews={previews}
          uploadProgress={uploadProgress}
          uploading={uploading}
          onRemove={removeAttachmentAt}
        />

        <div className="relative">
          <InboxComposerEditor
            className="tiptap rounded border px-3 py-3 text-sm min-h-[140px]"
            initialContent={text}
            placeholder={"Shift + enter for new line. Start with '/' to select a Canned Response."}
            onReady={(ed) => {
              editorRef.current = ed;
              if (text && ed.getText() !== text) {
                ed.commands.setContent(text);
              }
            }}
            onUpdate={(ed) => {
              setText(ed.getText());
              try { setHtml(ed.getHTML()); } catch {}
              signalTyping();
              if (showCannedMenu && editorRef.current) {
                const sel = editorRef.current.state.selection;
                if (triggerPosRef.current == null) {
                  triggerPosRef.current = sel.from;
                }
                if (sel.from <= (triggerPosRef.current ?? sel.from)) {
                  setShowCannedMenu(false);
                  setCannedQuery("");
                  triggerPosRef.current = null;
                  return;
                }
                const from = Math.max(1, triggerPosRef.current);
                const to = sel.from;
                try {
                  const q = editorRef.current.state.doc.textBetween(from, to);
                  setCannedQuery(q);
                } catch {
                  setCannedQuery("");
                }
              }
              if (showMentions && editorRef.current) {
                const sel = editorRef.current.state.selection;
                if (mentionTriggerPosRef.current == null) {
                  mentionTriggerPosRef.current = sel.from;
                }
                if (sel.from <= (mentionTriggerPosRef.current ?? sel.from)) {
                  setShowMentions(false);
                  setMentionQuery("");
                  mentionTriggerPosRef.current = null;
                  return;
                }
                const from = Math.max(1, mentionTriggerPosRef.current);
                const to = sel.from;
                try {
                  const q = editorRef.current.state.doc.textBetween(from, to);
                  setMentionQuery(q);
                } catch {
                  setMentionQuery("");
                }
              }
              if (showVariables && editorRef.current) {
                const sel = editorRef.current.state.selection;
                if (variableTriggerPosRef.current == null) {
                  variableTriggerPosRef.current = sel.from;
                }
                if (sel.from <= (variableTriggerPosRef.current ?? sel.from)) {
                  setShowVariables(false);
                  setVariableQuery("");
                  variableTriggerPosRef.current = null;
                  return;
                }
                const from = Math.max(1, variableTriggerPosRef.current);
                const to = sel.from;
                try {
                  const q = editorRef.current.state.doc.textBetween(from, to);
                  setVariableQuery(q);
                } catch {
                  setVariableQuery("");
                }
              }
            }}
            onKeyDown={(e) => {
              signalTyping();
              if (showCannedMenu) {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setCannedIndex((i) => Math.min(i + 1, Math.max(0, (filteredCanned.length ?? 1) - 1)));
                  return;
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setCannedIndex((i) => Math.max(i - 1, 0));
                  return;
                }
                if (e.key === "Enter") {
                  e.preventDefault();
                  const item = (filteredCanned ?? [])[cannedIndex];
                  if (item?.body && editorRef.current) {
                    const sel = editorRef.current.state.selection;
                    const from = Math.max(1, (triggerPosRef.current ?? sel.from) - 1);
                    const to = sel.from;
                    editorRef.current
                      .chain()
                      .focus()
                      .deleteRange({ from, to })
                      .insertContent(item.body)
                      .run();
                  }
                  setShowCannedMenu(false);
                  setCannedQuery("");
                  triggerPosRef.current = null;
                  return;
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setShowCannedMenu(false);
                  setCannedQuery("");
                  triggerPosRef.current = null;
                  return;
                }
              }
              if (showMentions) {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setMentionIndex((i) => Math.min(i + 1, Math.max(0, (filteredMembers.length ?? 1) - 1)));
                  return;
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setMentionIndex((i) => Math.max(i - 1, 0));
                  return;
                }
                if (e.key === "Enter") {
                  e.preventDefault();
                  const item: any = filteredMembers[mentionIndex];
                  if (item && editorRef.current) {
                    const label = item.fullName || item.name || item.email || "user";
                    const sel = editorRef.current.state.selection;
                    const from = Math.max(1, (mentionTriggerPosRef.current ?? sel.from) - 1);
                    const to = sel.from;
                    editorRef.current
                      .chain()
                      .focus()
                      .deleteRange({ from, to })
                      .insertContent(`@${label} `)
                      .run();
                  }
                  setShowMentions(false);
                  setMentionQuery("");
                  mentionTriggerPosRef.current = null;
                  return;
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setShowMentions(false);
                  setMentionQuery("");
                  mentionTriggerPosRef.current = null;
                  return;
                }
              }
              if (showVariables) {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setVariableIndex((i) => Math.min(i + 1, Math.max(0, (filteredVariables.length ?? 1) - 1)));
                  return;
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setVariableIndex((i) => Math.max(i - 1, 0));
                  return;
                }
                if (e.key === "Enter") {
                  e.preventDefault();
                  const item = filteredVariables[variableIndex];
                  if (item && editorRef.current) {
                    const sel = editorRef.current.state.selection;
                    const from = Math.max(1, (variableTriggerPosRef.current ?? sel.from) - 2);
                    const to = sel.from;
                    editorRef.current
                      .chain()
                      .focus()
                      .deleteRange({ from, to })
                      .insertContent(`{{${item.key}}}`)
                      .run();
                  }
                  setShowVariables(false);
                  setVariableQuery("");
                  variableTriggerPosRef.current = null;
                  return;
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setShowVariables(false);
                  setVariableQuery("");
                  variableTriggerPosRef.current = null;
                  return;
                }
              }
              if (e.key === ":") {
                setEmojiOpen(true);
                return;
              }
              if (e.key === "/") {
                setShowCannedMenu(true);
                setCannedIndex(0);
                setCannedQuery("");
                triggerPosRef.current = null;
                setShowMentions(false);
                setShowVariables(false);
                return;
              }
              if (e.key === "@") {
                setShowMentions(true);
                setMentionIndex(0);
                setMentionQuery("");
                mentionTriggerPosRef.current = null;
                setShowCannedMenu(false);
                setShowVariables(false);
                return;
              }
              if (e.key === "{") {
                if (lastKeyWasBraceRef.current) {
                  setShowVariables(true);
                  setVariableIndex(0);
                  setVariableQuery("");
                  variableTriggerPosRef.current = null;
                  setShowCannedMenu(false);
                  setShowMentions(false);
                  lastKeyWasBraceRef.current = false;
                  return;
                }
                lastKeyWasBraceRef.current = true;
                return;
              }
              lastKeyWasBraceRef.current = false;
              if (e.key === "Enter") {
                const mod = e.ctrlKey || e.metaKey;
                const shift = e.shiftKey;
                if (shift) return;
                if (sendKey === "mod+enter") {
                  if (mod) {
                    e.preventDefault();
                    send();
                  }
                } else {
                  if (!mod) {
                    e.preventDefault();
                    send();
                  }
                }
              }
            }}
            onPaste={async (e) => {
              const files = Array.from(e.clipboardData?.files || []);
              const images = files.filter((f) => f.type?.startsWith("image/"));
              const others = files.filter((f) => !f.type?.startsWith("image/"));
              if (images.length > 0) {
                e.preventDefault();
                const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
                for (const img of images) {
                  try {
                    const form = new FormData();
                    form.append("file", img, img.name);
                    const res = await fetch(`${base}/communications/uploads`, {
                      method: "POST",
                      body: form,
                    });
                    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
                    const upJson = (await res.json()) as any;
                    const url = upJson.path as string;
                    if (editorRef.current && url) {
                      editorRef.current.chain().focus().setImage({ src: url }).run();
                    }
                  } catch (err) {
                    console.error("Inline image upload failed", err);
                    toast({ title: "Upload failed", description: String(err || "") });
                  }
                }
              }
              if (others.length > 0) {
                handleFiles(others);
              }
            }}
          />

          <InlineSuggestionList
            filteredCanned={filteredCanned}
            filteredMembers={filteredMembers}
            filteredVariables={filteredVariables}
            editorRef={editorRef}
            mentionIndex={mentionIndex}
            setShowMentions={setShowMentions}
            setMentionQuery={setMentionQuery}
            mentionTriggerPosRef={mentionTriggerPosRef}
            showMentions={showMentions}
            cannedIndex={cannedIndex}
            setShowCannedMenu={setShowCannedMenu}
            setCannedQuery={setCannedQuery}
            triggerPosRef={triggerPosRef}
            showCannedMenu={showCannedMenu}
            showVariables={showVariables}
            setShowVariables={setShowVariables}
            variableIndex={variableIndex}
            setVariableQuery={setVariableQuery}
            variableTriggerPosRef={variableTriggerPosRef}
          />
        </div>

          {signatureEnabled && signatureText && <SignaturePreview signature={signatureText} />}
      </div>

      <ComposerFooter
        onSend={send}
        sendDisabled={sendMessage.isPending || uploading || !threadId || accountDisconnected}
        sendKey={sendKey}
        toolbarProps={toolbarProps}
      />
    </div>
  );

  const dropZone = (
    <div
      className="border-t bg-muted/30 p-4"
      onDragOver={(e) => {
        if (accountDisconnected) return;
        e.preventDefault();
      }}
      onDrop={async (e) => {
        if (accountDisconnected) return;
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files || []);
        if (!files.length) return;
        const images = files.filter((f) => f.type?.startsWith("image/"));
        const others = files.filter((f) => !f.type?.startsWith("image/"));
        if (images.length > 0 && editorRef.current) {
          const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
          for (const img of images) {
            try {
              const form = new FormData();
              form.append("file", img, img.name);
              const res = await fetch(`${base}/communications/uploads`, {
                method: "POST",
                body: form,
              });
              if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
              const upJson = (await res.json()) as any;
              const url = upJson.path as string;
              if (url) {
                editorRef.current.chain().focus().setImage({ src: url }).run();
              }
            } catch (err) {
              console.error("Inline image upload failed", err);
              toast({ title: "Upload failed", description: String(err || "") });
            }
          }
        } else if (images.length > 0) {
          handleFiles(images);
        }
        if (others.length > 0) {
          handleFiles(others);
        }
      }}
    >
      {composerCard}
    </div>
  );

  const signatureDialog = (
    <SignatureManagerDialog
      onOpenChange={setSignatureManagerOpen}
      onSave={handleSignatureManagerSave}
      open={signatureManagerOpen}
      signatures={signatures}
    />
  );

  if (isPopout) {
    return (
      <>
        {signatureDialog}
        <TooltipProvider>
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-background/60" onClick={() => setIsPopout(false)} />
            <div className="pointer-events-none flex h-full w-full items-end justify-center p-4 sm:items-center sm:justify-end">
              <div className="pointer-events-auto w-full max-w-xl">{dropZone}</div>
            </div>
          </div>
        </TooltipProvider>
      </>
    );
  }

  return (
    <>
      {signatureDialog}
      <TooltipProvider>{dropZone}</TooltipProvider>
    </>
  );
}

export default Composer;
