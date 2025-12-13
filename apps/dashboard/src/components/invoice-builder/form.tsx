import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useTRPC } from "@/trpc/client";
import { getUrl } from "@/utils/environment";
import { formatRelativeTime } from "@/utils/format";
import { Icons } from "@midday/ui/icons";
import { ScrollArea } from "@midday/ui/scroll-area";
import { useToast } from "@midday/ui/use-toast";
import { useEffect, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useDebounceValue } from "usehooks-ts";
import { OpenURL } from "../open-url";
import { CustomerDetails } from "./customer-details";
import { EditBlock } from "./edit-block";
import type { InvoiceFormValues } from "./form-context";
import { FromDetails } from "./from-details";
import { LineItems } from "./line-items";
import { Logo } from "./logo";
import { Meta } from "./meta";
import { NoteDetails } from "./note-details";
import { PaymentDetails } from "./payment-details";
import { SubmitButton } from "./submit-button";
import { Summary } from "./summary";
import {
  transformFormValuesToCreate,
  transformFormValuesToDraft,
} from "./utils";

export function Form() {
  const { invoiceId, setParams } = useInvoiceParams();
  const [lastUpdated, setLastUpdated] = useState<Date | undefined>();
  const [lastEditedText, setLastEditedText] = useState("");

  const form = useFormContext();
  const token = form.watch("token");

  const trpc = useTRPC();
  const utils = trpc.useUtils();
  const { toast } = useToast();

  const updateDraftMutation = trpc.invoices.updateDraft.useMutation({
    onSuccess: async (_, variables) => {
      setLastUpdated(new Date());

      await utils.invoices.list.invalidate();
      if (variables?.id) {
        await utils.invoices.getWithItems.invalidate({ id: variables.id });
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to save invoice",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createInvoiceMutation = trpc.invoices.create.useMutation({
    onSuccess: async (data) => {
      await utils.invoices.list.invalidate();
      if (data?.id) {
        await utils.invoices.getWithItems.invalidate({ id: data.id });
      }
    },
    onError: (error) => {
      if (error.data?.code === "SERVICE_UNAVAILABLE") {
        toast({
          title: "Scheduling Failed",
          description: "Please try again. If the issue persists, contact support.",
        });
      } else {
        toast({
          title: "Invoice Creation Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const sendInvoiceMutation = trpc.invoices.send.useMutation({
    onSuccess: async (_, variables) => {
      if (variables?.id) {
        await utils.invoices.getWithItems.invalidate({ id: variables.id });
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to send invoice",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Only watch the fields that are used in the upsert action
  const formValues = useWatch({
    control: form.control,
    name: [
      "customerDetails",
      "customerId",
      "customerName",
      "template",
      "lineItems",
      "amount",
      "vat",
      "tax",
      "discount",
      "dueDate",
      "issueDate",
      "noteDetails",
      "paymentDetails",
      "fromDetails",
      "invoiceNumber",
      "topBlock",
      "bottomBlock",
      "scheduledAt",
      "status",
    ],
  });

  const isDirty = form.formState.isDirty;
  const invoiceNumberValid = !form.getFieldState("invoiceNumber").error;
  const [debouncedValue] = useDebounceValue(formValues, 500);

  useEffect(() => {
    if (
      invoiceId &&
      isDirty &&
      form.watch("status") === "draft" &&
      form.watch("customerId") &&
      invoiceNumberValid
    ) {
      const currentFormValues = form.getValues() as InvoiceFormValues;
      updateDraftMutation.mutate(transformFormValuesToDraft(currentFormValues));
    }
  }, [debouncedValue, form, invoiceId, isDirty, invoiceNumberValid, updateDraftMutation]);

  useEffect(() => {
    const updateLastEditedText = () => {
      if (!lastUpdated) {
        setLastEditedText("");
        return;
      }

      setLastEditedText(`Edited ${formatRelativeTime(lastUpdated)}`);
    };

    updateLastEditedText();
    const intervalId = setInterval(updateLastEditedText, 1000);

    return () => clearInterval(intervalId);
  }, [lastUpdated]);

  // Submit the form and the draft invoice
  const handleSubmit = async (values: InvoiceFormValues) => {
    const deliveryType = values.template.deliveryType ?? "create";

    try {
      if (invoiceId) {
        await updateDraftMutation.mutateAsync(
          transformFormValuesToDraft(values),
        );

        if (deliveryType === "create_and_send") {
          await sendInvoiceMutation.mutateAsync({ id: values.id });
        }

        setParams({ type: "success", invoiceId: values.id });
        return;
      }

      const payload = transformFormValuesToCreate(values);
      const created = await createInvoiceMutation.mutateAsync(payload);

      if (!created?.id) {
        return;
      }

      if (deliveryType === "create_and_send") {
        await sendInvoiceMutation.mutateAsync({ id: created.id });
      }

      setParams({ type: "success", invoiceId: created.id });
    } catch (error) {
      console.error(error);
    }
  };

  // Prevent form from submitting when pressing enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  return (
    <form
      // @ts-expect-error
      onSubmit={form.handleSubmit(handleSubmit)}
      className="relative h-full"
      onKeyDown={handleKeyDown}
    >
      <ScrollArea className="h-[calc(100vh-200px)] bg-background" hideScrollbar>
        <div className="p-8 pb-4 h-full flex flex-col">
          <div className="flex justify-between">
            <Meta />
            <Logo />
          </div>

          <div className="grid grid-cols-2 gap-6 mt-8 mb-4">
            <div>
              <FromDetails />
            </div>
            <div>
              <CustomerDetails />
            </div>
          </div>

          <EditBlock name="topBlock" />

          <div className="mt-4">
            <LineItems />
          </div>

          <div className="mt-12 flex justify-end mb-8">
            <Summary />
          </div>

          <div className="flex flex-col mt-auto">
            <div className="grid grid-cols-2 gap-6 mb-4 overflow-hidden">
              <PaymentDetails />
              <NoteDetails />
            </div>

            <EditBlock name="bottomBlock" />
          </div>
        </div>
      </ScrollArea>

      <div className="absolute bottom-14 w-full h-9">
        <div className="flex justify-between items-center mt-auto">
          <div className="flex space-x-2 items-center text-xs text-[#808080]">
            {token && (
              <>
                <OpenURL
                  href={`${getUrl()}/i/${token}`}
                  className="flex items-center gap-1"
                >
                  <Icons.ExternalLink className="size-3" />
                  <span>Preview invoice</span>
                </OpenURL>

                {(updateDraftMutation.isPending || lastEditedText) && (
                  <span>-</span>
                )}
              </>
            )}

            {(updateDraftMutation.isPending || lastEditedText) && (
              <span>
                {updateDraftMutation.isPending ? "Saving" : lastEditedText}
              </span>
            )}
          </div>

          <SubmitButton
            isSubmitting={
              createInvoiceMutation.isPending ||
              updateDraftMutation.isPending ||
              sendInvoiceMutation.isPending
            }
            disabled={
              createInvoiceMutation.isPending ||
              updateDraftMutation.isPending ||
              sendInvoiceMutation.isPending
            }
          />
        </div>
      </div>
    </form>
  );
}
