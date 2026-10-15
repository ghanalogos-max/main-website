export const CONTACT_TOPICS = {
  general: "General question",
  "logo-request": "Request a missing logo",
  removal: "Update or remove a logo (brand owners)",
  api: "Developer API",
  premium: "Premium & payments",
  partnership: "Partnership or advertising",
  other: "Something else",
} as const;

export type ContactTopic = keyof typeof CONTACT_TOPICS;

export function isContactTopic(value: unknown): value is ContactTopic {
  return typeof value === "string" && value in CONTACT_TOPICS;
}

export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 3000;
