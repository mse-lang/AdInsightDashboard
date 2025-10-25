import { SalesPieChart } from "../sales-pie-chart";

export default function SalesPieChartExample() {
  const mockData = [
    { name: "메인배너", value: 8000 },
    { name: "사이드배너", value: 4500 },
    { name: "뉴스레터", value: 2400 },
    { name: "eDM", value: 3200 },
  ];

  return (
    <div className="p-6">
      <SalesPieChart data={mockData} />
    </div>
  );
}
