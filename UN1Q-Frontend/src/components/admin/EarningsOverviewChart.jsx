import { useSelector } from "react-redux";
import { TrendingUp } from "lucide-react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../../components/ui/chart";
import { selectEarningsChart } from "../../features/admin/adminSlice";
import styles from "../../styles/Admin.module.css";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--chart-1)",
  },
};

const EarningsOverviewChart = () => {
  const chartData = useSelector(selectEarningsChart);

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <div>
          <h3 className={styles.chartTitle}>Earnings Overview</h3>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className={styles.emptyChart}>No earnings data yet</div>
      ) : (
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadarChart data={chartData}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <PolarAngleAxis dataKey="month" />
            <PolarGrid />
            <Radar
              dataKey="revenue"
              fill="var(--color-revenue)"
              fillOpacity={0.6}
              dot={{ r: 4, fillOpacity: 1 }}
            />
          </RadarChart>
        </ChartContainer>
      )}
    </div>
  );
};

export default EarningsOverviewChart;
