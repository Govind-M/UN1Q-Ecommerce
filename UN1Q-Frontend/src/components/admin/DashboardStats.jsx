import { useSelector } from "react-redux";
import { selectUsersByAdmin, selectAdminOrders } from "../../features/admin/adminSlice";

import styles from "../../styles/Admin.module.css";


const StatCard = ({ icon, label, value, trend, trendUp }) => (
  <div className={styles.statCard}>
    <div className={styles.statIcon}>{icon}</div>
    <p className={styles.statLabel}>{label}</p>
    <p className={styles.statValue}>{value}</p>
    {trend && (
      <p className={`${styles.statTrend} ${trendUp ? styles.trendUp : styles.trendDown}`}>
        {trendUp ? "↗" : "↘"} {trend}
      </p>
    )}
  </div>
);


const TotalUsersIcon  = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const ActiveUsersIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
const SuspendedIcon   = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>;
const OrdersIcon      = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>;
const EarningsIcon    = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>;


const getCurrentAndPrevMonth = () => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  return { currentMonth, prevMonth, currentYear: now.getFullYear() };
};


const calcTrend = (current, previous) => {
  if (previous === 0) return current > 0 ? { trend: "+100%", trendUp: true } : null;
  const pct = (((current - previous) / previous) * 100).toFixed(1);
  return {
    trend: `${pct > 0 ? "+" : ""}${pct}%`,
    trendUp: pct >= 0,
  };
};

const DashboardStats = () => {

  // ✅ FIX: ?? [] ensures we always have an array even if selector returns null/undefined
  const users  = useSelector(selectUsersByAdmin) ?? [];
  const orders = useSelector(selectAdminOrders)  ?? [];

  const totalUsers  = users.length;
  const activeUsers = users.filter((u) => !u.isBlocked).length;
  const suspended   = users.filter((u) => u.isBlocked).length;
  const totalOrders = orders.length;
  const earnings    = orders.reduce((s, o) => s + (o.total || 0), 0);


  const { currentMonth, prevMonth, currentYear } = getCurrentAndPrevMonth();

  const currentMonthOrders = orders.filter((o) => {
    const d = new Date(o.placedAt);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const prevMonthOrders = orders.filter((o) => {
    const d = new Date(o.placedAt);
    return d.getMonth() === prevMonth;
  });

  const currentMonthEarnings = currentMonthOrders.reduce((s, o) => s + (o.total || 0), 0);
  const prevMonthEarnings    = prevMonthOrders.reduce((s, o) => s + (o.total || 0), 0);

  const ordersTrend   = calcTrend(currentMonthOrders.length, prevMonthOrders.length);
  const earningsTrend = calcTrend(currentMonthEarnings, prevMonthEarnings);

 
  const stats = [
    {
      icon: <TotalUsersIcon />,
      label: "TOTAL USERS",
      value: totalUsers.toLocaleString(),
      trend: `${totalUsers} registered`,
      trendUp: true,
    },
    {
      icon: <ActiveUsersIcon />,
      label: "ACTIVE USERS",
      value: activeUsers.toLocaleString(),
      trend: totalUsers > 0
        ? `${((activeUsers / totalUsers) * 100).toFixed(1)}% of total`
        : null,
      trendUp: true,
    },
    {
      icon: <SuspendedIcon />,
      label: "SUSPENDED",
      value: suspended.toLocaleString(),
      trend: suspended > 0
        ? `${((suspended / totalUsers) * 100).toFixed(1)}% of total`
        : "None blocked",
      trendUp: suspended === 0,
    },
    {
      icon: <OrdersIcon />,
      label: "TOTAL ORDERS",
      value: totalOrders.toLocaleString(),
      trend: ordersTrend?.trend ?? "No prev data",
      trendUp: ordersTrend?.trendUp ?? true,
    },
    {
      icon: <EarningsIcon />,
      label: "EARNINGS",
      value: earnings >= 1000
        ? `₹${(earnings / 1000).toFixed(1)}k`
        : `₹${earnings}`,
      trend: earningsTrend?.trend ?? "No prev data",
      trendUp: earningsTrend?.trendUp ?? true,
    },
  ];

  return (
    <div className={styles.statsGrid}>
      {stats.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
    </div>
  );
};

export default DashboardStats;
