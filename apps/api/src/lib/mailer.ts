import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { env } from "../env.js";

let client: SESv2Client | null = null;

/**
 * Sends a plain-text email through Amazon SES. Returns whether it was actually sent.
 *
 * Until MAIL_FROM is configured this only logs, so the call sites work in local dev without AWS
 * credentials. Never throws — a failed email must not fail the request that triggered it (e.g. an
 * application that was already saved).
 */
export async function sendEmail(to: string, subject: string, text: string): Promise<boolean> {
  if (!env.mailFrom) {
    console.log(`[mailer] (not configured, skipped) to=${to}: ${subject}`);
    return false;
  }
  try {
    client ??= new SESv2Client({ region: env.awsRegion });
    await client.send(
      new SendEmailCommand({
        FromEmailAddress: env.mailFrom,
        Destination: { ToAddresses: [to] },
        Content: {
          Simple: {
            Subject: { Data: subject, Charset: "UTF-8" },
            Body: { Text: { Data: text, Charset: "UTF-8" } },
          },
        },
      }),
    );
    return true;
  } catch (err) {
    console.error(`[mailer] send failed to=${to}:`, err);
    return false;
  }
}
