# Football Friends Cards: PRD for Edits (v2)

Draft · November 5, 2026

This document describes changes to an **existing, working game**. It is written for an AI coding agent. Read it fully, then read `milestones-edits.md` and work one milestone at a time.

## 0. Rules for the agent

1. **Read the whole codebase first** and summarise how it works before changing anything (see Milestone 0).
2. **Do not break what already works.** Existing players have saved progress in localStorage. Any new save fields need a default value, and old saves must still load (add a small migration step).
3. **Keep the current look and feel.** Clean, simple, mobile-first. Plain HTML, CSS and JavaScript only. No frameworks, no backend, no new libraries.
4. **Keep data in JSON files** (cards, packages, quests, questions), not hard-coded in the logic, so the owner can edit them without touching code.
5. **Do not guess the items in "Open items" (section 9).** Use the stated default, say clearly in your summary that you used it, and make it easy to change.
6. After each milestone, explain how to test it and stop.

## 1. Background (what exists today)

- A card-collecting game for a group of friends. Players earn coins by answering 3 daily multiple-choice trivia questions (+150 coins per correct answer), spend 90 coins to open a pack that gives 1 random card, and build a 4-3-3 lineup.
- The card pool has 15 cards (3 unique, 12 basic), each with a rating between 80 and 110. Duplicates do nothing.
- Progress is saved in the browser (localStorage). There is a free weekly pack on Thursday.
- Pages: Home, Trivia, Store, Collection, Lineup.

## 2. Goals of this update

1. Add **one free card**.
2. Add **two new 1000-coin packages** (Real Madrid and Barcelona) that give a fixed set of players plus a **manager**. The existing pack becomes the first of three packages.
3. Add a **quests** system with three quests (only the first is defined so far).
4. Replace the trivia questions with an **easier set**.

## 3. Feature 1: Free card

- The player receives **one card for free**, at no coin cost.
- Default behaviour (see Open items): a **one-time welcome card** given the first time a player opens the game after this update. It is a random basic card, shown with the same reveal used in pack opening, and saved to the collection.
- It can only be claimed once per player. Store a flag such as `welcomeCardClaimed`.

## 4. Feature 2: Three packages

The Store page shows **three packages**.

| Package | Price | What you get | How often |
| --- | --- | --- | --- |
| College Package 1 | 90 coins | 1 random card (the existing pack, renamed) | Unlimited, as today |
| Real Madrid Package | 1000 coins | **All** players listed for the package, plus the Real Madrid manager | **One time only** per player |
| Barcelona Package | 1000 coins | **All** players listed for the package, plus the Barcelona manager | **One time only** per player |

Rules:

- The existing pack keeps its current odds (20% unique, 80% basic) and is simply renamed **College Package 1**.
- Real Madrid and Barcelona are **fixed bundles**, not random. Opening one gives every player in that bundle at once.
- Each bundle can be bought **only once**. After buying, the Store shows it as "Owned" and the button is disabled. Store this in the save data, for example `openedPackages: ["real_madrid"]`.
- The player needs at least 1000 coins. If not, show the missing amount and do not take any coins.
- The reveal can be simpler than for single packs (for example, a scrollable list or grid of all received cards), but it must clearly show every new card and the manager.
- If the player already owns some cards from the bundle, they still keep them (duplicates do nothing) and the bundle is still marked as bought.
- The bundle's player list lives in `packages.json` (see section 7), not in code.

## 5. Feature 3: Managers

- A **manager** is a new kind of card: `type: "manager"`.
- Managers: one for **Real Madrid** and one for **Barcelona**. They come only from their package.
- A manager card has: id, name, club, image, and `type: "manager"`. It has **no rating** and does **not** count for the team rating or for quests.
- Managers appear in the **Collection** page in their own section, locked until owned.
- Default for the Lineup page (see Open items): managers are **collection only** for now. Do not change the 4-3-3 lineup rules.
- Managers must never appear in normal pack pulls, and must not be counted in the "15 cards" completion logic. Handle `type` carefully wherever cards are filtered.

## 6. Feature 4: Quests

- A new **Quests** page (and a link from Home) lists all quests, the player's progress, and a **Claim** button when a reward is ready.
- Quests are defined in `quests.json`, so new ones can be added without changing code.
- Rewards are paid in coins, claimed by the player, and **each reward can be claimed only once**.

### Quest 1: "Collect high-rated players"

Counts how many **different owned player cards** have an **OVR of 100 or higher**. Managers and duplicates do not count.

| Owned cards with OVR 100+ | Reward |
| --- | --- |
| 2 | 200 coins |
| 3 | 300 coins |
| 5 | 500 coins |

- Default (see Open items): these are **three separate milestones inside one quest**. Each can be claimed once, so a player who reaches 5 cards can collect all three rewards (200 + 300 + 500).
- Progress text example: "You own 3 cards with OVR 100 or higher".
- Store which tiers were claimed, for example `claimedQuestTiers: { "high_rated": [2, 3] }`.

### Quest 2 and Quest 3

- **Not defined yet.** The owner will provide them.
- Build the quest system so a new quest is just a new entry in `quests.json` with a type, goal and reward.
- Do not invent rules for quests 2 and 3. Leave them out of the UI until defined.

## 7. Data changes

**`cards.json`:** keep the existing fields (id, name, club, position, rating, type, image). Add `"type": "manager"` entries for the two managers. Make sure every card has a unique `id` and that managers are excluded from random pack pulls.

**`packages.json` (new):**

```json
[
  { "id": "college_1", "name": "College Package 1", "price": 90, "kind": "random", "oneTime": false },
  { "id": "real_madrid", "name": "Real Madrid Package", "price": 1000, "kind": "bundle", "oneTime": true,
    "cardIds": [], "managerId": null },
  { "id": "barcelona", "name": "Barcelona Package", "price": 1000, "kind": "bundle", "oneTime": true,
    "cardIds": [], "managerId": null }
]
```

The `cardIds` and `managerId` values are filled in once the owner provides the player and manager list.

**`quests.json` (new):**

```json
[
  {
    "id": "high_rated",
    "name": "Collect high-rated players",
    "type": "count_owned_with_min_rating",
    "minRating": 100,
    "tiers": [
      { "count": 2, "reward": 200 },
      { "count": 3, "reward": 300 },
      { "count": 5, "reward": 500 }
    ]
  }
]
```

**`questions.json`:** replace the current content with the new `questions_easy.json` (100 easy questions, same format).

**Save data additions** (all with safe defaults for old saves): `welcomeCardClaimed` (false), `openedPackages` ([]), `ownedManagers` ([] or reuse the owned cards list), `claimedQuestTiers` ({}).

## 8. Out of scope

- Accounts, backend, or syncing between devices
- Trading, matches, leaderboards
- Changing the trivia rules (3 questions a day, +150 per correct answer)
- Changing the 4-3-3 lineup rules
- A visual redesign

## 9. Open items (use the default, then tell the owner)

1. **What "one free card" means.** Default: a one-time welcome card (random basic card). Other possible meanings: a free daily card, or a specific named card given to everyone.
2. **Which players are in the Real Madrid and Barcelona packages**, and the names, clubs and images of the two managers. The owner must supply these. Until then, use clearly marked placeholder ids and tell the owner exactly what to fill in.
3. **Is "College Package 1" the existing 90-coin pack renamed?** Default: yes.
4. **Quest 1 reward style.** Default: each tier is claimed separately. Alternative: only the highest tier reached pays out.
5. **Quests 2 and 3.** Not defined yet.
6. **Managers in the Lineup.** Default: collection only. Alternative: a manager slot next to the lineup.
7. **Can the owner's Real Madrid and Barcelona bundle players overlap** with the College package players? Default: yes, nothing prevents it.

## 10. Acceptance checklist

- [ ] An existing save loads without errors and keeps all coins and cards.
- [ ] The welcome card is given once, and never twice.
- [ ] The Store shows 3 packages with the right names and prices.
- [ ] College Package 1 still gives 1 random card for 90 coins with the same odds.
- [ ] Real Madrid and Barcelona each take 1000 coins, give all their players and the manager, and cannot be bought a second time.
- [ ] Not enough coins: nothing is taken and a clear message is shown.
- [ ] Managers appear in the Collection in their own section and never drop from random packs.
- [ ] Quest 1 counts only owned player cards with OVR 100 or higher, and each tier can be claimed once.
- [ ] The Quests page is reachable from Home.
- [ ] The new easy questions load and the trivia still works (3 a day, +150 each).
- [ ] The site still works on a phone screen.