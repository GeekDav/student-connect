import type { Metadata } from "next";
import { SuperAdminEmails } from "@/components/super-admin/super-admin-emails";
import { listRecentEmailLogs } from "@/lib/actions/emails";
import { getMailRuntimeInfo } from "@/lib/mail/mailer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "E-mails — Super-admin",
  description: "Journal et tests d’e-mails Student-Connect.",
};

export default async function SuperAdminEmailsPage() {
  const [logs, runtime] = await Promise.all([
    listRecentEmailLogs(),
    Promise.resolve(getMailRuntimeInfo()),
  ]);

  return <SuperAdminEmails initialLogs={logs} runtime={runtime} />;
}
