# Glorious 7 — What We Have & Where We Go

## Current situation (honest baseline)

Everything is **fully manual today**. The admin goes into Supabase directly and inserts the 7 riders into the `race_glorious_riders` table by hand before each race weekend. There is no UI for it in the admin panel.

There *is* an auto-generate API endpoint in the code, but it is dead — it was never wired up to any UI button. It has never been used.

So the real starting point is: zero automation, zero admin UI, pure database surgery each time.

---

## What we want to improve

1. **An actual admin UI** — stop going into Supabase directly
2. **Only riders actually entered for that race** — exclude injured/DNS riders
3. **Middle of the pack** — avoid picking the championship leaders or the backmarkers
4. **Some diversity** — avoid clustering (e.g. three Ducatis, two teammates)

---

## The three options

### Option A — Manual picker with a UI *(minimum viable, fastest to build)*

Just build the missing admin UI. No algorithm changes.

- On the race results page, add a **"Glorious 7"** section: 7 dropdowns, one per slot, pick any active rider.
- Admin selects the 7 manually — same as today, but inside the app instead of Supabase.
- No auto-generation, no standings logic, no diversity rules.

**Pros:** Tiny amount of work. Solves the "stop using Supabase directly" problem immediately. Admin keeps full control.

**Cons:** Still fully manual. If you forget to pick riders, the G7 pool is empty. No guard against picking a championship leader or a backmarker.

---

### Option B — UI + one-click generate with manual override *(recommended)*

Build the admin UI (same as Option A) but add a **"Generate suggestion"** button that auto-fills the 7 slots, which the admin can then tweak before saving.

The generation logic:
- Takes all active riders, sorts by current championship standings
- Excludes top 3 and bottom 3 of the standings
- Randomly picks 7 from the remaining pool, capping at 2 per manufacturer
- Fills the 7 slots in the UI — admin reviews, swaps any they don't like, then saves

**Pros:** One click gives you a sensible starting list. Admin still has the final say. Solves the Supabase dependency. The randomness ensures variety race to race.

**Cons:** At the start of the season all riders have 0 points, so "standings" means nothing yet — the exclusion logic is only meaningful from round 3 or 4 onwards. Doesn't account for which riders are actually entered for that specific race (see Option C).

---

### Option C — UI + generate from confirmed entrants *(best quality, most work)*

Everything in Option B, but adds a **per-race entry confirmation step** before generating.

- Admin first confirms the entry list for the race weekend: starts from all active riders, unchecks anyone who is injured/DNS/not entered.
- G7 generation then draws only from confirmed entrants, so the pool is always accurate.
- **Bonus:** the prediction dropdowns (where players pick Sprint/Race/G7 riders) could also be filtered to confirmed entrants — right now they show every active rider including ones not racing that weekend.

**Pros:** Accurate pool every race. Fixes the prediction dropdowns as a side effect. Best G7 lists.

**Cons:** One extra admin step per race weekend. Requires a new database table for entry lists.

---

## Summary

| | Stops Supabase surgery | Auto-suggestion | Accounts for DNS/injuries | Admin preview & swap |
|---|:---:|:---:|:---:|:---:|
| **A** — Manual UI | ✓ | — | manual | ✓ (manual) |
| **B** — UI + Generate | ✓ | ✓ | manual (active flag) | ✓ |
| **C** — UI + Entries + Generate | ✓ | ✓ | ✓ | ✓ |

---

## Key questions to decide

- **Is Option A enough?** If you're happy picking the 7 manually each race and just want to stop using Supabase, A is a 1-hour job.
- **Do you want auto-suggestions?** B gives you a one-click draft you can adjust — probably the best balance of effort vs. quality.
- **Does it matter if injured riders are in the pool?** If yes, C is the right call. If you're OK with the admin just knowing not to pick them, B is fine.
