export function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") {
    return "/";
  }
  return pathname.replace(/\/+$/, "") || "/";
}

export function syncHashPathToHistory(): void {
  const { hash, search } = window.location;
  if (!hash.startsWith("#/")) {
    return;
  }
  window.history.replaceState(null, "", `${hash.slice(1)}${search}`);
}
