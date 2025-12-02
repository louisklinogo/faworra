import { getWebsiteLogo } from "@/utils/logos";
import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";
import { InvoiceStatus } from "./invoice-status";

type Props = {
  name?: string | null;
  website?: string | null;
  status?: "overdue" | "paid" | "unpaid" | "draft" | "canceled" | "scheduled";
};

export function CustomerHeader({ name, website, status }: Props) {
  const logo = getWebsiteLogo(website ?? undefined);

  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center space-x-2 min-w-0">
        {name ? (
          <Avatar className="h-6 w-6 border border-border">
            {logo ? <AvatarImage src={logo} alt={`${name} logo`} /> : null}
            <AvatarFallback className="text-[10px] font-medium">
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : null}
        <span className="truncate text-sm text-foreground/80">
          {name || "Unnamed customer"}
        </span>
      </div>

      <InvoiceStatus status={status} />
    </div>
  );
}
