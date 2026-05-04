import { COMMUNITY } from "@/lib/config";

/**
 * Branded HTML shell for outbound community email. Inline-styled for
 * Gmail/Outlook compatibility; no <style> blocks, no external images.
 * Brand colors come from per-community env vars via lib/config.ts.
 */

const INK_SOFT = "#475569";
const INK_SOFTER = "#94A3B8";
const LINE = "#E2E8F0";
const PAPER = "#FFFFFF";
const BG = "#F7F9FB";

export type BrandedEmailOptions = {
  /** Hidden preheader text shown next to the subject line in the inbox. */
  preheader?: string;
  /** Optional H1 above the body. */
  heading?: string;
  /** Body HTML. Already-rendered paragraphs/blocks. */
  bodyHtml: string;
  /** Optional CTA button at the end of the body. */
  cta?: { label: string; href: string };
  /** Footer signature line. Defaults to "The {community} board". */
  signoff?: string;
};

export function renderBrandedEmail(opts: BrandedEmailOptions): string {
  const primary = COMMUNITY.primaryColor;
  const accent = COMMUNITY.accentColor;
  const community = COMMUNITY.name;
  const domain = COMMUNITY.domain;
  const {
    preheader,
    heading,
    bodyHtml,
    cta,
    signoff = `The ${community} board`,
  } = opts;

  const headingHtml = heading
    ? `<h1 style="margin:0 0 16px;font:600 22px/1.3 Inter,-apple-system,system-ui,sans-serif;color:${primary};letter-spacing:-0.3px;">${escapeHtml(
        heading
      )}</h1>`
    : "";

  const ctaHtml = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px;">
        <tr><td align="center" bgcolor="${accent}" style="border-radius:8px;">
          <a href="${escapeAttr(cta.href)}" style="display:inline-block;padding:13px 28px;font:600 15px/1 Inter,-apple-system,system-ui,sans-serif;color:#FFFFFF;text-decoration:none;border-radius:8px;">
            ${escapeHtml(cta.label)}
          </a>
        </td></tr>
      </table>`
    : "";

  const preheaderHtml = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${BG};opacity:0;">${escapeHtml(
        preheader
      )}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="light"/>
<title>${escapeHtml(community)}</title>
</head>
<body style="margin:0;padding:0;background:${BG};">
${preheaderHtml}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BG};">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:${PAPER};border:1px solid ${LINE};border-radius:14px;overflow:hidden;">
      <tr><td style="padding:28px 32px 8px;font:600 18px/1 Inter,-apple-system,system-ui,sans-serif;color:${primary};">
        ${escapeHtml(community)}
      </td></tr>
      <tr><td style="padding:8px 32px 32px;font:400 16px/1.6 Inter,-apple-system,system-ui,sans-serif;color:${primary};">
        ${headingHtml}
        <div style="color:${primary};">${bodyHtml}</div>
        ${ctaHtml}
      </td></tr>
      <tr><td style="padding:20px 32px 28px;border-top:1px solid ${LINE};font:400 13px/1.55 Inter,-apple-system,system-ui,sans-serif;color:${INK_SOFT};">
        <div style="margin-bottom:6px;">— ${escapeHtml(signoff)}</div>
        <div style="color:${INK_SOFTER};">
          <a href="https://${escapeAttr(domain)}" style="color:${accent};text-decoration:none;">${escapeHtml(domain)}</a>
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export function renderMagicLinkEmail(args: {
  link: string;
}): { subject: string; html: string; text: string } {
  const community = COMMUNITY.name;
  const subject = `Your ${community} sign-in link`;
  const heading = `Sign in to ${community}`;
  const intro = `Click below to sign in. The link is good for one hour and can only be used once.`;
  const tail = `If you didn't request this, you can ignore this email — no one can sign in without clicking the link.`;

  const bodyHtml = `
    <p style="margin:0 0 16px;">${intro}</p>
    <p style="margin:0;color:${INK_SOFT};font-size:14px;">${tail}</p>
  `;

  const html = renderBrandedEmail({
    preheader: `Your one-time sign-in link to ${community}.`,
    heading,
    bodyHtml,
    cta: { label: "Sign in", href: args.link },
  });

  const text = [
    heading,
    "",
    intro,
    "",
    args.link,
    "",
    tail,
    "",
    `— The ${community} board`,
    `https://${COMMUNITY.domain}`,
  ].join("\n");

  return { subject, html, text };
}

export function renderAnnouncementEmail(args: {
  title: string;
  bodyMd: string;
  authorName: string;
  link: string;
}): { subject: string; html: string; text: string } {
  const community = COMMUNITY.name;
  const subject = `[${community}] ${args.title}`;
  const heading = args.title;

  // Lightweight markdown→HTML: paragraph breaks only. Anything fancier
  // would need a parser; the announcement composer can use plain prose.
  const paragraphs = args.bodyMd
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px;">${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("");

  const bodyHtml = `
    ${paragraphs}
    <p style="margin:18px 0 0;color:${INK_SOFT};font-size:14px;">Posted by ${escapeHtml(
      args.authorName
    )}</p>
  `;

  const html = renderBrandedEmail({
    preheader: args.title,
    heading,
    bodyHtml,
    cta: { label: "Open in portal", href: args.link },
  });

  const text = [
    heading,
    "",
    args.bodyMd,
    "",
    `Posted by ${args.authorName}`,
    "",
    args.link,
  ].join("\n");

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}
