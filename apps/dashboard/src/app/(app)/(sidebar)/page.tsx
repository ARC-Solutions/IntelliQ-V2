import { DashboardFeatures } from "@/components/dashboard/dashboard-features";
import React from "react";

export const runtime = "edge";

const Dashboard = async () => {
  return (
    <div className="flex items-center justify-center min-h-screen mt-14 md:mt-0">
      <DashboardFeatures />
    </div>
  );
};

export default Dashboard;
