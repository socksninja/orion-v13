# ORION v1.3 — Decision Engine

**Signal → Opportunity → Priority → Action**

ORION is an experimental decision-intelligence interface for turning uncertain opportunities into explicit next actions.

It is designed around a simple principle:

> Decision quality matters more than information volume.

## What it does

ORION ranks a set of opportunities and exposes the reasoning behind each recommendation:

- **Priority** — relative decision value
- **Confidence** — current confidence in the assessment
- **Decision** — `ACT NOW`, `VALIDATE NEXT`, or `WATCH`
- **Minimum validation** — the cheapest meaningful test
- **Success criteria** — what evidence would count as success
- **Falsifier** — what evidence would invalidate the thesis
- **Cost / time** — expected validation resources
- **Next action** — the immediate operational step

The interface is intentionally lightweight and currently runs entirely in the browser.

## Live demo

**Portfolio / Demo:** https://orionprojectintel.xyz/

**Repository:** https://github.com/socksninja/orion-v13

## Architecture

Current v1.3 implementation is deliberately small:

```text
Opportunity data
      ↓
Priority queue
      ↓
Decision detail
      ↓
Minimum validation
      ↓
Evidence / feedback
      ↓
Next action
```

The current prototype uses:

- HTML/CSS for the interface
- Vanilla JavaScript for the decision engine
- Client-side data structures for opportunity hypotheses
- No backend dependency in the prototype

## Decision model

ORION does not try to predict the future with certainty. Instead, it makes uncertainty explicit and converts it into a testable action.

Each opportunity contains:

```text
thesis
→ evidence
→ confidence
→ minimum test
→ success criteria
→ falsifier
→ next action
```

The intended loop is:

```text
Hypothesis → Test → Evidence → Decision update → Next test
```

## Why this project exists

Many information systems optimize for finding and displaying more information. ORION explores the opposite question:

**Given limited time, money, and attention, what should we do next?**

This project is an ongoing experiment in agentic workflows, evaluation, decision support, and operational intelligence.

## Current status

**Prototype / research project — v1.3**

The current implementation is intentionally simple. Future work may explore:

- LLM-assisted signal extraction
- Structured evidence ingestion
- Automated evaluation of decision quality
- Tool-using agents
- Persistent evidence and decision history
- Real-world validation loops
- APIs and external data sources

## Author

**Tang Yuanlong (唐袁隆)**

Independent AI Builder focused on agent systems, AI applications, decision intelligence, and automation.

- LinkedIn: https://www.linkedin.com/in/%E8%A2%81%E9%9A%86-%E5%94%90-110562428/
- GitHub: https://github.com/socksninja
- Portfolio: https://orionprojectintel.xyz/
- Email: 1164752614@qq.com

## Note

ORION is an independent experimental project. The example opportunities and scores included in the prototype are illustrative and are not presented as authoritative market research.
