"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
// Replace hardcoded select with Midday-style currency combobox
import { SelectCurrency } from "@/components/select-currency";
import { SubmitButton } from "@/components/ui/submit-button";
import { CountrySelector } from "@/components/country-selector";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const schema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters."),
  countryCode: z.string().min(2, "Select a country"),
  baseCurrency: z
    .string()
    .regex(/^[A-Z]{3}$/i, "Select a valid currency (ISO 4217)")
    .transform((v) => v.toUpperCase()),
});

type Values = z.infer<typeof schema>;

export function CreateTeamForm({
  defaultCurrency,
  defaultCountryCode,
}: {
  defaultCurrency?: string;
  defaultCountryCode?: string;
}) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [locked, setLocked] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      baseCurrency: defaultCurrency || "",
      countryCode: defaultCountryCode || "",
    },
  });

  const { mutateAsync, isPending } = trpc.teams.create.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      router.push("/");
      router.refresh();
    },
  });

  const isSubmitting = isPending || locked;

  async function onSubmit(values: Values) {
    if (isSubmitting) return;
    setLocked(true);
    try {
      await mutateAsync({
        name: values.name,
        baseCurrency: values.baseCurrency,
        countryCode: values.countryCode,
        locale:
          (typeof navigator !== "undefined" &&
            (navigator.languages?.[0] || navigator.language)) ||
          undefined,
        switchTeam: true,
      });
    } finally {
      // keep locked; page will redirect on success; if error, unlock to retry
      setLocked(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="mt-4 w-full">
              <FormLabel className="text-xs text-[#666] font-normal">Company name</FormLabel>
              <FormControl>
                <Input
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect="off"
                  autoFocus
                  placeholder="Ex: Acme Marketing or Acme Co"
                  spellCheck={false}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="countryCode"
          render={({ field }) => (
            <FormItem className="mt-4 w-full">
              <FormLabel className="text-xs text-[#666] font-normal">Country</FormLabel>
              <FormControl>
                <CountrySelector
                  defaultValue={field.value}
                  onSelect={(code) => field.onChange(code)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="baseCurrency"
          render={({ field }) => (
            <FormItem className="mt-4 border-b border-border pb-4">
              <FormLabel className="text-xs text-[#666] font-normal">Base currency</FormLabel>
              <SelectCurrency value={field.value} onChange={field.onChange} />
              <FormMessage />
            </FormItem>
          )}
        />

        <SubmitButton className="mt-6 w-full" isSubmitting={isSubmitting} type="submit">
          Create
        </SubmitButton>
      </form>
    </Form>
  );
}
