"use client";

import OAuthCallback from "@/components/OAuthCallback";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OAuthCallback />
    </Suspense>
  );
}