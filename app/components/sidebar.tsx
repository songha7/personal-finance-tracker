"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  AddIcon,
  BudgetsIcon,
  DashboardIcon,
  HelpIcon,
  LogoutIcon,
  ReportsIcon,
  SettingsIcon,
  TransactionsIcon,
} from "./icons";

// Every entry here is a route that actually exists in `app/`. It would be
// easy to pad this list out to look more like a "real" finance dashboard
// (Wallet, Invoice, Portfolio, Chats, Community...) but a nav link that
// goes nowhere is worse than not having it — every item below leads
// somewhere functional.
const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: DashboardIcon },
  { href: "/transactions", label: "Transactions", icon: TransactionsIcon },
  { href: "/inputs", label: "Add transaction", icon: AddIcon },
  { href: "/budgets", label: "Budgets", icon: BudgetsIcon },
  { href: "/reports", label: "Reports", icon: ReportsIcon },
];

const SECONDARY_NAV_ITEMS = [
  { href: "/help", label: "Help & Support", icon: HelpIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

const linkBase =
  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors";
const linkInactive = "text-white/70 hover:bg-white/10 hover:text-white";
// The active item gets a solid white pill — high-contrast against the
// brand gradient, matching the reference dashboard's "selected" state.
const linkActive = "bg-white text-(--brand-700) shadow-sm";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => router.push("/login"),
      },
    });
  };

  const isItemActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const renderLink = (item: {
    href: string;
    label: string;
    icon: typeof DashboardIcon;
  }) => {
    const isActive = isItemActive(item.href);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`${linkBase} ${isActive ? linkActive : linkInactive}`}
      >
        <Icon size={18} />
        {item.label}
      </Link>
    );
  };

  return (
    <aside
      className="flex w-64 shrink-0 flex-col gap-1 p-5 text-white"
      style={{ background: "var(--brand-gradient)" }}
    >
      <div className="mb-6 flex items-center gap-2.5 px-2">
        <Image
          src="/icon.png"
          alt=""
          width={28}
          height={28}
          className="rounded-lg"
        />
        <span className="font-display text-2xl tracking-wide">Finance</span>
      </div>

      <span className="mb-1 px-3 text-xs font-semibold tracking-wider text-white/50 uppercase">
        Menu
      </span>
      <nav className="flex flex-col gap-1">{NAV_ITEMS.map(renderLink)}</nav>

      <nav className="mt-auto flex flex-col gap-1 border-t border-white/15 pt-3">
        {SECONDARY_NAV_ITEMS.map(renderLink)}

        {/* While the session is still loading, show neither — avoids a
            flash of "Login" before we actually know you're logged in. */}
        {!isPending &&
          (session ? (
            <button
              onClick={handleLogout}
              className={`${linkBase} ${linkInactive} cursor-pointer`}
            >
              <LogoutIcon size={18} />
              Log out
            </button>
          ) : (
            renderLink({ href: "/login", label: "Login", icon: LogoutIcon })
          ))}
      </nav>
    </aside>
  );
}
