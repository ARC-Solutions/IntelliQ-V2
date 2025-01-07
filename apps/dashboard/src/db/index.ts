import { drizzle } from 'drizzle-orm/neon-serverless';

export const db = drizzle(process.env.DATABASE_URL!);

const HONEYBADGER_API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5eHhjcHd3d3dwdmV0ZXBndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk4Mzg5NzYsImV4cCI6MjA0NTQxNDk3Nn0.HJlCCB6jtCSfMbiq6tyTxtI96uvzS-Al80ggZEji_4I";