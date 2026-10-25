# Fixing the faint-line artifact in "liquid glass" template apps

A runbook for the faint vertical/horizontal line that appears across panels when you
hover something elsewhere on the page. Applies to any app built from this frontend
template. Work through it in order — **Step 2 confirms the diagnosis before you change
anything**, which matters because the fix touches a lot of files.

---

## 1. Confirm you have this bug

The artifact is a **compositing seam**, not a border. It is this bug if:

- The line sits at a position **no CSS rule specifies** — measure it. If your table
  columns are 40/35/25, dividers belong at 40% and 75%. A line at ~57% is not a divider.
- It **continues through gaps** between elements, including over the page background
  between form fields. A border cannot do that.
- It appears or strengthens **on a repaint triggered elsewhere** — hovering a nav control,
  hovering a chart bar — even though the cursor never touches the affected panel.
- It sits at a **fixed screen position** and does not move when you scroll the panel's
  contents.

If instead the line is fixed to a column boundary and always visible, it is a real border
— see Step 6 rather than Step 4.

### Why it happens

`backdrop-filter` makes Chromium snapshot everything painted behind the element, blur it
on the GPU, and composite the result. That snapshot is rasterized in **tiles**. A Gaussian
blur at a tile edge needs pixels from outside the tile, so Chromium clamps at the
boundary, leaving a faint seam at a fixed absolute screen x. Nesting blur layers
multiplies it. The seam only becomes visible once the backdrop root re-composites — which
any hover with a `transform` or `box-shadow` change will do.

In this template the blurs are also **doing nothing**. The root container paints
`background: black` and no in-flow ancestor paints anything else, so blurring a uniform
black backdrop returns black. The glass look comes entirely from each element's own
translucent `background` + `border` + `box-shadow`. You are paying GPU cost and seams for
zero visual effect.

---

## 2. Reproduce and confirm — before editing anything

1. Run the app, find a panel showing the seam.
2. Open DevTools, hover the trigger (nav control, chart bar), confirm the line appears.
3. In the Styles panel, uncheck `backdrop-filter` on the panel's outermost container and
   on any nested ones. Hover again.
4. **The line should vanish.** If it does not, stop — you have a different problem, most
   likely `transform` on hover promoting a compositing layer. Do not proceed to Step 4.

Optional corroboration: DevTools → **Rendering** → enable *Layer borders* and *Paint
flashing*. The seam should coincide with a raster tile boundary, and the remote hover
should flash a repaint across the whole affected panel.

---

## 3. Inventory the blurs

From the frontend source root, with a clean git tree:

```bash
python3 - <<'PY'
import pathlib
for p in sorted(pathlib.Path("src").rglob("*.css")):
    sel, out = None, []
    for i, l in enumerate(p.read_text().splitlines(), 1):
        s = l.strip()
        if s.endswith("{"):
            sel = s[:-1].strip()
        if "backdrop-filter" in s and not s.startswith("-webkit"):
            out.append(f"  {i:>4}  {sel:<45} {s}")
    if out:
        print(p); print("\n".join(out))
PY
```

Read the output and sort every selector into keep or remove using the rule below.

---

## 4. The decision rule

> **Keep `backdrop-filter` only on elements that float over other page content.
> Remove it from every in-flow panel and control.**

**Keep** — these blur real content, which is the entire point:

- Modal scrims and dialog overlays (`*-overlay`, `*-backdrop`)
- Dropdown menus, popup menus, context menus
- Floating/fixed windows (log windows, toasts, banners)
- Chart tooltips

**Remove** — these sit on the opaque page background, so the blur is a no-op:

- Page-level panes, editor panes, cards, containers
- Tables and their headers, groups, group titles, rows
- Buttons, inputs, selectors, toggles, checkboxes, pills, progress bars
- Chart containers and legends

**Also remove when nested.** A blurred element inside an already-blurred parent samples
the parent's output; it adds a layer and a seam and nothing else. This includes cases you
would otherwise keep — e.g. a dialog inside its own blurred overlay: keep the overlay,
drop the dialog's own blur.

Verify the "no-op" claim for your app before trusting it: walk the ancestor chain of an
affected panel in DevTools and confirm the only painted background is the opaque root. If
some ancestor paints an image or gradient, the blur there is real and should be kept.

---

## 5. Apply

Save this as `fix-blurs.py` next to your `package.json`, then curate `KEEP` from your
Step 3 inventory — `(filename, selector)` pairs, matching the selector text exactly as
printed.

```python
import pathlib, sys

SRC = pathlib.Path("src")
if not SRC.is_dir():
    sys.exit("No ./src — run this from the frontend root (where package.json lives).")

KEEP = {
    ("App.css", ".version-warning"),
    ("PopUp.css", ".popup-backdrop"),
    ("Menu.css", ".menu-container"),
    ("LogWindow.css", ".log-window-container"),
    ("DropdownSelector.css", ".dropdown-menu"),
    ("FolderSelectionDialog.css", ".folder-selection-dialog-overlay"),
    ("LineChart.css", ".line-chart-tooltip"),
    ("PieChart.css", ".pie-chart-tooltip"),
    # ... add your app's overlays here
}

apply = "--apply" in sys.argv
removed = kept = 0
for p in sorted(SRC.rglob("*.css")):
    lines = p.read_text().splitlines(keepends=True)
    out, sel = [], None
    for l in lines:
        s = l.strip()
        if s.endswith("{"):
            sel = s[:-1].strip()
        if "backdrop-filter" in s:          # catches -webkit- too
            if (p.name, sel) in KEEP:
                kept += 1
            else:
                removed += 1
                print(f"{'REMOVE' if apply else 'would remove'}: {p} {sel}")
                continue
        out.append(l)
    if apply and "".join(out) != "".join(lines):
        p.write_text("".join(out))
print(f"\n{removed} to remove, {kept} kept.  {'APPLIED' if apply else 'DRY RUN — rerun with --apply'}")
```

Run the preview first, and **read the `would remove` list** — anything in it that floats
over content belongs in `KEEP`, so add it and re-preview until the list is clean:

```bash
python3 fix-blurs.py            # dry run
python3 fix-blurs.py --apply    # commit to it
```

Check nothing broke:

```bash
python3 -c "
import pathlib,re
[print('EMPTY RULE:',p,m.group(1).strip()) for p in pathlib.Path('src').rglob('*.css')
 for m in re.finditer(r'([^{}]+)\{\s*\}', p.read_text())]"
npm run build && npm run lint
```

Removing a whole rule's only declaration would leave an empty block — the scan above
catches that. It should print nothing.

---

## 6. Template bugs that travel with this one

These are in the shared components, so every app from this template has them. Each
independently produces something that reads as a "faint line".

### `.segment-control` missing `position: relative`

`SegmentControl.tsx` measures the active button's offset **relative to the control** and
writes it to `.segment-indicator { position: absolute }`. If the control itself is not
positioned, the browser resolves that `left` against the nearest positioned ancestor —
or the viewport — and the indicator paints somewhere else entirely, its 1px border
showing as a stray line. `overflow: hidden` on an intermediate container will *not* clip
it, because the clip only applies to descendants whose containing block is inside the
clipper.

Fix — add to `.segment-control`:

```css
position: relative;
```

While there, `z-index` and `align-items` on that rule are inert without `position` /
`display: flex`; drop them.

Check every instance renders correctly, not just the one you noticed — different
instances have different ancestors, so they fail differently.

### Semi-transparent chart hover fills over gridlines

`<CartesianGrid strokeDasharray="1 10" />` draws **vertical** gridlines (recharts defaults
`vertical` to `true`). If the bar hover colour is translucent, they show through the
highlight.

```tsx
<CartesianGrid strokeDasharray="1 10" vertical={false} />   // categorical x-axis
const HOVERED_COLOR = "rgb(10, 10, 10)";                    // opaque, was rgba(...,0.8)
```

### Doubled and misaligned table header dividers

If header cells carry **both** `border-left` and `border-right` while body cells carry
only `border-right`, every interior column boundary in the header is drawn twice, at
double opacity and double width. Drop `border-left` (and the now-dead `:first-child`
rule) so header and body dividers are built the same way.

A related ~1px horizontal offset appears when the header spans the full container but
rows sit inside a wrapper that has its own 1px border. Only worth chasing once the blur
seams are gone.

---

## 7. Verify

1. Re-check every original trigger — the seam should be **gone, not relocated**. A seam
   that moved is the same bug from a different layer; go back to Step 3.
2. Visit every segment, not just the one you were debugging.
3. Confirm the glass styling is unchanged: panels keep their translucent backgrounds,
   borders and shadows. Compare against a before screenshot.
4. Pay particular attention to the surfaces that **kept** their blur — popups, dropdowns,
   menus. Removing blur behind them changes what they composite against.
5. Confirm segment indicators sit under their active item in every control. Resize the
   window and switch segments to exercise the `ResizeObserver` repositioning.

---

## 8. Prevent regressions

Add to each app's `CLAUDE.md` / contributing notes:

> Glass panels get `background` + `border` + `box-shadow` only. Do not add
> `backdrop-filter` to in-flow panels or controls — the page background is opaque, so it
> has no visual effect, and it causes GPU raster-tile seams that show up as faint lines
> across unrelated panels on hover. `backdrop-filter` is reserved for elements that float
> over page content: modal scrims, dropdown menus, floating windows, chart tooltips.

If you want it enforced, a stylelint rule is the cheapest option — allow
`backdrop-filter` only in the files that hold your overlay components:

```json
{
  "rules": {
    "declaration-property-value-disallowed-list": { "backdrop-filter": [".+"] }
  },
  "overrides": [
    {
      "files": ["src/Components/{PopUp,Menu,LogWindow,DropdownSelector}.css"],
      "rules": { "declaration-property-value-disallowed-list": null }
    }
  ]
}
```
