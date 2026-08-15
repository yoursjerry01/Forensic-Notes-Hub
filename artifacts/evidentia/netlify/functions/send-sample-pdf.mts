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
        JSON.stringify({ error: "Please enter a valid email address." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured.");

      return new Response(
        JSON.stringify({ error: "Email service is not configured yet." }),
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
      subject: "Your Forensic Science Sample Notes",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Welcome to Evidentia!</h2>

          <p>Thank you for joining Evidentia.</p>

          <p>
            As promised, we've attached your free
            <strong>Forensic Science Sample Notes</strong>.
          </p>

          <p>
            We hope they help you study smarter and prepare better.
          </p>

          <p>
            Regards,<br />
            <strong>Team Evidentia</strong>
          </p>
        </div>
      `,
      attachments: [
        {
          filename: "Forensic-Science-Sample-Notes.pdf",
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error("Resend error:", error);

      return new Response(
        JSON.stringify({ error: "Unable to send the sample notes." }),
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
      JSON.stringify({ error: "Something went wrong." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};