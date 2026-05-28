export function getTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return (localStorage.getItem("kgr-theme") as "light" | "dark") ?? "light";
}

export function setTheme(theme: "light" | "dark") {
  localStorage.setItem("kgr-theme", theme);
  document.documentElement.setAttribute("data-theme", theme);
}
