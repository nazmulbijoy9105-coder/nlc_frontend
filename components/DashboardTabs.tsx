"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { name: "Documents", href: "/dashboard/documents" },
  { name: "RJSC", href: "/dashboard/rjsc" },
  { name: "Compliance", href: "/dashboard/rules" },
  { name: "Product", href: "/dashboard/commercial" },
  { name: "Legal", href: "/dashboard/filings" },
  { name: "Tech", href: "/dashboard/companies" },
];

export default function DashboardTabs() {
  const pathname = usePathname();

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex space-x-4" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`px-3 py-2 text-sm font-medium rounded-t-md transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
