import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://postgres.yrdpjeewqjuwhjjpniju:SQD%25%5Ehrh%40%247a%25Ux%23e%263NTyp%40ZWFT%24D%26W52cT5AiZP%235L%40f5w%409%406T3%21%5E3PXC6P%24Z@aws-0-eu-central-1.pooler.supabase.com:5432/postgres",
  },
});
