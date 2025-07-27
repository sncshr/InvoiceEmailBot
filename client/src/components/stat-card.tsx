import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  change?: string;
  changeColor?: string;
  action?: {
    label: string;
    onClick: () => void;
    color: string;
  };
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBgColor,
  change,
  changeColor,
  action,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
          </div>
          <div className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center`}>
            <Icon className={iconColor} size={24} />
          </div>
        </div>
        <div className="mt-4 flex items-center space-x-2">
          {change && (
            <>
              <span className={`text-sm font-medium ${changeColor}`}>{change}</span>
              <span className="text-slate-500 text-sm">this month</span>
            </>
          )}
          {action && (
            <button
              onClick={action.onClick}
              className={`text-sm font-medium hover:opacity-80 ${action.color}`}
            >
              {action.label}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
