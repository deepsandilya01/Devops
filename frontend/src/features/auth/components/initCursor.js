export function initCursor() {
  const el = document.getElementById("s-cursor");
  if (!el) return;
  const onMove = (e) => {
    el.style.left = e.clientX + "px";
    el.style.top = e.clientY + "px";
  };
  document.addEventListener("mousemove", onMove);
  document.querySelectorAll("a,button,.work-card,.srv-row,.nav-logo").forEach((n) => {
    n.addEventListener("mouseenter", () => el.classList.add("big"));
    n.addEventListener("mouseleave", () => el.classList.remove("big"));
  });
  return () => document.removeEventListener("mousemove", onMove);
}
