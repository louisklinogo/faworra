import type { ComponentType } from "react";

export type ProviderId =
  | "whatsapp-baileys"
  | "whatsapp-cloud"
  | "whatsapp-360dialog"
  | "whatsapp-twilio"
  | "instagram"
  | "gmail";

export type Provider = {
  id: ProviderId;
  name: string;
  description: string;
  Logo: ComponentType<{ size?: number; className?: string }>;
  disabled?: boolean;
  iconSize?: number;
  onSelect?: () => void;
};

export type WizardStage = "list" | "whatsapp-config" | "whatsapp-qr" | "instagram";
