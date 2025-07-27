import { Link, useLocation } from "wouter";
import { 
  Home, 
  Users, 
  FileText, 
  File, 
  List,
  User
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/clients", label: "Clients", icon: Users },
    { path: "/invoices", label: "Invoices", icon: FileText },
    { path: "/templates", label: "Templates", icon: File },
    { path: "/logs", label: "Activity Logs", icon: List },
    { path: "/settings", label: "Settings", icon: User }, // New settings nav item
  ];

  return (
    <div className="w-64 bg-white shadow-lg border-r border-slate-200 flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <FileText className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Invoicer</h1>
            <p className="text-sm text-slate-500">Invoice Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            
            return (
              <li key={item.path}>
                <Link href={item.path}>
                  <span
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
            <User className="text-slate-600" size={16} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">Business Owner</p>
            <p className="text-xs text-slate-500">Admin</p>
          </div>
        </div>
      </div>
    </div>
  );
}
