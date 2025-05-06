"use client";

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  const redirectedRef = useRef(false);

  useEffect(() => {
    // Only redirect once and only if we have a workspaceId
    if (workspaceId && !redirectedRef.current) {
      redirectedRef.current = true;
      router.push(`/workspace/${workspaceId}/patterns`);
    }
  }, [workspaceId, router]);

  return null;
} 