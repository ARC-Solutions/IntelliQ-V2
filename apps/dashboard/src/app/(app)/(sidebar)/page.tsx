import { DashboardFeatures } from "@/components/dashboard/dashboard-features";
import React from "react";
import {
  allowSinglePlayerQuiz,
  allowMultiplayerQuiz,
  allowDocuments,
  allowBookmarks,
  allowRandomQuiz,
  allowHNMode,
} from "@/flags";

export const runtime = "edge";

const Dashboard = async () => {
  const [
    singlePlayerEnabled,
    multiplayerEnabled,
    documentsEnabled,
    bookmarksEnabled,
    randomQuizEnabled,
    hnModeEnabled,
  ] = await Promise.all([
    allowSinglePlayerQuiz(),
    allowMultiplayerQuiz(),
    allowDocuments(),
    allowBookmarks(),
    allowRandomQuiz(),
    allowHNMode(),
  ]);

  const featureFlags = {
    singlePlayerEnabled,
    multiplayerEnabled,
    documentsEnabled,
    bookmarksEnabled,
    randomQuizEnabled,
    hnModeEnabled
  };

  return (
    <div className="flex items-center justify-center min-h-screen mt-14 md:mt-0">
      <DashboardFeatures featureFlags={featureFlags} />
    </div>
  );
};

export default Dashboard;
