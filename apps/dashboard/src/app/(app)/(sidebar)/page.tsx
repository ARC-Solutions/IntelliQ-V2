import { DashboardFeatures } from "@/components/dashboard/dashboard-features";
import React from "react";

export const runtime = "edge";

const Dashboard = async () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <DashboardFeatures />
    </div>
  );
};

export default Dashboard;
