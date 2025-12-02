'use server';

import { headers } from "next/headers";
import { currencies } from "./currencies";

export async function getCountryCode() {
  const h = await headers();
  return (
    h.get("x-user-country") ||
    h.get("x-vercel-ip-country") ||
    undefined
  );
}

export async function getLocale() {
  const h = await headers();
  const explicit = h.get("x-user-locale");
  if (explicit && isValidBCP47(explicit)) return explicit;

  const accept = h.get("accept-language");
  if (accept) {
    const token = accept.split(",")[0]?.trim();
    if (token && isValidBCP47(token)) return token;
  }
  return "en-US";
}

export async function getCurrency() {
  const country = await getCountryCode();
  if (country && currencies[country as keyof typeof currencies]) {
    return currencies[country as keyof typeof currencies];
  }
  return undefined;
}

function isValidBCP47(tag: string) {
  return /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(tag);
}
