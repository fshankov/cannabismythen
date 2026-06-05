#!/usr/bin/env python3
"""
fix-pdf-outline.py — rebuild a clean PDF outline (bookmark tree) for the
myth-factsheet PDF.

Chromium's `page.pdf({outline:true})` builds the outline from visible
<h1>/<h2> headings, which gives correct page DESTINATIONS but mangles the
bookmark TITLE (it drops the space at soft-wrap boundaries, e.g.
"therapeutischerNutzen"). We keep Chromium's destinations (read in DFS
order) and overwrite the titles positionally with the canonical strings
passed from the generator, then prepend/append front-/back-matter entries.

Usage: fix-pdf-outline.py <in.pdf> <titles.json> <out.pdf>
titles.json = { "front":[{title,page}], "items":[{level,title}], "back":[{title,page}] }
  page is a 0-based index; page=-1 in "back" means the last page.

Exits non-zero (and the generator falls back to Chromium's raw outline)
if pypdf is missing or the destination/title counts don't line up.
"""
import json
import sys

try:
    from pypdf import PdfReader, PdfWriter
    from pypdf.generic import NameObject
except Exception as e:  # pragma: no cover
    print(f"fix-pdf-outline: pypdf unavailable ({e})", file=sys.stderr)
    sys.exit(2)


def flatten(outline):
    """Chromium outline as nested lists → flat DFS list of Destination items."""
    out = []
    for o in outline:
        if isinstance(o, list):
            out += flatten(o)
        else:
            out.append(o)
    return out


def main():
    in_pdf, titles_json, out_pdf = sys.argv[1], sys.argv[2], sys.argv[3]
    spec = json.load(open(titles_json, encoding="utf-8"))

    reader = PdfReader(in_pdf)
    dests = flatten(reader.outline)
    dest_pages = [reader.get_destination_page_number(d) for d in dests]

    items = spec["items"]
    if len(dest_pages) != len(items):
        print(
            f"fix-pdf-outline: outline count mismatch "
            f"(chromium={len(dest_pages)} canonical={len(items)})",
            file=sys.stderr,
        )
        sys.exit(3)

    writer = PdfWriter(clone_from=reader)
    if "/Outlines" in writer._root_object:
        del writer._root_object["/Outlines"]
    writer._root_object[NameObject("/PageMode")] = NameObject("/UseOutlines")

    for f in spec.get("front", []):
        writer.add_outline_item(f["title"], f["page"])

    parent = None
    for it, page in zip(items, dest_pages):
        if it["level"] == 1:
            parent = writer.add_outline_item(it["title"], page)
        else:
            writer.add_outline_item(it["title"], page, parent=parent)

    last = len(writer.pages) - 1
    for b in spec.get("back", []):
        writer.add_outline_item(b["title"], b["page"] if b["page"] >= 0 else last)

    with open(out_pdf, "wb") as fh:
        writer.write(fh)
    print(f"fix-pdf-outline: rebuilt {len(items)} items "
          f"({sum(1 for i in items if i['level']==1)} categories)")


if __name__ == "__main__":
    main()
