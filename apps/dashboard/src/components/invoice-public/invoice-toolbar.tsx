"use client";

import { downloadFile } from "@/lib/download";
import { Button } from "@midday/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { motion } from "framer-motion";
import { MdContentCopy, MdOutlineFileDownload } from "react-icons/md";
import { useCopyToClipboard } from "usehooks-ts";

type Props = {
  token: string;
  invoiceNumber: string;
};

export function InvoiceToolbar({ token, invoiceNumber }: Props) {
  const [, copy] = useCopyToClipboard();

  const handleCopy = () => {
    copy(window.location.href);
  };

  return (
    <motion.div
      className="fixed inset-x-0 -bottom-1 flex justify-center"
      initial={{ opacity: 0, filter: "blur(8px)", y: 0 }}
      animate={{ opacity: 1, filter: "blur(0px)", y: -24 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <div className="backdrop-filter backdrop-blur-lg dark:bg-[#1A1A1A]/80 bg-[#F6F6F3]/80 rounded-full pl-2 pr-4 py-3 h-10 flex items-center justify-center border border-border/80">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8"
                onClick={() =>
                  downloadFile(`/api/download/invoice?token=${token}`, `${invoiceNumber}.pdf`)
                }
              >
                <MdOutlineFileDownload className="h-[18px] w-[18px]" />
              </Button>
            </TooltipTrigger>
            <TooltipContent sideOffset={12} className="text-[10px] py-1 px-2">
              Download
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8"
                onClick={handleCopy}
              >
                <MdContentCopy className="h-[16px] w-[16px]" />
              </Button>
            </TooltipTrigger>
            <TooltipContent sideOffset={12} className="text-[10px] py-1 px-2">
              Copy link
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </motion.div>
  );
}
