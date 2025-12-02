"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { ZodTypeAny } from "zod";

export function useZodForm<TSchema extends ZodTypeAny>(schema: TSchema, options?: any) {
  return useForm<any>({
    ...options,
    resolver: zodResolver(schema as any) as any,
  });
}
