import fs from "fs";

const configFile = fs.readFileSync("wrangler.toml", "utf-8");
const lines = configFile.split("\n");

const toggleDevMode = () => {
  const updatedLines = lines.map((line, index) => {
    // Uncomment ENVIRONMENT line in dev mode
    if (line.includes('ENVIRONMENT="development"')) {
      return isDevMode
        ? 'ENVIRONMENT="development"'
        : '# ENVIRONMENT="development"';
    }
    // Comment out hyperdrive section in dev mode
    if (
      line.includes("[[hyperdrive]]") ||
      line.includes('binding = "HYPERDRIVE"') ||
      line.includes('id = "1ead348e22444a0f98164d2421b7b058"')
    ) {
      return isDevMode ? `# ${line}` : line.replace(/^# /, "");
    }
    return line;
  });

  // Write back to file
  fs.writeFileSync("wrangler.toml", updatedLines.join("\n"));
};

const mode = process.argv[2];
if (mode === "dev") {
  toggleDevMode(true);
} else if (mode === "prod") {
  toggleDevMode(false);
} else {
  console.error('Please specify either "dev" or "prod" as an argument');
  process.exit(1);
}
