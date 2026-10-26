import { PARENT_COMPANY, PARENT_URL, SITE_URL } from "./seo";

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!
  );
}

/** Primary CTA button — table-based for Outlook. */
export function emailButton(href: string, label: string) {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0">
  <tr>
    <td style="border-radius:999px;background:#006B3F">
      <a href="${safeHref}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px">
        ${safeLabel}
      </a>
    </td>
  </tr>
</table>`;
}

/**
 * Branded HTML shell for transactional mail (verification, magic link, reset).
 * Uses a hosted PNG mark — most clients block or ignore SVG.
 */
export function emailLayout(name: string, body: string) {
  const logo = `${SITE_URL}/email-logo.png`;
  const safeName = escapeHtml(name);
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>GhanaLogos</title>
</head>
<body style="margin:0;padding:0;background:#F3F5F3;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F3F5F3">
    <tr>
      <td align="center" style="padding:32px 16px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E4E8E4">
          <tr>
            <td style="padding:28px 32px 20px;border-bottom:3px solid #006B3F;text-align:center">
              <a href="${SITE_URL}" target="_blank" style="text-decoration:none">
                <img src="${logo}" width="56" height="56" alt="GhanaLogos" style="display:block;margin:0 auto 12px;border:0;border-radius:12px" />
                <span style="font-size:22px;font-weight:800;letter-spacing:-0.02em;color:#0A0A0A">Ghana<span style="color:#CE1126">Logos</span></span>
              </a>
              <div style="margin-top:6px;font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#006B3F">Free vector logo library</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px;color:#0A0A0A;font-size:15px;line-height:1.55">
              <p style="margin:0 0 16px;font-size:16px">Hi ${safeName},</p>
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;color:#555555;font-size:13px;line-height:1.5">
              <p style="margin:0">If you didn’t request this, you can safely ignore this email.</p>
            </td>
          </tr>
          <tr>
            <td style="background:#0A0A0A;padding:28px 32px;text-align:center">
              <a href="${SITE_URL}" target="_blank" style="text-decoration:none">
                <img src="${logo}" width="40" height="40" alt="" style="display:block;margin:0 auto 14px;border:0;border-radius:9px" />
              </a>
              <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#ffffff">Ghana<span style="color:#CE1126">Logos</span></p>
              <p style="margin:0 0 16px;font-size:12px;line-height:1.5;color:#A8B0A8">
                A product of
                <a href="${PARENT_URL}" target="_blank" style="color:#FCD116;text-decoration:none;font-weight:600">${escapeHtml(PARENT_COMPANY)}</a>
              </p>
              <p style="margin:0 0 4px">
                <a href="${SITE_URL}" target="_blank" style="color:#C5CDC5;font-size:12px;text-decoration:none">ghanalogos.com</a>
                <span style="color:#555;padding:0 8px">·</span>
                <a href="mailto:hello@ghanalogos.com" style="color:#C5CDC5;font-size:12px;text-decoration:none">hello@ghanalogos.com</a>
              </p>
              <p style="margin:16px 0 0;font-size:11px;color:#6B736B">© ${year} ${escapeHtml(PARENT_COMPANY)}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
