"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc/client";
import { useQueryClient } from "@tanstack/react-query";
import { SubmitButton } from "@/components/ui/submit-button";

const formSchema = z.object({
  invites: z.array(
    z.object({
      email: z.string().email(),
      // Map UI "Member" to DB role "agent"
      role: z.enum(["owner", "agent"]),
    }),
  ),
});

type FormValues = z.infer<typeof formSchema>;

export function InviteForm({ onSuccess }: { onSuccess?: () => void }) {
  const q = useQueryClient();
  const utils = trpc.useUtils();
  const invite = trpc.teams.invite.useMutation({
    onSuccess: () => {
      utils.teams.teamInvites.invalidate();
      onSuccess?.();
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { invites: [{ email: "", role: "agent" }] },
  });

  const { fields, append } = (require("react-hook-form") as typeof import("react-hook-form")).useFieldArray({
    control: form.control,
    name: "invites",
  });

  const onSubmit = form.handleSubmit((data) => {
    const list = data.invites.filter((i) => i.email.trim().length > 0);
    if (list.length) invite.mutate(list);
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        {fields.map((field, index) => (
          <div className="mt-3 flex items-center justify-between gap-4" key={field.id}>
            <FormField
              control={form.control}
              name={`invites.${index}.email` as const}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input autoCapitalize="none" autoComplete="off" autoCorrect="off" placeholder="jane@example.com" spellCheck={false} type="email" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`invites.${index}.role` as const}
              render={({ field }) => (
                <FormItem>
                  <Select defaultValue={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="min-w-[120px]"><SelectValue placeholder="Select role" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="agent">Member</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
        ))}

        <Button className="mt-4 bg-muted text-xs" type="button" variant="outline" onClick={() => append({ email: "", role: "agent" })}>
          Add more
        </Button>

        <div className="mt-8 border-t pt-4">
          <div className="flex items-center justify-between">
            <div />
            <SubmitButton disabled={invite.isPending} isSubmitting={invite.isPending} type="submit">
              Send invites
            </SubmitButton>
          </div>
        </div>
      </form>
    </Form>
  );
}
