"use client";

import { useTheme } from "next-themes";
import { Button } from "./ui/button";

export default function ChangeTheme() {
  const { setTheme } = useTheme();

  return (
    <>
      <Button onClick={() => setTheme("light")}>Light</Button>
      <Button onClick={() => setTheme("dark")}>Dark</Button>
    </>
  );
}
