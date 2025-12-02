import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";

const baseExtensions = [
  StarterKit,
  Underline,
  Image.configure({
    HTMLAttributes: { class: "max-w-full h-auto rounded" },
  }),
  Link.configure({
    openOnClick: false,
    autolink: true,
    defaultProtocol: "https",
  }),
];

export function createComposerExtensions(options?: { placeholder?: string }) {
  const { placeholder } = options ?? {};
  return [
    ...baseExtensions,
    Placeholder.configure({ placeholder }),
  ];
}
