"use client";

import { HamburgerMenuIcon, ExitIcon } from "@radix-ui/react-icons";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import GlobalSearch from "@/components/global-search";

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-zinc-200 bg-white px-4">
      <button
        onClick={onMenuClick}
        className="shrink-0 rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 lg:hidden"
        aria-label="Open menu"
      >
        <HamburgerMenuIcon className="h-5 w-5" />
      </button>

      {/* Universal search — searches across the whole admin */}
      <div className="flex flex-1 justify-center sm:justify-start">
        <GlobalSearch />
      </div>

      <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
        <span className="hidden max-w-[28vw] truncate text-sm text-zinc-600 md:inline">
          {user?.fullName || user?.email || "Admin"}
        </span>
        <button
          onClick={handleLogout}
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 sm:px-3"
        >
          <ExitIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
