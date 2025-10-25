import { PerformanceChart } from "../performance-chart";

export default function PerformanceChartExample() {
  const mockData = [
    { month: "1월", amount: 3500 },
    { month: "2월", amount: 4200 },
    { month: "3월", amount: 3800 },
    { month: "4월", amount: 5100 },
    { month: "5월", amount: 4700 },
    { month: "6월", amount: 5500 },
  ];

  return (
    <div className="p-6">
      <PerformanceChart data={mockData} />
    </div>
  );
}
