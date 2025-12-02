"use client";

import { ChannelConnectButton } from "./channel-connect-button";

type Props = {
  id: string;
  provider: "whatsapp-baileys" | "whatsapp-cloud" | "whatsapp-360dialog" | "whatsapp-twilio" | "instagram" | "gmail";
  openWhatsApp: () => void;
  openInstagram: () => void;
  disabled?: boolean;
};

export function ConnectChannelProvider({ id: _id, provider, openWhatsApp, openInstagram, disabled }: Props) {
  switch (provider) {
    case "whatsapp-baileys":
      return <ChannelConnectButton disabled={disabled} onClick={openWhatsApp} />;
    case "instagram":
      return <ChannelConnectButton disabled={disabled} onClick={openInstagram} />;
    case "whatsapp-cloud":
    case "whatsapp-360dialog":
    case "whatsapp-twilio":
    case "gmail":
      return <ChannelConnectButton disabled onClick={() => {}} />;
    default:
      return <ChannelConnectButton disabled onClick={() => {}} />;
  }
}
