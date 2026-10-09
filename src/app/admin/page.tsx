import type { Metadata } from "next";
import AdminApp from "@/components/admin/AdminApp";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "BUDI private admin — content management.",
  robots: { index: false, follow: false },
};

export default function AdminPage(): React.JSX.Element {
  return <AdminApp />;
}
