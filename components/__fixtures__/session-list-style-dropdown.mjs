// hooks/useSessionListStyle with the sessions narrowed to the current
// project, the setting's other choice: the server snapshot is always
// "tree", so a test renders the dropdown listing by aliasing the hook to
// this module.
export const SESSION_LIST_STYLE_STORAGE_KEY = "pi-web:sidebar-session-style";
export const SESSION_LIST_STYLE_DEFAULT = "tree";

export function parseSessionListStyle(raw) {
  return raw === "dropdown" ? "dropdown" : SESSION_LIST_STYLE_DEFAULT;
}

export function setSessionListStyle() {}

export function useSessionListStyle() {
  return "dropdown";
}
