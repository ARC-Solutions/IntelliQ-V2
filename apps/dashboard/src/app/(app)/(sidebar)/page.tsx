import { DashboardFeatures } from '@/components/dashboard/dashboard-features';
import React from 'react';

export const runtime = "edge";

const Dashboard = async () => {
  return (
    <div className='relative flex flex-col h-screen w-screen items-center justify-center rounded-lg bg-background md:shadow-xl'>
      <DashboardFeatures />
    </div>
  );
};

export default Dashboard;
