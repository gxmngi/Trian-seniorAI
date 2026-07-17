import { EditorLayout } from "@/components/editor/editor-layout";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getProjectsForUser } from "@/lib/projects";
import { redirect } from "next/navigation";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;

  const { ownedProjects, sharedProjects } = await getProjectsForUser(userId, email);

  return (
    <EditorLayout ownedProjects={ownedProjects} sharedProjects={sharedProjects}>
      {children}
    </EditorLayout>
  );
}
