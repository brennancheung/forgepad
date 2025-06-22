"use client";

import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import PublicLayout from "@/components/PublicLayout";
import AuthLayout from "@/components/AuthLayout";
import { api } from "@/convex/_generated/api";
import { usePathname, useRouter } from "next/navigation";

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useQuery(api.users.getCurrentUser);

  return (
    <>
      <Unauthenticated>
        <PublicLayout>{children}</PublicLayout>
      </Unauthenticated>
      <Authenticated>
        <AuthLayout>{children}</AuthLayout>
      </Authenticated>
    </>
  );
}
