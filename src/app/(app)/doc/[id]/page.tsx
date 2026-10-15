import type { Metadata } from "next";
import DocPageView from "@/components/DocPageView";

export const metadata: Metadata = { title: "Document · CodeDocs" };

export default function Page() {
  return <DocPageView />;
}
