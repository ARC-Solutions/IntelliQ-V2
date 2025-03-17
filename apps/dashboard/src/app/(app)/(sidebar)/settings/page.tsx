import SettingsPage from "@/components/settings-page/settings";

export const runtime = "edge";

const Settings = async () => {
  return (
    <div className="w-full h-full overflow-auto flex flex-col items-center">
      <SettingsPage />
    </div>
  );
};

export default Settings;
