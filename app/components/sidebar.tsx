"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/budgets", label: "Budgets" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
  { href: "/inputs", label: "Inputs" }
];

const SECONDARY_NAV_ITEMS = [
  { href: "/help", label: "Help" },
  { href: "/logout", label: "Log out" },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isItemActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const renderLink = (item: { href: string; label: string }) => {
    const isActive = isItemActive(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            : "text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-900"
        }`}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <aside className="flex w-56 shrink-0 flex-col gap-1 border-r border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-black ">
      <span className="mb-4 px-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex flex-row bg-cyan-800 gap-2.5 rounded-lg">
        <Image src="/icon.png" alt="icon" width={24} height={24} />Finance Tracker
      </span>

      <nav className="flex flex-col gap-1">{NAV_ITEMS.map(renderLink)}</nav>

      <nav className="mt-auto flex flex-col gap-1 border-t border-zinc-200 pt-3 dark:border-zinc-800">
        {SECONDARY_NAV_ITEMS.map(renderLink)}
      </nav>
    </aside>
  );
}