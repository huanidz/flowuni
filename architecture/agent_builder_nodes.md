love it—your current setup is already 90% of the way there. you can add **Router** and **Aggregator** as *plain Process nodes* (no Tool mode needed) and keep everything DAG-oriented / code-first.

below are drop-in node classes that match your style (same `Node`, `NodeSpec`, handles, `process()` contract). they introduce **zero** framework magic beyond what you already have.

---

# RouterNode (thin switch / fan-out)

* **input**: one payload of any type (text/number/json/table)
* **config**: a simple **Rules table** (route, when, type, fanout)
* **outputs**: up to 4 named routes + a default
* **behavior**: evaluates rules top-down; sends the *same* payload to the matched outputs. (first match by default, or multiple if `fanout=true` per rule)

```python
# RouterNode
import json, re
from typing import Any, Dict, List
from pydantic import BaseModel
from src.nodes.NodeBase import Node, NodeSpec
from src.nodes.core.NodeInput import NodeInput
from src.nodes.core.NodeOutput import NodeOutput
from src.nodes.handles.basics.inputs.DynamicTypeInputHandle import DynamicTypeInputHandle, DynamicTypeItem
from src.nodes.handles.basics.inputs.TextFieldInputHandle import TextFieldInputHandle
from src.nodes.handles.basics.inputs.TableInputHandle import TableInputHandle, TableColumn, TableColumnDType
from src.nodes.handles.basics.outputs.DataOutputHandle import DataOutputHandle
from src.components.funcs.CalculatorNodeFuncs import safe_eval

class RouterNode(Node):
    """
    Routes a single incoming payload to one or more outputs based on rules.
    - Rule types: contains | regex | python
      * contains: substring (works on text or JSON-stringified)
      * regex: Python re.search on text or JSON-stringified
      * python: safe_eval('...', {'x': payload}) -> truthy means match
    - route: 1..4 or 'default'
    """
    spec: NodeSpec = NodeSpec(
        name="Router",
        description="Route the input to one or more outputs using simple rules.",
        can_be_tool=False,
        inputs=[
            NodeInput(
                name="payload",
                type=DynamicTypeInputHandle(type_options=[
                    DynamicTypeItem("Text", TextFieldInputHandle.__name__, TextFieldInputHandle()),
                    DynamicTypeItem("Json", TextFieldInputHandle.__name__,
                                    TextFieldInputHandle(multiline=True)),
                ]),
                description="Input payload (text or JSON).",
            ),
            NodeInput(
                name="rules",
                type=TableInputHandle(columns=[
                    TableColumn("route", "route", TableColumnDType.STRING),         # '1','2','3','4','default'
                    TableColumn("when", "when", TableColumnDType.STRING),           # predicate
                    TableColumn("type", "type", TableColumnDType.STRING),           # contains|regex|python
                    TableColumn("fanout", "fanout", TableColumnDType.BOOLEAN),      # true => keep matching
                ]),
                description="Routing rules (evaluated top-down).",
                allow_incoming_edges=False,
            ),
        ],
        outputs=[
            NodeOutput("to_1", DataOutputHandle(), "Route 1"),
            NodeOutput("to_2", DataOutputHandle(), "Route 2"),
            NodeOutput("to_3", DataOutputHandle(), "Route 3"),
            NodeOutput("to_4", DataOutputHandle(), "Route 4"),
            NodeOutput("default", DataOutputHandle(), "Default route"),
        ],
        parameters={
            "stringify_json": True,         # when payload is json text, try to json.loads before matching
            "first_match_only": True,       # stop at first match globally unless rule.fanout is True
        },
    )

    def _to_text(self, raw: Any, stringify_json: bool) -> str:
        if isinstance(raw, str):
            return raw
        if stringify_json:
            try:
                if isinstance(raw, (dict, list)):
                    return json.dumps(raw, ensure_ascii=False)
                # if it was given as text field but actually JSON string:
                return json.dumps(json.loads(str(raw)), ensure_ascii=False)
            except Exception:
                return str(raw)
        return str(raw)

    async def process(self, inputs: Dict[str, Any], parameters: Dict[str, Any]) -> Dict[str, Any]:
        payload = inputs.get("payload")
        rules: List[Dict[str, Any]] = inputs.get("rules") or []
        stringify = parameters.get("stringify_json", True)
        first_match_only = parameters.get("first_match_only", True)

        as_text = self._to_text(payload, stringify)
        routed: Dict[str, Any] = {}
        matched_any = False

        for row in rules:
            route = str(row.get("route", "")).strip().lower()   # '1','2','3','4','default'
            pred  = (row.get("when") or "").strip()
            typ   = (row.get("type") or "contains").strip().lower()
            fanout_rule = bool(row.get("fanout", False))

            is_match = False
            if typ == "contains":
                is_match = pred in as_text
            elif typ == "regex":
                try: is_match = re.search(pred, as_text) is not None
                except re.error: is_match = False
            elif typ == "python":
                # user expression like:  "isinstance(x, dict) and x.get('kind')=='math'"
                try: is_match = bool(safe_eval(pred, {"x": payload}))
                except Exception: is_match = False

            if is_match:
                matched_any = True
                key = f"to_{route}" if route in {"1","2","3","4"} else "default"
                routed[key] = payload
                if first_match_only and not fanout_rule:
                    break

        if not matched_any:
            routed["default"] = payload

        # emit only keys that were matched; engine will wire the ones connected
        return routed
```

**Why this works well in your DAG**

* Static outputs (`to_1..to_4, default`) = easy to wire in UI.
* Rules live in a Table = no new handles.
* Works for *any* upstream node (Agent/Processing/Tool).
* You can later add an optional “LLM policy” input that returns just the route label; no node shape changes.

---

# AggregatorNode (thin fan-in / select / reduce)

* **input**: N candidates connected to the same input (your framework already supports `allow_multiple_incoming_edges`)
* **strategies**: `first` / `vote` / `max_score` / `reduce`
* **extras**: optional `score_expr` (Python via `safe_eval`, variable `x`), and simple reducers

```python
# AggregatorNode
from typing import Any, Dict, List
from collections import Counter
from src.nodes.NodeBase import Node, NodeSpec
from src.nodes.core.NodeInput import NodeInput
from src.nodes.core.NodeOutput import NodeOutput
from src.nodes.handles.basics.inputs.DynamicTypeInputHandle import DynamicTypeInputHandle, DynamicTypeItem
from src.nodes.handles.basics.inputs.TextFieldInputHandle import TextFieldInputHandle
from src.nodes.handles.basics.inputs.DropdownInputHandle import DropdownInputHandle, DropdownOption
from src.nodes.handles.basics.outputs.DataOutputHandle import DataOutputHandle
from src.components.funcs.CalculatorNodeFuncs import safe_eval

def _deep_merge(a: Any, b: Any) -> Any:
    if isinstance(a, dict) and isinstance(b, dict):
        out = dict(a)
        for k, v in b.items():
            out[k] = _deep_merge(out[k], v) if k in out else v
        return out
    if isinstance(a, list) and isinstance(b, list):
        return a + b
    # fallback: prefer b
    return b

class AggregatorNode(Node):
    """
    Aggregates multiple incoming values.
    strategies:
      - first: first non-null
      - vote: majority vote for identical strings (case/space-insensitive)
      - max_score: pick candidate with highest score; score from x['score'] or score_expr
      - reduce: merge candidates (concat text / deep-merge json / stack lists)
    """
    spec: NodeSpec = NodeSpec(
        name="Aggregator",
        description="Aggregate multiple inputs by voting, scoring, or reducing.",
        can_be_tool=False,
        inputs=[
            NodeInput(
                name="candidates",
                type=DynamicTypeInputHandle(type_options=[
                    DynamicTypeItem("Text", TextFieldInputHandle.__name__, TextFieldInputHandle()),
                    DynamicTypeItem("Json", TextFieldInputHandle.__name__,
                                    TextFieldInputHandle(multiline=True)),
                ]),
                description="Connect many edges here; values are collected as a list.",
                allow_multiple_incoming_edges=True,
            ),
            NodeInput(
                name="strategy",
                type=DropdownInputHandle(options=[
                    DropdownOption("first","first"),
                    DropdownOption("vote","vote"),
                    DropdownOption("max_score","max_score"),
                    DropdownOption("reduce","reduce"),
                ]),
                description="Aggregation strategy.",
                allow_incoming_edges=False,
            ),
            NodeInput(
                name="score_expr",
                type=TextFieldInputHandle(),
                description="Python expr for max_score (variable: x). Example: x.get('score',0)",
                allow_incoming_edges=False,
            ),
            NodeInput(
                name="reduce_mode",
                type=DropdownInputHandle(options=[
                    DropdownOption("concat_text","concat_text"),
                    DropdownOption("merge_json","merge_json"),
                    DropdownOption("stack_list","stack_list"),
                ]),
                description="Reducer for 'reduce' strategy.",
                allow_incoming_edges=False,
            ),
        ],
        outputs=[NodeOutput("result", DataOutputHandle(), "Aggregated output.")],
        parameters={}
    )

    def _normalize_list(self, v: Any) -> List[Any]:
        # your engine will pass either a single value or a list when many incoming edges are present
        if v is None:
            return []
        if isinstance(v, list):
            return v
        return [v]

    async def process(self, inputs: Dict[str, Any], parameters: Dict[str, Any]) -> Dict[str, Any]:
        items = self._normalize_list(inputs.get("candidates"))
        strategy = (inputs.get("strategy") or "first").strip()
        score_expr = (inputs.get("score_expr") or "").strip()
        reduce_mode = (inputs.get("reduce_mode") or "concat_text").strip()

        # FIRST
        if strategy == "first":
            for it in items:
                if it is not None:
                    return {"result": it}
            return {"result": None}

        # VOTE (on strings)
        if strategy == "vote":
            texts = [str(x).strip().lower() for x in items if x is not None]
            if not texts:
                return {"result": None}
            [winner, _] = Counter(texts).most_common(1)[0]
            return {"result": winner}

        # MAX_SCORE (expects dicts OR a score_expr)
        if strategy == "max_score":
            best = None
            best_score = float("-inf")
            for x in items:
                try:
                    score = None
                    if score_expr:
                        score = float(safe_eval(score_expr, {"x": x}))
                    elif isinstance(x, dict):
                        score = float(x.get("score") or x.get("confidence") or 0.0)
                    else:
                        score = 0.0
                    if score > best_score:
                        best_score, best = score, x
                except Exception:
                    continue
            return {"result": best}

        # REDUCE
        if strategy == "reduce":
            if reduce_mode == "concat_text":
                return {"result": "\n\n".join([str(x) for x in items if x is not None])}
            if reduce_mode == "merge_json":
                merged = {}
                for x in items:
                    if isinstance(x, str):
                        try: x = json.loads(x)
                        except Exception: pass
                    if isinstance(x, dict):
                        merged = _deep_merge(merged, x)
                return {"result": merged}
            if reduce_mode == "stack_list":
                out: List[Any] = []
                for x in items:
                    if isinstance(x, str):
                        try: x = json.loads(x)
                        except Exception: pass
                    if isinstance(x, list):
                        out.extend(x)
                return {"result": out}
            return {"result": items}

        # fallback
        return {"result": items[0] if items else None}
```

---

# How these plug into your “one Agent + tools” example

**Goal:** keep your current flow, then branch results to specialists and merge them back—*without* touching Agent/Tool implementations.

```text
ChatInput → AgentNode(tools=[CalculatorTool, HttpRequestTool]) 
           → RouterNode (rules: if contains "calc" → to_1, if contains "http" → to_2, else default)
  to_1 ──▶ AgentNode(MathSpecialist) ┐
  to_2 ──▶ AgentNode(WebSpecialist)  ├─▶ AggregatorNode(strategy="first") ─▶ ChatOutput
default ─▶ AgentNode(Generic)       ┘
```

* Router just forwards the **same payload** to whichever branch matches.
* Aggregator collects whichever branch finishes first (or you can pick `max_score` or `reduce`).

---

# Why this keeps your app simple

* **No new runtime concepts.** Both nodes are just `process()` with typed I/O like your others.
* **Static ports.** Easy to render in the UI; rules decide which ports fire.
* **Compatible with anything.** They pass through any payload (string/number/json/table).
* **Composability.** These two cover sequential, handoff, orchestrator-worker, maker-checker, debate/committee (just switch `strategy`).

---

# Quick wiring example (pseudo)

```python
# Build tools as you do today
calc_tool = CalculatorNode().build_tool(inputs_values={}, tool_configs=ToolConfig(tool_name="Calc"))
http_tool = HttpRequestNode().build_tool(inputs_values={}, tool_configs=ToolConfig(tool_name="HTTP"))

# Agent with tools
agent = AgentNode()
# agent.inputs["tools"] gets many incoming edges; your framework already merges them
# (AgentToolInputHandle → JSON string list; unchanged)

# Router rules
router_rules = [
    {"route": "1", "when": "calc", "type": "contains", "fanout": False},
    {"route": "2", "when": "http", "type": "contains", "fanout": False},
    {"route": "default", "when": "", "type": "contains", "fanout": False},
]

# Aggregator config
agg_strategy = "first"  # or "max_score" with score_expr="x.get('score',0)"

# Edges (conceptual)
# Chat -> Agent -> Router
# Router.to_1 -> MathSpecialist
# Router.to_2 -> WebSpecialist
# Router.default -> Generic
# MathSpecialist/ WebSpecialist / Generic -> Aggregator.candidates (many incoming)
# Aggregator.result -> ChatOutput
```

---

## tips / guardrails

* Start with `strategy="first"` in Aggregator to get a “works by default” experience.
* Use `route in {"1","2","3","4","default"}` to keep the UI simple; you can add more outputs later.
* Keep Router/Aggregator **non-tool** to avoid conflating tool schemas with orchestration.
* If a node output is not connected, returning a key for it is harmless—your engine simply doesn’t propagate it.

---

if you want, I can adapt these to your exact handle classes (e.g., add a `Boolean`/`Dropdown` handle for `strategy`, or make Router support an optional **LLM policy** input that returns `{'route': '1'}`) — but the above will work with your current code-first model as-is.
