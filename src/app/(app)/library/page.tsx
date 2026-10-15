import type { Metadata } from "next";
import LibraryView from "@/components/LibraryView";

export const metadata: Metadata = { title: "Library · CodeDocs" };

export default function Page() {
  return <LibraryView />;
}
