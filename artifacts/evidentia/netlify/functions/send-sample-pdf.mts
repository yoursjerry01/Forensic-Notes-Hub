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
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Forensic Science Sample Notes</title>

  <style>
    @media only screen and (max-width: 600px) {
      .email-wrapper {
        padding: 16px !important;
      }

      .email-container {
        width: 100% !important;
        border-radius: 14px !important;
      }

      .content {
        padding-left: 24px !important;
        padding-right: 24px !important;
      }

      .hero-title {
        font-size: 29px !important;
        line-height: 37px !important;
      }

      .feature {
        display: block !important;
        width: 100% !important;
        padding: 10px 0 !important;
      }

      .cta-button {
        display: block !important;
        width: auto !important;
      }
    }
  </style>
</head>

<body style="
  margin:0;
  padding:0;
  background:#f3f7fb;
  font-family:Arial, Helvetica, sans-serif;
  color:#172033;
">

  <!-- Preheader -->
  <div style="
    display:none;
    max-height:0;
    overflow:hidden;
    opacity:0;
    color:transparent;
  ">
    Your free Forensic Science Sample Notes from Evidentia are ready.
  </div>

  <table
    role="presentation"
    width="100%"
    cellspacing="0"
    cellpadding="0"
    border="0"
    style="background:#f3f7fb;"
  >
    <tr>
      <td
        align="center"
        class="email-wrapper"
        style="padding:32px 16px;"
      >

        <!-- Main Card -->
        <table
          role="presentation"
          width="600"
          cellspacing="0"
          cellpadding="0"
          border="0"
          class="email-container"
          style="
            width:600px;
            max-width:600px;
            background:#ffffff;
            border-radius:18px;
            overflow:hidden;
            box-shadow:0 8px 30px rgba(15,23,42,0.08);
          "
        >

          <!-- Brand Header -->
          <tr>
            <td
              align="center"
              style="
                padding:30px 24px 24px;
                background:#ffffff;
              "
            >
              <img
                src="https://evidentia.in/logo.png"
                width="210"
                alt="Evidentia"
                style="
                  display:block;
                  width:210px;
                  max-width:100%;
                  height:auto;
                  border:0;
                "
              >
            </td>
          </tr>

          <!-- Brand Line -->
          <tr>
            <td
              style="
                height:5px;
                background:linear-gradient(90deg,#1646b8,#16a394);
                font-size:0;
                line-height:0;
              "
            ></td>
          </tr>

          <!-- Hero -->
          <tr>
            <td
              align="center"
              class="content"
              style="
                padding:42px 48px 28px;
              "
            >

              <!-- Badge -->
              <div style="
                display:inline-block;
                padding:7px 14px;
                background:#eef4ff;
                color:#1747b8;
                border-radius:50px;
                font-size:11px;
                font-weight:bold;
                letter-spacing:0.8px;
                text-transform:uppercase;
                margin-bottom:18px;
              ">
                Welcome to Evidentia
              </div>

              <!-- Heading -->
              <h1
                class="hero-title"
                style="
                  margin:0 0 16px;
                  color:#101828;
                  font-size:35px;
                  line-height:43px;
                  font-weight:700;
                  letter-spacing:-0.5px;
                "
              >
                Your Sample Notes<br>
                <span style="color:#1747b8;">Are Ready.</span>
              </h1>

              <!-- Description -->
              <p style="
                margin:0 auto;
                max-width:470px;
                color:#667085;
                font-size:16px;
                line-height:26px;
              ">
                Thank you for joining Evidentia. Your free
                <strong style="color:#344054;">
                  Forensic Science Sample Notes
                </strong>
                are attached to this email.
              </p>

            </td>
          </tr>

          <!-- Attachment Highlight -->
          <tr>
            <td
              class="content"
              style="
                padding:10px 48px 30px;
              "
            >

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                  background:#f7faff;
                  border:1px solid #dce7fb;
                  border-radius:14px;
                "
              >
                <tr>
                  <td
                    align="center"
                    style="
                      padding:24px 20px;
                    "
                  >

                    <!-- PDF Icon -->
                    <div style="
                      display:inline-block;
                      width:48px;
                      height:48px;
                      line-height:48px;
                      background:#e9f0ff;
                      border-radius:12px;
                      color:#1747b8;
                      font-size:22px;
                      font-weight:bold;
                      margin-bottom:12px;
                    ">
                      PDF
                    </div>

                    <div style="
                      color:#172033;
                      font-size:17px;
                      line-height:24px;
                      font-weight:bold;
                    ">
                      Forensic Science Sample Notes
                    </div>

                    <div style="
                      color:#667085;
                      font-size:13px;
                      line-height:20px;
                      margin-top:6px;
                    ">
                      Your sample PDF is attached to this email.
                    </div>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- What's Inside -->
          <tr>
            <td
              class="content"
              style="
                padding:0 48px 30px;
              "
            >

              <h2 style="
                margin:0 0 16px;
                color:#172033;
                font-size:18px;
                line-height:26px;
              ">
                What you'll find inside
              </h2>

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
              >
                <tr>

                  <!-- Feature 1 -->
                  <td
                    class="feature"
                    width="33%"
                    valign="top"
                    style="padding:8px 8px 8px 0;"
                  >
                    <div style="
                      color:#1747b8;
                      font-size:20px;
                      margin-bottom:6px;
                    ">
                      ✓
                    </div>

                    <strong style="
                      display:block;
                      color:#172033;
                      font-size:13px;
                      line-height:18px;
                    ">
                      Exam Focused
                    </strong>

                    <span style="
                      display:block;
                      color:#667085;
                      font-size:12px;
                      line-height:18px;
                      margin-top:4px;
                    ">
                      Structured for revision
                    </span>
                  </td>

                  <!-- Feature 2 -->
                  <td
                    class="feature"
                    width="33%"
                    valign="top"
                    style="padding:8px;"
                  >
                    <div style="
                      color:#159b8b;
                      font-size:20px;
                      margin-bottom:6px;
                    ">
                      ✓
                    </div>

                    <strong style="
                      display:block;
                      color:#172033;
                      font-size:13px;
                      line-height:18px;
                    ">
                      Clear Concepts
                    </strong>

                    <span style="
                      display:block;
                      color:#667085;
                      font-size:12px;
                      line-height:18px;
                      margin-top:4px;
                    ">
                      Easy to understand
                    </span>
                  </td>

                  <!-- Feature 3 -->
                  <td
                    class="feature"
                    width="33%"
                    valign="top"
                    style="padding:8px 0 8px 8px;"
                  >
                    <div style="
                      color:#1747b8;
                      font-size:20px;
                      margin-bottom:6px;
                    ">
                      ✓
                    </div>

                    <strong style="
                      display:block;
                      color:#172033;
                      font-size:13px;
                      line-height:18px;
                    ">
                      Forensic Focus
                    </strong>

                    <span style="
                      display:block;
                      color:#667085;
                      font-size:12px;
                      line-height:18px;
                      margin-top:4px;
                    ">
                      Relevant applications
                    </span>
                  </td>

                </tr>
              </table>

            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td
              align="center"
              class="content"
              style="
                padding:4px 48px 36px;
              "
            >

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                  background:#f1f6ff;
                  border-radius:14px;
                "
              >
                <tr>
                  <td
                    align="center"
                    style="
                      padding:25px 20px;
                    "
                  >

                    <div style="
                      color:#344054;
                      font-size:14px;
                      line-height:21px;
                      margin-bottom:16px;
                    ">
                      Ready to explore more?
                    </div>

                    <a
                      href="https://evidentia.in"
                      class="cta-button"
                      style="
                        display:inline-block;
                        background:#1747b8;
                        color:#ffffff;
                        text-decoration:none;
                        font-size:14px;
                        font-weight:bold;
                        padding:13px 26px;
                        border-radius:8px;
                      "
                    >
                      Explore Evidentia →
                    </a>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Closing -->
          <tr>
            <td
              class="content"
              style="
                padding:0 48px 38px;
              "
            >

              <p style="
                margin:0;
                color:#667085;
                font-size:15px;
                line-height:24px;
              ">
                We hope these notes help you learn better,
                revise faster, and prepare with confidence.
              </p>

              <p style="
                margin:18px 0 0;
                color:#667085;
                font-size:15px;
                line-height:24px;
              ">
                Regards,<br>
                <strong style="color:#172033;">
                  Team Evidentia
                </strong>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td
              align="center"
              style="
                padding:28px 24px;
                background:#101828;
              "
            >

              <div style="
                color:#ffffff;
                font-size:18px;
                font-weight:bold;
                letter-spacing:1px;
              ">
                EVIDENTIA
              </div>

              <div style="
                color:#8fb3ff;
                font-size:11px;
                margin-top:7px;
                letter-spacing:1px;
              ">
                DECODE. LEARN. EXCEL.
              </div>

              <div style="
                color:#98a2b3;
                font-size:11px;
                margin-top:14px;
                line-height:18px;
              ">
                Evidence. Explained.
              </div>

              <div style="
                margin-top:12px;
              ">
                <a
                  href="https://evidentia.in"
                  style="
                    color:#ffffff;
                    text-decoration:none;
                    font-size:11px;
                  "
                >
                  evidentia.in
                </a>
              </div>

            </td>
          </tr>

        </table>

        <!-- Footer Note -->
        <div style="
          max-width:600px;
          padding:18px 20px 0;
          color:#98a2b3;
          font-size:11px;
          line-height:18px;
          text-align:center;
        ">
          You're receiving this email because you requested
          early access to Evidentia.
        </div>

      </td>
    </tr>
  </table>

</body>
</html>
      `,
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