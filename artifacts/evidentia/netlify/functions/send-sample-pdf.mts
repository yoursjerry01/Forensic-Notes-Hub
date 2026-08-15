import { Resend } from "resend";
import { readFile } from "node:fs/promises";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    const body = await req.json();
    const email = String(body?.email ?? "").trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({
          error: "Please enter a valid email address.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured.");

      return new Response(
        JSON.stringify({
          error: "Email service is not configured yet.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const pdfPath = new URL(
      "../../public/Forensic-Science-Sample-Notes.pdf",
      import.meta.url,
    );

    const pdfBuffer = await readFile(pdfPath);

    const { error } = await resend.emails.send({
      from: "Evidentia <support@evidentia.in>",
      to: [email],

      subject: "Your Free Forensic Science Sample Notes | Evidentia",

            html: `
<div style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#f4f7fb;">
    <tr>
      <td align="center" style="padding:24px 12px;">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
          style="width:100%;max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;">

          <!-- HEADER -->
          <tr>
            <td align="center" style="padding:34px 24px 26px;background:#ffffff;">

              <img
                src="https://evidentia.in/logo.png"
                alt="Evidentia"
                width="210"
                style="display:block;width:210px;max-width:80%;height:auto;margin:0 auto;"
              />

              <div style="height:4px;max-width:520px;margin:26px auto 0;background:linear-gradient(90deg,#1457c5,#10a5a0);font-size:0;line-height:0;">
                &nbsp;
              </div>

            </td>
          </tr>

          <!-- HERO -->
          <tr>
            <td align="center" style="padding:28px 32px 18px;">

              <div style="display:inline-block;padding:7px 15px;background:#eef5ff;color:#1457c5;border-radius:20px;font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">
                Welcome to Evidentia
              </div>

              <h1 style="margin:18px 0 12px;font-size:32px;line-height:1.2;color:#0f172a;">
                Your Sample Notes<br>
                <span style="color:#1457c5;">Are Ready.</span>
              </h1>

              <p style="margin:0 auto;max-width:470px;font-size:16px;line-height:1.7;color:#64748b;">
                Thank you for joining Evidentia. Your free
                <strong style="color:#334155;">Forensic Science Sample Notes</strong>
                are attached to this email.
              </p>

            </td>
          </tr>

          <!-- PDF PRIORITY CARD -->
          <tr>
            <td style="padding:12px 32px 10px;">

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                style="width:100%;background:#f1f6ff;border:1px solid #d9e7fb;border-radius:16px;">

                <tr>
                  <td align="center" style="padding:28px 20px;">

                    <div style="display:inline-block;width:58px;height:58px;line-height:58px;background:#e2edff;color:#1457c5;border-radius:14px;font-size:22px;font-weight:bold;">
                      PDF
                    </div>

                    <h2 style="margin:16px 0 6px;font-size:19px;color:#0f172a;">
                      Forensic Science Sample Notes
                    </h2>

                    <p style="margin:0;font-size:14px;line-height:1.6;color:#64748b;">
                      Your sample PDF is attached to this email.
                    </p>

                    <div style="margin-top:18px;padding:11px 16px;background:#ffffff;border-radius:9px;color:#1457c5;font-size:13px;font-weight:bold;">
                      📎 Open the attachment below to view or download
                    </div>

                  </td>
                </tr>

              </table>

            </td>
          </tr>

          <!-- WHAT'S INSIDE -->
          <tr>
            <td style="padding:28px 32px 10px;">

              <h2 style="margin:0 0 20px;font-size:21px;color:#0f172a;">
                What's inside
              </h2>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

                <tr>
                  <td width="38" valign="top" style="font-size:20px;color:#1457c5;">
                    ✓
                  </td>
                  <td style="padding-bottom:18px;">
                    <strong style="font-size:15px;color:#1e293b;">Exam Focused</strong>
                    <div style="margin-top:4px;font-size:13px;line-height:1.5;color:#64748b;">
                      Structured for revision and exam preparation.
                    </div>
                  </td>
                </tr>

                <tr>
                  <td width="38" valign="top" style="font-size:20px;color:#10a5a0;">
                    ✓
                  </td>
                  <td style="padding-bottom:18px;">
                    <strong style="font-size:15px;color:#1e293b;">Clear Concepts</strong>
                    <div style="margin-top:4px;font-size:13px;line-height:1.5;color:#64748b;">
                      Easy-to-understand explanations for better learning.
                    </div>
                  </td>
                </tr>

                <tr>
                  <td width="38" valign="top" style="font-size:20px;color:#1457c5;">
                    ✓
                  </td>
                  <td>
                    <strong style="font-size:15px;color:#1e293b;">Forensic Focus</strong>
                    <div style="margin-top:4px;font-size:13px;line-height:1.5;color:#64748b;">
                      Relevant forensic applications and examples.
                    </div>
                  </td>
                </tr>

              </table>

            </td>
          </tr>

          <!-- SECONDARY CTA -->
          <tr>
            <td style="padding:24px 32px 28px;">

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                style="background:#f1f5ff;border-radius:14px;">

                <tr>
                  <td align="center" style="padding:24px 20px;">

                    <p style="margin:0 0 16px;font-size:15px;color:#475569;">
                      Want to explore more?
                    </p>

                    <a
                      href="https://evidentia.in"
                      style="display:inline-block;padding:14px 28px;background:#1457c5;color:#ffffff;text-decoration:none;border-radius:9px;font-size:14px;font-weight:bold;"
                    >
                      Explore Evidentia →
                    </a>

                  </td>
                </tr>

              </table>

            </td>
          </tr>

          <!-- CLOSING -->
          <tr>
            <td style="padding:4px 32px 30px;">

              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#64748b;">
                We hope these notes help you learn better, revise faster,
                and prepare with confidence.
              </p>

              <p style="margin:0;font-size:15px;line-height:1.6;color:#64748b;">
                Regards,<br>
                <strong style="color:#0f172a;">Team Evidentia</strong>
              </p>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding:30px 20px;background:#0f172a;">

              <div style="font-size:21px;font-weight:bold;letter-spacing:1px;color:#ffffff;">
                EVIDENTIA
              </div>

              <div style="margin-top:7px;font-size:11px;letter-spacing:2px;color:#76a9ff;">
                DECODE. LEARN. EXCEL.
              </div>

              <div style="margin-top:15px;font-size:12px;color:#94a3b8;">
                Evidence. Explained.
              </div>

              <div style="margin-top:14px;font-size:12px;color:#ffffff;">
                evidentia.in
              </div>

            </td>
          </tr>

        </table>

        <!-- EMAIL REASON -->
        <div style="max-width:600px;padding:18px 20px 4px;text-align:center;color:#94a3b8;font-size:11px;line-height:18px;">
          You're receiving this email because you requested early access to Evidentia.
        </div>

      </td>
    </tr>
  </table>
</div>,
     attachments:  [
        {
          filename: "Forensic-Science-Sample-Notes.pdf",
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error("Resend error:", error);

      return new Response(
        JSON.stringify({
          error: "Unable to send the sample notes.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );

  } catch (error) {
    console.error("Function error:", error);

    return new Response(
      JSON.stringify({
        error: "Something went wrong.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};