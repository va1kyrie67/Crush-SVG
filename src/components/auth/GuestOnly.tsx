"use client";

import React, { useEffect, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/client/auth-context";
import { AppLoader } from "@/components/ui/AppLoader";
import { clearAuthRedirectUrl, getAuthRedirectUrl } from "@/lib/client/auth-redirect";

interface GuestOnlyProps {
  children: ReactNode;
}

export function GuestOnly({ children }: GuestOnlyProps) {
  const { status } = useAuth();
  const searchParams = useSearchParams();
  const redirectedRef = useRef(false);
  const [redirecting, setRedirecting] = useState(false);
  // Track if user was already authed when the component mounted
  const initiallyAuthedRef = useRef(status === "authed");

  useEffect(() => {
    if (status === "authed" && !redirectedRef.current) {
      redirectedRef.current = true;
      setRedirecting(true);
      const returnTo = getAuthRedirectUrl(searchParams.get("returnTo"));
      clearAuthRedirectUrl();
      window.location.replace(returnTo);
    }
  }, [status, searchParams]);

  // While checking auth status or redirecting, show a stable loader so auth forms never flash.
  if (status === "loading" || status === "authed" || redirecting) {
    return (
      <div className="w-full min-h-[75vh] flex items-center justify-center py-[60px]">
        <AppLoader />
      </div>
    );
  }

  // Guest: show the protected content directly.
  return <>{children}</>;
}
