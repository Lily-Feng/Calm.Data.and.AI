#!/usr/bin/env python3
"""Validate data-ai-knowledge-graph.yaml and regenerate its two exports.

    python3 scripts/export-knowledge-graph.py          # validate + write
    python3 scripts/export-knowledge-graph.py --check  # validate + fail if exports are stale

The YAML is the source of truth. `data-ai-knowledge-graph.json` and
`js/data-ai-knowledge-graph.js` are byte-for-byte derived from it, so the
homepage keeps working without a YAML parser in the browser. This is an
authoring tool (needs PyYAML), not part of the deploy path.
"""
import json
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "data-ai-knowledge-graph.yaml"
JSON_OUT = ROOT / "data-ai-knowledge-graph.json"
JS_OUT = ROOT / "js" / "data-ai-knowledge-graph.js"
WHERE = {"inside", "beside", "none"}


def validate(graph):
    errors = []
    ids = {}

    def claim(node_id, kind):
        if node_id in ids:
            errors.append(f"duplicate id {node_id!r} ({ids[node_id]} and {kind})")
        ids[node_id] = kind

    def check_lens(owner, lens, allow_where):
        if lens is None:
            return
        if allow_where:
            if not isinstance(lens, dict) or lens.get("where") not in WHERE or not lens.get("name"):
                errors.append(f"{owner}: mstr needs where ({'/'.join(sorted(WHERE))}) and name")
        elif not isinstance(lens, str):
            errors.append(f"{owner}: topic mstr must be a short string")

    for layer in graph["layers"]:
        claim(layer["id"], "layer")
        if "mstr" in layer and not layer["mstr"].get("summary"):
            errors.append(f"{layer['id']}: layer mstr needs a summary")
        for group in layer["sub_domains"]:
            claim(group["id"], "sub_domain")
            check_lens(group["id"], group.get("mstr"), True)
            for topic in group["topics"]:
                if set(topic) - {"id", "name", "mstr", "facets"}:
                    errors.append(f"{topic.get('id')}: unexpected keys {sorted(set(topic) - {'id', 'name', 'mstr', 'facets'})}")
                claim(topic["id"], "topic")
                check_lens(topic["id"], topic.get("mstr"), False)
    for concern in graph["concerns"]:
        claim(concern["id"], "concern")
        check_lens(concern["id"], concern.get("mstr"), True)
        for topic in concern["topics"]:
            claim(topic["id"], "topic")
            check_lens(topic["id"], topic.get("mstr"), False)

    edge_types = set(graph["schema"]["edge_types"])
    for edge in graph["edges"]:
        for end in ("from", "to"):
            if ids.get(edge[end]) != "topic":
                errors.append(f"edge {edge['from']} -> {edge['to']}: {end} is not a topic")
        if edge["type"] not in edge_types:
            errors.append(f"edge {edge['from']} -> {edge['to']}: unknown type {edge['type']!r}")
    return errors, sum(1 for kind in ids.values() if kind == "topic")


def main():
    graph = yaml.safe_load(SOURCE.read_text())
    errors, topics = validate(graph)
    if errors:
        print("\n".join(errors), file=sys.stderr)
        sys.exit(1)

    json_text = json.dumps(graph, indent=2, ensure_ascii=False) + "\n"
    js_text = "window.DATA_AI_KNOWLEDGE_GRAPH = " + json.dumps(graph, separators=(",", ":"), ensure_ascii=False) + ";\n"
    groups = sum(len(layer["sub_domains"]) for layer in graph["layers"])
    summary = f"{topics} topics · {groups} sub-domains · {len(graph['concerns'])} concerns · {len(graph['edges'])} edges"

    if "--check" in sys.argv:
        stale = [p.name for p, text in ((JSON_OUT, json_text), (JS_OUT, js_text)) if p.read_text() != text]
        if stale:
            print(f"stale exports: {', '.join(stale)} — run without --check", file=sys.stderr)
            sys.exit(1)
        print(f"exports current · {summary}")
        return

    JSON_OUT.write_text(json_text)
    JS_OUT.write_text(js_text)
    print(f"wrote {JSON_OUT.name} and js/{JS_OUT.name} · {summary}")


if __name__ == "__main__":
    main()
