"use client";

import { ViewTransition } from "react";
import { usePathname } from "next/navigation";

// Wraps the page content and keys it by the current route. When `pathname`
// changes, React treats the old and new content as an exit/enter pair
// (instead of an in-place update) and crossfades between them using the
// browser's View Transitions API — this is what actually makes it "a
// transition between routes" rather than an instant swap.
export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <ViewTransition
      key={pathname}
      name="page-content"
      share="auto"
      enter="auto"
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
