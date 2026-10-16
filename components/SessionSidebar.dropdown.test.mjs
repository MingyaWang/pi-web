import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

// The dropdown session-list style's markup (the setting's other choice),
// rendered. useSessionListStyle's server snapshot is always "tree", so the
// hook is aliased to a fixture that answers "dropdown". The alias takes the
// module's absolute path without its extension ("@/…" resolves first and is
// never matched), and it needs a process of its own: SessionSidebar.test.mjs
// has already loaded the sidebar with the real hook, and jiti shares Node's
// module cache.
const jiti = createJiti(import.meta.url, {
  jsx: { runtime: "automatic" },
  tsconfigPaths: true,
  alias: {
    [fileURLToPath(new URL("../hooks/useSessionListStyle", import.meta.url))]: fileURLToPath(new URL("./__fixtures__/session-list-style-dropdown.mjs", import.meta.url)),
  },
});
const React = await jiti.import("react");
const { renderToStaticMarkup } = await jiti.import("react-dom/server");
const { I18nProvider } = await jiti.import("@/hooks/useI18n");
const { SessionSidebar } = await jiti.import("./SessionSidebar.tsx");

const h = React.createElement;
const noop = () => {};

function render(props = {}) {
  return renderToStaticMarkup(h(I18nProvider, null, h(SessionSidebar, {
    selectedSessionId: null,
    onSelectSession: noop,
    ...props,
  })));
}

test("the fixture stands in for the whole hook module", async () => {
  // Everything the real module exports, so no importer of it breaks under the alias.
  const hookSource = await readFile(new URL("../hooks/useSessionListStyle.ts", import.meta.url), "utf8");
  const fixture = await import("./__fixtures__/session-list-style-dropdown.mjs");
  const exported = [...hookSource.matchAll(/^export (?:const|function) (\w+)/gm)].map((match) => match[1]);
  assert.deepEqual(Object.keys(fixture).sort(), exported.sort());
  assert.equal(fixture.useSessionListStyle(), "dropdown");
});

test("the dropdown style renders the project picker above the sessions, with no groups", () => {
  const html = render({ selectedCwd: "/work/alpha" });
  // The listing's head: the files' own picker, full width (its stacked boxes).
  assert.match(html, /<div class="session-dropdown-picker"><div class="project-picker is-stacked" role="group"/);
  // The listing below it is the tree's rows without its project groups or
  // pinned section; server-side it waits for its rows like the tree does.
  assert.doesNotMatch(html, /data-row-key="group:|data-row-key="pinned-header"|session-tree-group-toggle/);
  assert.match(html, /<div class="session-tree"><div class="session-tree-message">Loading\.\.\.<\/div>/);
  // The toolbar row's search is unchanged: the style narrows the listing
  // only, not the rest of the sidebar.
  assert.match(html, /aria-controls="session-search-input"/);
});

test("without a folder the dropdown style keeps the picker and its placeholder", () => {
  const html = render();
  assert.match(html, /<div class="session-dropdown-picker"><div class="project-picker is-stacked" role="group" aria-label="Project and worktree"><button type="button" class="project-picker-button is-project is-empty"/);
  assert.doesNotMatch(html, /data-row-key="group:/);
});

test("the dropdown listing resets its scroll with the project, and only then", async () => {
  // Keyed by the project key: a switch to another project remounts the
  // listing (its scroll and focus start over, not deep in rows it never
  // showed); a worktree switch keeps the same key and the listing. Read from
  // the source, as the static render cannot scroll (SessionSidebar.test.mjs's
  // source assertions); the loaded listing itself is the pure mapping's
  // tests in lib/session-tree.test.mjs.
  const source = await readFile(new URL("./SessionSidebar.tsx", import.meta.url), "utf8");
  const start = source.indexOf('sessionListStyle === "dropdown" ? (');
  const end = source.indexOf(") : (", start);
  assert.notEqual(start, -1, "the dropdown branch is rendered");
  const branch = source.slice(start, end);
  assert.match(branch, /<SessionTree\s*\n\s*key=\{currentProjectKey \?\? "no-project"\}/);
  assert.match(branch, /rows=\{dropdownRows\}/);
});
