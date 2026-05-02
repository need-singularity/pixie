---
schema: pixie/docs/pixie_rank_a_2_domain_landed/ai-native/1
last_updated: 2026-05-03
ssot:
  marker: state/markers/pixie_rank_a_2_domain_landed.marker
  roadmap_dir_pattern: <repo>/.roadmap.<domain>
  baseline_ai_native: (none yet — pixie has no .ai-native-readme-baseline)
status: RANK_A_2_DOMAIN_LANDED
predecessor:
  doc: docs/pixie_self_mk2_tuning_landed_2026_05_02.ai.md
  marker: state/markers/pixie_self_mk2_tuning_landed.marker
  status: AUDIT_LANDED_SPEC_ONLY
  candidate_count: 4 (rank A 2 + rank B 1 + rank C 1)
related_raws:
  - raw 9    # hexa-only orchestration (audit-only, no impl emitted)
  - raw 10   # honest C3 caveats inline
  - raw 11   # snake_case
  - raw 15   # env() lazy + <user> placeholder
  - raw 168  # minimum-viable exempt (single-file CLI)
  - raw 175  # BR-NO-USER-VERBATIM (no verbatim user quotes)
  - raw 270  # ai-native readme triplet (pending T0/T1)
  - raw 271  # core+module pattern (pending T1 worker)
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
  - mk1 narrative .roadmap (HEAD blob 49 LoC, working tree deleted — restore X)
policy:
  migration: forbidden
  changes: additive_only
  in_place_writes: zero
  destructive_ops: zero
  cost_usd: 0
  substrate: mac-local
---

# pixie rank A 2 domain landed — pixie_cli + pixie_worker mk2 .roadmap.<domain> JSONL

## TL;DR

predecessor audit (`pixie_self_mk2_tuning_landed_2026_05_02.ai.md`) 가 4 후보 (rank A 2 + B 1 + C 1) 를
spec-only emit 했고, 본 cycle 이 **rank A 2 = `pixie_cli` + `pixie_worker`** 의 mk2 `.roadmap.<domain>`
JSONL header 를 land. 각 file = 1 header + 3 required_conditions (mix met/partial/unmet) + 1 blocker
(Phase A HTTP / welcome e2e).

신규 emit:
- `.roadmap.pixie_cli` — peer perspective, CLI 5 commands (channels / topic-sync / welcome / apply-full / version) + entry seam
- `.roadmap.pixie_worker` — peer perspective, /wake + /hint + Phase A HTTP + Phase C MCP + DO gateway READY
- handoff doc (this file) + marker 1개

기존 file (14 source + brand assets + 2 README.md + 2 wrangler.toml + 2 package.json + LICENSE + mk1 narrative
.roadmap working-tree-deleted state) 모두 무수정 보존. rank B (`pixie_translator`) + rank C (`pixie_brand`)
는 후속 cycle 대기 (사용자 lock-in 시).

## §0 predecessor 와의 관계

| item | predecessor (2026-05-02) | this cycle (2026-05-03) |
|---|---|---|
| status | AUDIT_LANDED_SPEC_ONLY | RANK_A_2_DOMAIN_LANDED |
| .roadmap.<domain> 신규 file | 0 (spec-only) | 2 (pixie_cli + pixie_worker) |
| candidate domain count | 4 (rank A/A/B/C) | 2 land + 2 deferred |
| README.ai.md 신규 emit | 0 | 0 (raw 270 triplet 별도 cycle) |
| handoff doc | docs/pixie_self_mk2_tuning_landed_2026_05_02.ai.md (16280 b) | docs/pixie_rank_a_2_domain_landed_2026_05_03.ai.md (this) |
| marker | state/markers/pixie_self_mk2_tuning_landed.marker | state/markers/pixie_rank_a_2_domain_landed.marker |

predecessor 의 §10 next-cycle action 1 (4 후보 중 land 할 도메인 선별 — rank A 2개 권장 baseline) +
action 2 (각 cond.N + verifier seam §5 선택지 중) 를 본 cycle 이 실행.

## §1 신규 .roadmap.<domain> 2 file inventory

### §1.1 file index (sha-pin at land time)

| path | type | size_b | LOC | sha256_hex (head 12) |
|---|---|---:|---:|---|
| .roadmap.pixie_cli | jsonl_with_comments | 4555 | 3 | 86b4b17feb1e |
| .roadmap.pixie_worker | jsonl_with_comments | 6093 | 3 | 5918c181eda0 |
| docs/pixie_rank_a_2_domain_landed_2026_05_03.ai.md | doc | (set after write) | (set) | (set) |
| state/markers/pixie_rank_a_2_domain_landed.marker | marker | (set after write) | (set) | (set) |

각 .roadmap = `# header comment` 2 line + JSONL 1 line (header object 안에 conditions + blocker array
inline) = 총 3 line.

### §1.2 schema 준수

`anima/.roadmap.serving` (peer perspective sibling 예시) 와 동일 schema:
- header: `type=header / kind=domain / name / mk=2 / perspective=peer / goal / required_conditions[] / cross_link{} / blockers[] / status=active / since=2026-05-03`
- required_conditions[i]: `id / desc / verifier{type,path,...} / status / evidence[] / blocker_reason`
- blockers[i]: `id / desc / type / status / eta / resolution_path`

JSONL parse PASS 양 file (`python3 -c "[json.loads(l) for l in sys.stdin]"` exit 0).

## §2 pixie_cli — required_conditions 요약

| cond | desc | status | verifier seam |
|---|---|---|---|
| pixie_cli.cond.1 | topic-sync idempotent dry-run | partial | script bin/pixie topic-sync --dry-run, idempotence=2run byte-identical |
| pixie_cli.cond.2 | channels --save round-trip | met | script bin/pixie channels --save, round-trip via load_channel_map() |
| pixie_cli.cond.3 | welcome DM end-to-end | unmet | script bin/pixie welcome <uid>, two-step API (open DM + post msg) |

blocker: `pixie_cli.blk.1` = welcome 서브커맨드 e2e LIVE traffic 미발생 (operational, open).

evidence base:
- bin/pixie:cmd_channels + load_channel_map (line ~74-95, 61-65)
- config/topics.json 38 LoC SSOT
- mk1 narrative .roadmap (HEAD blob) Status 2026-04-24 ✓ topic SSOT + ✓ Cloudflare Worker

cross_link: pixie_worker.cond.3 (DO gateway READY) — CLI channel state 변경 후 worker mention handler
sibling integrity.

triplet_audit_tier: **T0_minimum_viable_exempt_candidate** (raw 168 권장, single-file 190 LoC python +
1 JSON SSOT — README.ai.md 미생성 결정 사용자 lock-in 후).

## §3 pixie_worker — required_conditions 요약

| cond | desc | status | verifier seam |
|---|---|---|---|
| pixie_worker.cond.1 | Phase A public HTTP API live | unmet | curl /api/projects + /api/project/<name>, 200 application/json |
| pixie_worker.cond.2 | Phase C MCP server live | partial | curl POST /mcp, MCP 2024-11-05 JSON-RPC tools/list (data layer ready) |
| pixie_worker.cond.3 | DO gateway READY + circuit-breaker eviction-survival | met | npx wrangler tail \| grep __GATEWAY_READY__, PERSISTED 7-key check |

blocker: `pixie_worker.blk.1` = Phase A endpoint 미구현 (structural, open, eta=2026-06-01).

evidence base:
- worker/src/topics.js LONG_TOPICS + PROJECT_LIST (data layer)
- worker/src/gateway-do.js PERSISTED 7-keys (line 26) + FATAL_CODES Set (line 21) + CIRCUIT_OPEN_MS 1hr (line 15)
- mk1 narrative .roadmap (HEAD blob) Phase A 10 min est + Phase C 1 hr est + Status ✓ DO gateway

cross_link:
- pixie_cli.cond.1 (sibling — split-brain risk: PROJECT_LIST hardcoded both worker/src/topics.js + bin/pixie path)
- anima/.roadmap.serving.cond.1 (anima sibling — Phase A 가 anima endpoint discovery sibling 가능, mk1 narrative Phase D)

triplet_audit_tier: **T1** (raw 270/271/272/273) — worker/src/README.ai.md 1 + 4 module file
(index/gateway-do/mentions/topics) module-level header 분할 후속 cycle, promotion-day 2026-06-01 deadline.

## §4 mk1 narrative .roadmap (HEAD blob) 와의 cross-link 매핑 audit

| mk1 narrative item (HEAD blob) | mk2 cond mapping |
|---|---|
| Status 2026-04-24 ✓ channel topic SSOT (config/topics.json) + pixie topic-sync | pixie_cli.cond.1 evidence (partial — idempotence verifier 미land) |
| Status 2026-04-24 ✓ Cloudflare Worker deployed (pixie.dancinlife.workers.dev) | pixie_worker.cond.3 evidence (met) + pixie_cli.cond.2 evidence (LIVE channel-id wiring 전제) |
| Status 2026-04-24 ✓ /explain slash command | pixie_worker.cond.3 evidence (met — worker fetch handler + verify + handleCommand land) |
| Status 2026-04-24 ✓ Durable Object gateway bot — @Pixie / @ai / !pixie | pixie_worker.cond.3 evidence (met — gateway-do.js 300 LoC + PERSISTED 7-key) |
| Status 2026-04-24 ✓ Short-reply tagline per project (mentions.js) | pixie_worker.cond.3 evidence (sibling — mentions.js 41 LoC) |
| Phase A — public HTTP API (10 min est) | pixie_worker.cond.1 (unmet — blocker pixie_worker.blk.1 structural) |
| Phase B — (skip, LLM 금지) | (no cond — explicit non-goal) |
| Phase C — MCP server (~1 hr est) | pixie_worker.cond.2 (partial — data layer ready / transport layer 0%) |
| Phase D — defer to Anima | cross_link only (anima/.roadmap.serving.cond.* sibling) |

mk1 narrative .roadmap 의 5 ✓ + 4 phase 모두 mk2 cond 로 매핑 완료. **mk1 → mk2 backport coverage = 9/9
(100%)**. mk1 narrative restore 여부는 사용자 결정 — HEAD blob `git show HEAD:.roadmap` 으로 readable
유지.

## §5 후속 cycle 권장 sequence (사용자 lock-in 후)

1. **rank B `pixie_translator` land** — 별도 cycle, 6 ts module + 자체 LIVE Cloudflare Worker, T1 권장
   (discord-translator/src/README.ai.md 1 + 6 module header)
2. **rank C `pixie_brand` decide** — raw 168 minimum-viable exempt 권장, asset-only 9-file dir, mk2
   land 가치 낮음 (사용자 결정)
3. **pixie_worker Phase A 구현** — worker/src/index.js fetch handler 에 `/api/projects` +
   `/api/project/<name>` route 분기 추가 (mk1 est 10 min, additive only) → cond.1 verifier exit 0 확보
4. **pixie_worker Phase C 구현** — `/mcp` JSON-RPC framing + tools/list/call dispatcher (mk1 est 1 hr) →
   cond.2 partial → met 전환
5. **pixie_cli welcome e2e** — sandbox guild + `--no-send` flag 또는 manual review evidence land →
   cond.3 unmet → met
6. **raw 270 triplet T1 작업 (pixie_worker)** — worker/src/README.ai.md 1 + 4 module file module-level
   header (promotion-day 2026-06-01 deadline)
7. **mk1 narrative .roadmap restore 결정** — working tree deleted state 복원 vs HEAD blob 만 keep
   (사용자 lock-in)

## §6 raw#10 honest C3 (10 caveat)

C1 — 본 cycle 은 **2 .roadmap.<domain> JSONL header land only**. 실제 cond verifier 미실행, status
값은 evidence + mk1 narrative claim + 코드 read-only audit 기반 추정. PASS/FAIL 검증은 사용자 lock-in
후 별도 cycle.

C2 — `pixie_cli.cond.2` status=met 은 **LIVE 운영 evidence 기반 추정** (mk1 narrative ✓ Cloudflare Worker
deployed = channel-id wiring 작동 중). 직접 round-trip 검증 0회. C5 caveat 와 sibling.

C3 — `pixie_worker.cond.3` status=met 은 **코드 land + LIVE deploy 추정 evidence**. eviction-survival
실측 검증 0회 (PERSISTED 7-key 가 코드상 land 됐다 ≠ eviction 시 실제 복원 PASS). isolate eviction
시뮬레이션 harness 미land.

C4 — `pixie_worker.cond.2` status=partial 은 data layer ready / transport layer 0%. mk1 narrative est
1 hr 기반 추정, MCP 2024-11-05 spec 의 initialize handshake + capabilities negotiation + tools/list +
tools/call 4단계 모두 미구현. partial 분류 = data 만 ready 분리.

C5 — verifier seam `_smoke_curl` + `_wrangler_tail` 은 mk2 schema 표준 verifier type X (anima 측 entry
다수가 path=script 와 path=cross_link 만 사용). 본 cycle 에서 새 type token 도입 — anima 측 lint 와
호환 여부는 별도 cycle 검증.

C6 — pixie 의 `state/` 는 `.gitignore` (line 7) 로 제외. 본 marker 는 local-only audit trail. git commit
대상 X. predecessor marker 와 동일 정책.

C7 — `pixie_translator` (rank B) 와 `pixie_brand` (rank C) 는 본 cycle scope 외. 후속 cycle 에서 land
시 cross_link 항목 ('sister_domains') 갱신 필요 (현재는 pixie_cli + pixie_worker 만 sibling 으로 등재).

C8 — mk1 narrative `.roadmap` working tree deleted 상태 미해결. 본 cycle 은 restore X (사용자 lock-in
사항). HEAD blob `git show HEAD:.roadmap` 으로 readable 유지, mk2 cross-link audit (§4) 는 HEAD blob
기반.

C9 — env() lazy + <user> placeholder convention (raw 15) — 본 doc 의 모든 path `/Users/ghost/...` 는
`/Users/<user>/...` placeholder 의도, 그러나 marker JSON + handoff doc 자체에서는 모든 anchor 가
`pixie/...` repo-relative 로 표기.

C10 — friendly preset 적용. handoff doc only 정책 (사용자 응답 X — bg subagent → 메인 monitor). BR-NO-USER-VERBATIM
(raw 175) 준수: 사용자 prompt 직접 인용 0건, 모든 directive 자체 paraphrase 만 기록.

## §7 BR-NO-USER-VERBATIM 준수 confirmation

본 doc 은 사용자 prompt 내용을 verbatim 으로 인용하지 않음 (raw 175). prompt 요약/재구성으로만 land.
handoff doc only 정책에 따라 사용자 directive 도 자체 paraphrase 만 기록. predecessor doc 의 동일 정책
계승.

## §8 friendly preset compliance

본 doc 은 handoff doc 으로서 친절-preset 적용:

- TL;DR 최상단 5 줄
- 모든 §-section 표 (table) 우선
- §0 predecessor 비교 표 / §1 file index 표 / §2-§3 cond 요약 표 / §4 mk1 → mk2 매핑 표
- raw#10 caveats (C1-C10) inline
- §5 next-cycle action 7-step 명시
- 마지막 §10 file index sha-pin

## §9 Marker 1개 emit

```
state/markers/pixie_rank_a_2_domain_landed.marker
```

predecessor marker (`pixie_self_mk2_tuning_landed.marker`) 와 sibling, predecessor 의 candidate_domains
list 4 중 rank A 2 land 진척을 추적.

## §10 policy summary

- migration: forbidden — 0건 emit
- additive only — 14 source + brand/9 + 2 README.md + 2 wrangler.toml + 2 package.json + LICENSE + mk1
  narrative .roadmap (working tree deleted state preserved) 모두 무수정 보존
- destructive ops — 0건
- in-place writes — 0건 (.roadmap.pixie_cli + .roadmap.pixie_worker + handoff doc + marker = 4 NEW only)
- substrate — mac-local
- cost — $0
- raw 9 hexa-only orchestration — 본 cycle 도 single-doc spec emit (raw 168 minimum-viable exempt
  audit + JSONL hand-craft, hexa orchestrator 미사용; pixie 는 hexa-lang 에 의존하지 않음)
- raw 12 silent-error ban — single-shot, error path X
- raw 15 env() lazy + <user> — 모든 doc-internal path repo-relative, 절대 path X
- raw 175 BR-NO-USER-VERBATIM — 사용자 prompt 직접 인용 0건
- friendly preset — handoff doc only (사용자 응답 X — bg subagent → 메인 monitor)
- silent-land marker protocol — marker 1개 emit (이 doc + 4 NEW file 의 sha-pin)
