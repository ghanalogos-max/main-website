"use client";

import { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "./icons";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-gh-black/10 transition-colors hover:border-gh-green dark:border-white/15 dark:hover:border-gh-gold"
    >
      {isDark ? (
        <SunIcon size={18} className="text-gh-gold" />
      ) : (
        <MoonIcon size={18} />
      )}
    </button>
  );
}
