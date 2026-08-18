"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./sidebar";
import Topbar from "./topbar";
import PageTransition from "./page-transition";

// Auth pages get their own centered card and shouldn't show the app's
// nav — there's nothing to navigate to before you're signed in, and the
// sidebar's "Log out" link would be meaningless there.
const CHROME_LESS_ROUTES = ["/login", "/signup"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isChromeLess = CHROME_LESS_ROUTES.includes(pathname);

  if (isChromeLess) {
    return (
      <div className="min-h-screen bg-(--page-bg)">
        <PageTransition>{children}</PageTransition>
      </div>
    );
  }

  // The lavender page plane holds one big rounded "app card" (sidebar +
  // topbar + page content), matching the layered look of the reference
  // dashboard rather than a flat, edge-to-edge layout.
  return (
    <div className="flex min-h-screen items-stretch bg-(--page-bg) p-4">
      <div className="flex w-full overflow-hidden rounded-3xl bg-(--surface-card) shadow-xl shadow-black/5">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 overflow-y-auto border-t border-(--chart-grid)">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>
    </div>
  );
}
