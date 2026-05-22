import { resolveAppEnv, type AppEnv } from "@/lib/onepay";

export type AdminEnvStatus = {
  appEnv: AppEnv;
  paymentsConfigured: boolean;
  paymentsLive: boolean;
};

/** Server-only: whether OnePay env vars are present and if live mode is active. */
export function getAdminEnvStatus(): AdminEnvStatus {
  const appEnv = resolveAppEnv();
  const paymentsConfigured = Boolean(
    process.env.ONEPAY_APP_ID?.trim() &&
      process.env.ONEPAY_APP_TOKEN?.trim() &&
      process.env.ONEPAY_HASH_SALT?.trim(),
  );
  const paymentsLive = appEnv === "production" && paymentsConfigured;

  return { appEnv, paymentsConfigured, paymentsLive };
}
