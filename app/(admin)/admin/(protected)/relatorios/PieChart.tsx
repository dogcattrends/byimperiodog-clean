"use client";

import {
 Chart as ChartJS,
 ArcElement,
 Tooltip,
 Legend,
} from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

export function PieChart({ labels, data, label }: { labels: string[]; data: number[]; label: string }) {
 return (
 <Pie
 data={{
 labels,
 datasets: [
 {
 label,
 data,
 backgroundColor: [
 "#6366f1",
 "#f59e42",
 "#10b981",
 "#f43f5e",
 "#fbbf24",
 "#3b82f6",
 "#a78bfa",
 "#f472b6",
 ],
 borderWidth: 1,
 },
 ],
 }}
 options={{
 responsive: true,
 plugins: {
 legend: { position: "bottom" as const },
 },
 }}
 height={200}
 />
 );
}