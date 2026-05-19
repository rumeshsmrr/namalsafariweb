export const SRI_LANKA_PHONE_FORMAT_ERROR =
  "Phone number must use Sri Lankan country code format, e.g. +94771234567. Do not include the initial 0 after +94.";

export function normalizeSriLankanPhone(input: string): string | null {
  const phone = input.trim().replace(/[\s()-]/g, "");

  if (!/^\+94[1-9]\d{8}$/.test(phone)) {
    return null;
  }

  return phone;
}
