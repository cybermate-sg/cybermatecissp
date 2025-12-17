import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, LayoutDashboard, BarChart3, BookOpen, Sparkles, MessageSquare } from "lucide-react";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/classes", label: "Classes", icon: BookOpen },
  { href: "/admin/analytics", label: "User Analytics", icon: BarChart3 },
  { href: "/admin/feedback", label: "User Feedback", icon: MessageSquare },
  { href: "/admin/ai-quiz", label: "AI Quiz", icon: Sparkles },
];

export function AdminSidebar() {
  return (
    <aside className="w-64 min-h-screen bg-slate-900/50 border-r border-slate-700">
      <div className="p-6">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-1">Admin Panel</h2>
          <p className="text-sm text-gray-400">CISSP Mastery</p>
        </div>

        <nav className="space-y-2">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-300 hover:text-white hover:bg-slate-800"
            >
              <Home className="w-4 h-4 mr-3" />
              User Dashboard
            </Button>
          </Link>

          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-300 hover:text-white hover:bg-slate-800"
              >
                <item.icon className="w-4 h-4 mr-3" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
