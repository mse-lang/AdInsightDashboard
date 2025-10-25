import { StatCard } from "../stat-card";
import { Users, TrendingUp, DollarSign, Calendar } from "lucide-react";

export default function StatCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
      <StatCard 
        title="신규 문의" 
        value={12} 
        icon={Users} 
        change={{ value: "8.2%", trend: "up" }}
      />
      <StatCard 
        title="집행중 광고" 
        value={24} 
        icon={TrendingUp}
      />
      <StatCard 
        title="이번달 매출" 
        value="₩45,000,000" 
        icon={DollarSign}
        change={{ value: "12.5%", trend: "up" }}
      />
      <StatCard 
        title="진행 건수" 
        value={38} 
        icon={Calendar}
      />
    </div>
  );
}
