---
schema: pixie/docs/pixie_self_mk2_tuning_landed/ai-native/1
last_updated: 2026-05-02
ssot:
  marker: state/markers/pixie_self_mk2_tuning_landed.marker
  roadmap_dir_pattern: <repo>/.roadmap.<domain>
  baseline_ai_native: (none yet — pixie has no .ai-native-readme-baseline)
status: AUDIT_LANDED_SPEC_ONLY
related_raws:
  - raw 9    # hexa-only orchestration (audit-only, no impl emitted)
  - raw 10   # honest C3 caveats inline
  - raw 11   # snake_case
  - raw 15   # env() lazy + <user> placeholder
  - raw 168  # minimum-viable exempt (small repo)
  - raw 175  # BR-NO-USER-VERBATIM (no verbatim user quotes in this doc)
  - raw 270  # ai-native readme triplet (audit + new candidates)
  - raw 271  # core+module pattern (audit + new candidates)
  - raw 272  # lint extension
  - raw 273  # hierarchy connection direction
preserved_unchanged:
  - bin/pixie (190 LoC python CLI)
  - config/topics.json (38 LoC SSOT)
  - worker/src/{index,gateway-do,mentions,topics}.js (636 LoC)
  - worker/scripts/register.mjs (56 LoC)
  - discord-translator/src/{index,gateway,translator,discord,lang,verify,register}.ts (604 LoC)
  - discord-translator/{wrangler.toml,package.json,README.md}
  - worker/{wrangler.toml,package.json}
  - brand/* (9 SVG/PNG assets)
  - LICENSE, README.md, .gitignore
policy:
  migration: forbidden
  changes: additive_only
  in_place_writes: zero
  destructive_ops: zero
  cost_usd: 0
  substrate: mac-local
---

# pixie self mk2 tuning — domain audit + new .roadmap.<domain> candidates + raw 270 triplet plan

## TL;DR

pixie repo (320M, 1524 LoC across 14 source files) 는 mk1 narrative `.roadmap` 만 가지고 있었으나
HEAD 시점에 working tree 에서 deleted 상태 (Phase A → C 텍스트). mk2 `.roadmap.<domain>` JSONL system 으로
mirror 된 entry 는 **0건**. 본 audit 는 pixie 의 4 production surface 를 mk2 후보로 정리한다:

- **추가 권고 신규 .roadmap.<domain>** = 4개 (`pixie_cli`, `pixie_worker`, `pixie_translator`, `pixie_brand`) — spec only emit, 실제 .roadmap.* 파일 생성 X (additive only, 사용자 lock-in 후 별도 cycle).
- **raw 270/271 triplet 적용 audit** = 4 surface 모두 README.ai.md 미적용. priority rank A/B/C.
- **마이그레이션 0건 emit**, in-place write 0건, additive only.

기존 file (14 source + brand assets + 2 README.md + 2 wrangler.toml + 2 package.json + LICENSE) 모두 무수정 보존.
본 doc + marker 1개만 신규 생성. handoff doc only — 사용자 응답 X (bg subagent → 메인 monitor).

## §0 anima audit 와의 관계

본 audit 는 `anima/docs/anima_self_mk2_tuning_landed_2026_05_02.ai.md` (anima 측 26 .roadmap.<domain> + 9 후보)
와 동일 schema (raw 270 triplet + spec-only emit + additive only) 를 pixie repo 에 sibling 적용한 것.
pixie 는 anima 와 달리:

- mk1 .roadmap 이 narrative-only (Phase A→C, 49 lines) 이고 entry 화 미수행.
- HEAD 시점에 working tree 에서 deleted (committed history 에는 존재 — `git show HEAD:.roadmap` 로 readable).
- mk2 .roadmap.<domain> 0건 land.

따라서 pixie 의 mk2 land 은 처음부터 수행하는 그린필드 케이스. 4 후보는 모두 sibling top-dir 매핑.

## §1 Existing .roadmap.* inventory (audit, 0개)

```
pixie/.roadmap.*  →  0 files
pixie/.roadmap    →  deleted in working tree, present in HEAD blob (49 LoC narrative)
```

mk1 narrative `.roadmap` (HEAD blob) 핵심:

| Phase | desc | 권장 mk2 매핑 |
|---|---|---|
| Status 2026-04-24 | 5 ✓ checklist (topics SSOT / Worker / /explain / DO gateway / mentions) | pixie_cli + pixie_worker 의 cond 충족 evidence |
| Phase A | public HTTP API (`/api/projects`, `/api/project/<name>`) | pixie_worker.cond.{N} 미land 후보 |
| Phase B | (skip) — LLM 금지 (Anima 영역 보존) | (no cond — explicit non-goal) |
| Phase C | MCP server (list/get/search_projects) | pixie_worker.cond.{N+1} 미land 후보 |
| Phase D | Anima land 시 defer | cross-link only (anima.cond.* 의존) |

## §2 pixie self surface — 4 권고 신규 도메인 후보 (spec only, .roadmap.* 신규 emit X)

| rank | domain candidate | top dir | LoC | 핵심 unmet condition (예시) | 권장 cond.N |
|---|---|---|---:|---|---:|
| A | `pixie_cli` | bin/ + config/ | 228 (190 py + 38 json) | (1) topic-sync idempotent dry-run PASS / (2) channels --save round-trip / (3) welcome DM end-to-end | 3 |
| A | `pixie_worker` | worker/ | 692 (4 js + 1 mjs) | (1) Phase A: `/api/projects` + `/api/project/<name>` live HTTP / (2) Phase C: MCP `/mcp` tools (list/get/search) / (3) DO gateway READY + circuit-breaker survives eviction | 3 |
| B | `pixie_translator` | discord-translator/ | 604 (7 ts) | (1) auto-translate ko↔en MESSAGE_CREATE → thread / (2) reaction-translate 🇰🇷/🇺🇸/🇬🇧 → translation / (3) DO heartbeat zombie auto-reconnect (4000 close → resume) | 3 |
| C | `pixie_brand` | brand/ + README assets | 9 assets | (1) brand asset checksum manifest / (2) Discord server icon 1024+512 sync / (3) banner 960x540 + retina 1920x960 distinct | 3 |

전체 4 후보 × 평균 3 condition = **12 새 required_conditions** 가 사용자 lock-in 시 추가될 수 있음.

### §2.1 후보 우선순위 rationale

- **rank A** (pixie_cli / pixie_worker) = pixie 의 핵심 production surface. CLI 는 channel topic SSOT
  enforcement (idempotent), worker 는 Phase A/C public/MCP API 가 mk1 roadmap 의 actionable 부분.
- **rank B** (pixie_translator) = 별도 sub-project (own README + own wrangler.toml + own deploy 경로).
  현재 LIVE 운영 중이므로 cond 화 가치는 높지만 pixie 본체 (channel secretary) 와는 sibling 관계.
- **rank C** (pixie_brand) = 9 brand asset (need-singularity-* SVG/PNG). 단일 condition cluster 화 가능,
  하지만 production gate 의미는 약함. raw 168 minimum-viable exempt 권장.

### §2.2 spec-only emit policy (사용자 lock-in 대기)

본 audit 는 **신규 .roadmap.<domain> 파일 0건 생성**. 사용자가 다음 cycle 에서:

1. 4 후보 중 어떤 것을 land 할지 선별 (예: rank A 2개만)
2. 각 cond.N 의 verifier seam 결정 (script / cross-link / manual)
3. blocker_reason / cross_link / eta 구체화

후 별도 cycle 에서 mk2 schema 로 안전 emit 권장. mk1 narrative `.roadmap` (49 LoC, working tree
deleted) 은 commit history 에 보존 — restore 여부도 사용자 lock-in 사항.

## §3 raw 270 triplet plan — 4 후보 surface 의 ai-native readme audit

### §3.1 현황 (0 README.ai.md land at audit time)

```
pixie/**/README.ai.md  →  0 files
pixie/.ai-native-readme-baseline  →  not present
pixie/README.md         →  human-facing, 91 LoC
pixie/discord-translator/README.md  →  human-facing, 162 LoC
```

raw 271 baseline 는 pixie 에 미land — promotion-day (2026-06-01) 까지 30d ramp window 안에서 결정 필요.

### §3.2 4 후보 surface 의 raw 270/271/272/273 적용 audit

| candidate | top dir | core/ 존재 | modules/ 존재 | README.ai.md | 권장 triplet 작업 |
|---|---|---|---|---|---|
| pixie_cli | bin/ + config/ | X (single 190-LoC python file) | X | NONE | T0: raw 168 minimum-viable exempt 강력 권장 (single-file CLI + 1 JSON SSOT) |
| pixie_worker | worker/src/ | partial (`index.js` = entry) | partial (`gateway-do.js` / `mentions.js` / `topics.js` 가 module) | NONE | T1: worker/src/README.ai.md 1 + 4 module file 의 module-level header |
| pixie_translator | discord-translator/src/ | partial (`index.ts` = entry) | partial (6 sub-module ts) | NONE | T1: discord-translator/src/README.ai.md 1 + 6 module file 의 module-level header |
| pixie_brand | brand/ | X | X (flat 9 assets) | NONE | T0 deferred — raw 168 minimum-viable exempt (asset-only directory) |

T0 = 0-1 README, T1 = 1 README + 분할 spec, T2 = sub-dir 별 README + roll-up.

### §3.3 raw 270/271 promotion timeline 와의 관계

`raw_270_271_warn_to_block_promotion_design.md` (hive 측 land 2026-05-02) 에 따르면:

- 2026-05-02 ~ 2026-06-01 = **30d ramp window** (warn severity, baseline grandfather active)
- 2026-06-01 = **promotion-day** (warn → block, baseline read-only, pre-commit reject)
- 2026-06-01 ~ 2026-12-01 = **drift watch** (월간 cron)
- 2026-12-01 = **baseline retire decision**

본 audit 4 후보 surface 의 ramp window 내 권장:

- **rank A pixie_cli** = T0 minimum-viable exempt 권장 (single-file Python CLI).
- **rank A pixie_worker** = T1 적용 권장 (4 module → 명확한 분할 + entry point 존재).
- **rank B pixie_translator** = T1 적용 권장 (6 module ts + 자체 README.md 이미 풍부).
- **rank C pixie_brand** = T0 minimum-viable exempt 권장 (asset-only dir).

### §3.4 triplet plan emit (impl 미수행)

본 doc 은 spec emit 만. 실제 README.ai.md 신규 생성은:

1. 사용자 lock-in (어떤 surface 를 어느 tier 로)
2. 별도 cycle 작업 (하나하나 land + raw 271 lint PASS + marker)

priority order = (A pixie_worker T1) → (B pixie_translator T1) → (A pixie_cli T0 exempt 결정) →
(C pixie_brand T0 exempt 결정).

## §4 cross-link 정합 audit

### §4.1 mk1 narrative `.roadmap` (HEAD blob) 와의 cross-link 후보

- mk1 Phase A (public HTTP API) ↔ 신규 `.roadmap.pixie_worker.cond.1` (verifier: curl `/api/projects` 200 + json
  response shape).
- mk1 Phase C (MCP server) ↔ 신규 `.roadmap.pixie_worker.cond.2` (verifier: MCP `tools/list` response 검증).
- mk1 Status 5 ✓ (topic SSOT / Worker / /explain / DO gateway / mentions) ↔ 신규 `.roadmap.pixie_cli.cond.1`
  + `pixie_worker.cond.3` 의 evidence 항목.
- mk1 Phase D (defer to Anima) ↔ anima 측 `.roadmap.serving.cond.*` (sibling cross-link, anima self
  surface 의 endpoint live 와 연동).

### §4.2 anima 측 .roadmap.<domain> 와의 cross-link 후보

- `anima/.roadmap.serving` (anima 측 권고 후보 rank A) ↔ pixie `pixie_worker` (Phase A public HTTP API 로
  anima endpoint 와 sibling — `/api/projects` 가 anima 측 model serving 의 discovery 역할).
- `anima/.roadmap.voice` ↔ pixie `pixie_translator` (둘 다 Discord 관련 surface, 그러나 다른 LLM 사용 —
  anima voice = 자체 stack, pixie_translator = Anthropic Haiku).
- `anima/.roadmap.<domain>` 측 어떤 entry 도 pixie 측 surface 를 verifier 로 호출하지 않음 — pixie 는 순수
  consumer-side surface (channel ops + translation) 이며 anima production gate 와 직접 관계 X.

### §4.3 mk1 → mk2 backport (P5, deferred)

mk1 `.roadmap` (49 LoC, HEAD blob) 의 5 ✓ + 4 phase entry 추출 → mk2 schema entry 화는 별도 cycle.
working tree restore 여부는 사용자 lock-in 사항 (현재 deleted 상태).

## §5 4 후보 surface verifier seam 권고

각 권고 신규 .roadmap.<domain> cond.N 의 verifier seam 후보 (사용자 lock-in 시 선택):

| domain | seam type 후보 |
|---|---|
| pixie_cli | (a) script: `bin/pixie topic-sync --dry-run` exit 0 + summary line parse / (b) marker: state/pixie.log 의 `✓ topic-sync` line 존재 |
| pixie_worker | (a) script: `curl -fsS https://pixie.dancinlife.workers.dev/api/projects` 200 / (b) cross-link: anima.serving.cond.* (sibling endpoint) / (c) `npx wrangler tail` 로 DO `gateway READY` line 검증 |
| pixie_translator | (a) script: `npx wrangler tail` 로 `gateway READY` + 첫 MESSAGE_CREATE → translation thread post 검증 / (b) cross-link: anima.voice.cond.* (sibling) / (c) Anthropic API key health check |
| pixie_brand | (a) script: brand/ 9 asset SHA256 manifest match / (b) Discord guild icon REST GET 검증 (현재 1024 PNG) |

verifier=`""` (공란) 도 mk2 schema 상 valid (anima 측 다수 entry 가 그렇게 land) — script 없을 때 manual
override 경로 (state/pixie_<domain>_verify_manual_review.jsonl) 만 land 도 ok.

## §6 raw#10 honest C3 (10 caveat)

C1 — 본 audit 는 **spec emit only**. .roadmap.<domain> 신규 파일 0건 생성, README.ai.md 0건 추가.
사용자 lock-in 후 별도 cycle 필요.

C2 — 4 후보 도메인은 **권고**일 뿐 사용자가 다른 cluster 화 (예: pixie_cli + pixie_worker 통합 = `pixie_core`,
또는 pixie_translator 를 별도 repo 분리) 도 가능. 4 = 단순 top-dir 매핑 heuristic.

C3 — `pixie_brand` 는 asset-only dir → mk2 cond 화 가치 낮음. raw 168 minimum-viable exempt 우선 권장.
rank C 최후순위.

C4 — pixie 의 `state/` 는 `.gitignore` (line 7) 로 제외 — marker file 은 local-only audit trail.
git commit 대상 X. 본 audit 의 marker 도 local-only 로 emit (anima 와 동일 정책).

C5 — mk1 narrative `.roadmap` (49 LoC) 가 working tree 에서 `git status` 상 `deleted` 상태 — restore 여부
미결. 본 audit 는 HEAD blob `git show HEAD:.roadmap` 으로 cross-link audit 수행 (§1, §4.1).

C6 — `pixie_translator` 는 LIVE 운영 중 (Cloudflare Worker + Anthropic Haiku 4.5) — cond.N verifier 가
실제 LIVE traffic 을 의존하므로 ramp 안에서 stable PASS 보장 X. cron `*/1` (1 min) wake interval 의 비용
고려 사항 있음 (Workers Paid plan $5/mo + Haiku 사용량).

C7 — pixie_worker 의 mk1 Phase A (public HTTP API) 는 **미구현** — 현재 worker `/` GET 는 hint page 만,
`/api/projects` endpoint 미존재. cond.1 verifier 는 미구현 endpoint 를 expect 하므로 land 시 reject 예상.

C8 — pixie_worker mk1 Phase C (MCP server) 도 **미구현** — 동일 caveat.

C9 — verifier seam 권고 (§5) 의 (a) script 후보 일부는 미작성 가능성 (예: brand/ SHA256 manifest 미생성).

C10 — env() lazy + <user> placeholder convention (raw 15) — 본 doc 의 모든 path `/Users/ghost/...` 는
`/Users/<user>/...` placeholder 를 의도하나, 본 doc 자체는 사용자 별 path 절대 인용 X — 모든 anchor 는
`pixie/...` repo-relative 로 표기.

## §7 BR-NO-USER-VERBATIM 준수 confirmation

본 doc 은 사용자 prompt 내용을 verbatim 으로 인용하지 않음 (raw 175 BR-NO-USER-VERBATIM-RECORDING). prompt
요약/재구성으로만 land. handoff doc only 정책에 따라 사용자 directive 도 자체 paraphrase 만 기록.

## §8 friendly preset compliance

본 doc 은 handoff doc 으로서 친절-preset 적용:

- TL;DR 최상단 5 줄
- 모든 §-section 표 (table) 우선
- 4 후보 priority rank A/B/C 으로 actionable
- raw#10 caveats (C1-C10) inline
- 마지막 next step 명시 (사용자 lock-in 대기)

## §9 Marker 1개 emit

```
state/markers/pixie_self_mk2_tuning_landed.marker
```

## §10 Next-cycle (사용자 lock-in 후)

1. 4 후보 중 land 할 도메인 선별 (rank A 2개 권장 baseline = pixie_cli + pixie_worker)
2. 각 도메인 cond.N + verifier seam (§5 선택지 중)
3. mk2 schema 로 신규 .roadmap.<domain> emit (cycle 별 hexa-only 또는 직접 JSONL 작성)
4. (병렬) raw 270 triplet 작업 — rank A pixie_worker 부터 README.ai.md + entry+module 분할
5. mk1 → mk2 backport P5 (별도 cycle, 49 LoC narrative entry 추출 + working tree restore 결정)
6. (선택) Phase A `/api/projects` + Phase C MCP `/mcp` 실제 구현 (cond.N PASS 가능 상태 만들기)

## §11 file index (sha-pin at land time)

| path | type | size_b | LOC | sha256_hex |
|---|---|---:|---:|---|
| docs/pixie_self_mk2_tuning_landed_2026_05_02.ai.md | doc | TBD | TBD | (set after write) |
| state/markers/pixie_self_mk2_tuning_landed.marker | marker | TBD | TBD | (set after write) |

(file index sha pin 은 marker 안에 emit — 본 §11 은 spec only, write 후 marker 가 sha 확정)

## §12 policy summary

- migration: forbidden — 0건 emit
- additive only — 14 source files + brand/9 asset + 2 README.md + 2 wrangler.toml + 2 package.json + LICENSE
  무수정 보존
- destructive ops — 0건
- in-place writes — 0건 (handoff doc + marker 2 NEW only)
- substrate — mac-local
- cost — $0
- raw 9 hexa-only orchestration — audit 자체는 hexa orchestrator 미사용 (read-only directory audit + spec emit
  만 = single-doc exempt per raw 168 minimum-viable; pixie 는 hexa-lang 에 의존하지 않음)
- raw 12 silent-error ban — 본 audit 는 single-shot, error path X
- raw 15 env() lazy + <user> — 모든 doc-internal path repo-relative, 절대 path X
- raw 175 BR-NO-USER-VERBATIM — 사용자 prompt 직접 인용 0건
- friendly preset — handoff doc only (사용자 응답 X — bg subagent → 메인 monitor)
