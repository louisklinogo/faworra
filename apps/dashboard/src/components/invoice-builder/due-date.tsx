import { useTRPC } from "@/trpc/client";
import { Calendar } from "@midday/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { format } from "date-fns";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { LabelInput } from "./label-input";

export function DueDate() {
  const { setValue, watch } = useFormContext();
  const dueDate = watch("dueDate");
  const dueDateValue = dueDate ? new Date(dueDate) : null;
  const dateFormat = watch("template.dateFormat");

  const [isOpen, setIsOpen] = useState(false);

  const trpc = useTRPC();
  const updateTemplateMutation = trpc.invoiceTemplates.upsert.useMutation();
  const persistTemplate = (partial: Record<string, unknown>) =>
    updateTemplateMutation.mutate({ template: partial });

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      setValue("dueDate", date.toISOString(), {
        shouldValidate: true,
        shouldDirty: true,
      });
      setIsOpen(false);
    }
  };

  return (
    <div className="flex space-x-1 items-center">
      <div className="flex items-center">
        <LabelInput
          name="template.dueDateLabel"
          onSave={(value) => {
            persistTemplate({ dueDateLabel: value });
          }}
        />
        <span className="text-[11px] text-[#878787] font-mono">:</span>
      </div>
      <Popover open={isOpen} onOpenChange={setIsOpen} modal>
        <PopoverTrigger className="text-primary text-[11px] font-mono whitespace-nowrap flex">
          {dueDateValue && format(dueDateValue, dateFormat)}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={dueDateValue ?? undefined}
            onSelect={handleSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
