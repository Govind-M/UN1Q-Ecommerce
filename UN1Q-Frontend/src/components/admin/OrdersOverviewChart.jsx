
import { useSelector } from "react-redux";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "../../components/ui/chart";
import { selectOrdersChart } from "../../features/admin/adminSlice";
import styles from "../../styles/Admin.module.css";

const chartConfig = {
  completed: {
    label: "Completed",
    color: "#4f5d75",
  },
  pending: {
    label: "Pending",
    color: "#b0bec5",
  },
};

const OrdersOverviewChart = () => {
  const chartData = useSelector(selectOrdersChart); 

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <div>
          <h3 className={styles.chartTitle}>Orders Overview</h3>
          <p className={styles.chartSubtitle}>
            Transaction volume over the last 30 days
          </p>
        </div>
        <select className={styles.chartFilter}>
          <option>This Month</option>
          <option>Last Month</option>
          <option>Last 3 Months</option>
        </select>
      </div>

      {chartData.length === 0 ? (
        <div className={styles.emptyChart}>No orders data yet</div>
      ) : (
        <ChartContainer config={chartConfig} className="min-h-[220px] w-full">
          <BarChart data={chartData} accessibilityLayer>
            <CartesianGrid vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="week"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="completed" fill="var(--color-completed)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="pending"   fill="var(--color-pending)"   radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      )}
    </div>
  );
};

export default OrdersOverviewChart;