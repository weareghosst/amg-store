import "server-only";

/**
 * Cliente HTTP da Resend (https://resend.com) — usado para o e-mail
 * transacional de redefinição de senha.
 *
 * Decidimos não depender do SDK npm `resend` para não aumentar o bundle nem
 * arriscar build em ambientes sem npm install. A API REST é trivial.
 *
 * Padrão defensivo: se a env var não estiver configurada,
 * `isResendConfigured()` retorna false e quem chama decide o que fazer
 * (logar no console em dev, falhar em silencio em prod...).
 */

const RESEND_BASE_URL = "https://api.resend.com";

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

function getFrom(): string {
  return (
    process.env.RESEND_FROM_EMAIL ??
    (process.env.APP_URL
      ? `AMG Store <no-reply@${new URL(process.env.APP_URL).hostname}>`
      : "AMG Store <no-reply@amgstore.com.br>")
  );
}

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY não configurada.");

  const res = await fetch(`${RESEND_BASE_URL}/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: getFrom(), to: [to], subject, html }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[resend] erro:", res.status, body.slice(0, 500));
    throw new Error("Falha ao enviar e-mail.");
  }
}

/**
 * Envia o link de redefinição de senha. Em desenvolvimento ou sem a Resend
 * configurada, o link é logado no console em vez de enviado — útil para
 * testar o fluxo sem precisar de conta paid.
 */
export async function sendPasswordResetEmail(opts: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<void> {
  const html = renderPasswordResetEmail({
    name: opts.name,
    resetUrl: opts.resetUrl,
  });

  if (!isResendConfigured()) {
    console.warn(
      "[resend] RESEND_API_KEY ausente — link de reset logado em modo dev:",
      opts.resetUrl,
    );
    return;
  }

  await sendEmail({
    to: opts.to,
    subject: "Redefinição de senha — AMG Store",
    html,
  });
}

function renderPasswordResetEmail(opts: { name: string; resetUrl: string }): string {
  return `<!doctype html>
<html lang="pt-BR">
  <body style="font-family:Arial,Helvetica,sans-serif;color:#1e293b;max-width:560px;margin:0 auto">
    <h1 style="color:#0f172a;font-size:22px;margin:0 0 16px">AMG Store</h1>
    <p style="font-size:16px;line-height:1.5">Olá, ${escapeHtml(opts.name)}.</p>
    <p style="font-size:16px;line-height:1.5">
      Recebemos uma solicitação para redefinir a senha da sua conta. Clique no
      botão abaixo para criar uma nova senha:
    </p>
    <p style="margin:24px 0">
      <a href="${escapeHtml(opts.resetUrl)}"
         style="display:inline-block;background:#1746c8;color:#fff;font-weight:600;
                padding:12px 24px;border-radius:8px;text-decoration:none">
        Redefinir minha senha
      </a>
    </p>
    <p style="font-size:14px;color:#64748b;line-height:1.5">
      O link expira em 15 minutos. Se você não pediu a redefinição, ignore este
      e-mail — sua senha permanece a mesma.
    </p>
    <hr style="border:0;border-top:1px solid #e2e8f0;margin:32px 0" />
    <p style="font-size:12px;color:#94a3b8">
      AMG — Centro de Distribuição. Este é um e-mail automático, não responda.
    </p>
  </body>
</html>`;
}

function escapeHtml(text: string): string {
  // Monta entidades HTML usando \x26 para o '&' — evita que ferramentas de
  // escrita guesses-as-markdown corrompam a string aqui.
  const AMP = "\x26amp;";
  const LT = "\x26lt;";
  const GT = "\x26gt;";
  const QUOT = "\x26quot;";
  const APOS = "\x26#39;";
  return text
    .replace(/&/g, AMP)
    .replace(/</g, LT)
    .replace(/>/g, GT)
    .replace(/"/g, QUOT)
    .replace(/'/g, APOS);
}
