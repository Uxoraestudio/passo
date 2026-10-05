import { createHmac } from "node:crypto";

// Flow API (https://developers.flow.cl/api). Server-only: uses the secret key.
// FLOW_API_URL defaults to the sandbox; set https://www.flow.cl/api in production.

export const FLOW_STATUS = { pending: 1, paid: 2, rejected: 3, cancelled: 4 } as const;

export type FlowPaymentStatus = {
  flowOrder: number;
  commerceOrder: string;
  status: number;
  amount: number;
  currency: string;
  payer: string;
};

export class FlowError extends Error {}

function config() {
  const apiKey = process.env.FLOW_API_KEY;
  const secretKey = process.env.FLOW_SECRET_KEY;
  if (!apiKey || !secretKey) {
    throw new FlowError("FLOW_API_KEY y FLOW_SECRET_KEY no están configuradas.");
  }
  return { apiKey, secretKey, apiUrl: process.env.FLOW_API_URL || "https://sandbox.flow.cl/api" };
}

// Flow signs the alphabetically sorted "name1value1name2value2..." string with HMAC-SHA256.
export function signFlowParams(params: Record<string, string>, secretKey: string) {
  const payload = Object.keys(params)
    .sort()
    .map((key) => key + params[key])
    .join("");
  return createHmac("sha256", secretKey).update(payload).digest("hex");
}

function signed(params: Record<string, string>) {
  const { apiKey, secretKey } = config();
  const all = { ...params, apiKey };
  return new URLSearchParams({ ...all, s: signFlowParams(all, secretKey) });
}

async function readFlowResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null);
  if (!response.ok || !body) {
    const message = body && typeof body.message === "string" ? body.message : `HTTP ${response.status}`;
    throw new FlowError(`Flow: ${message}`);
  }
  return body as T;
}

export async function createFlowPayment(input: {
  commerceOrder: string;
  subject: string;
  amount: number;
  email: string;
  urlConfirmation: string;
  urlReturn: string;
  timeoutSeconds: number;
}) {
  const { apiUrl } = config();
  const body = signed({
    commerceOrder: input.commerceOrder,
    subject: input.subject.slice(0, 200),
    currency: "CLP",
    amount: String(input.amount),
    email: input.email,
    paymentMethod: "9",
    urlConfirmation: input.urlConfirmation,
    urlReturn: input.urlReturn,
    timeout: String(input.timeoutSeconds),
  });

  const response = await fetch(`${apiUrl}/payment/create`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const data = await readFlowResponse<{ url: string; token: string; flowOrder: number }>(response);
  return { ...data, redirectUrl: `${data.url}?token=${encodeURIComponent(data.token)}` };
}

export async function getFlowPaymentStatus(token: string): Promise<FlowPaymentStatus> {
  const { apiUrl } = config();
  const response = await fetch(`${apiUrl}/payment/getStatus?${signed({ token })}`, { cache: "no-store" });
  return readFlowResponse<FlowPaymentStatus>(response);
}
