import type { Metadata } from "next";
import WorkspaceView from "@/components/WorkspaceView";

export const metadata: Metadata = { title: "Workspace · CodeDocs" };

export default function Page() {
  return <WorkspaceView />;
}
