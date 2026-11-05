# Football Friends Cards: Milestones for Edits (v2)

Instructions for the AI agent. Read `PRD-edits.md` first. Work on **one milestone at a time**. At the end of each milestone, write a short summary of what you changed, how to test it, and which defaults from the PRD's "Open items" you used. Then stop and wait for the owner to say "next".

General rules for every milestone:

- Plain HTML, CSS and JavaScript only. Keep the current look and file structure.
- Keep old saved progress working. New save fields need defaults.
- Keep all game data in JSON files, not inside the logic.
- Do not change anything that is not part of the current milestone.

## Milestone 0: Read the code (no changes)

- Read every file in the project.
- Write a short report: the file list, where coins, owned cards, lineup and trivia are saved, how packs are opened, and how the weekly pack and daily trivia dates are handled.
- List which parts the update will touch.
- List any questions you have. Check the PRD's "Open items" and tell the owner which ones are still unanswered.

**Done when:** the owner has read the report and said "next". Nothing in the code is changed.

## Milestone 1: Data and save migration

- Replace the trivia questions with the contents of `questions_easy.json` (keep the file name the game already uses, and the same format).
- Create `packages.json` and `quests.json` using the structures in the PRD (leave the bundle player lists empty if they are not provided yet).
- Add the new save fields with safe defaults: `welcomeCardClaimed`, `openedPackages`, `claimedQuestTiers`.
- Add a small migration so an old save loads without errors and keeps all coins, cards and progress.
- Add a `type` check in the card code so managers are always excluded from random pulls and from the "15 cards" logic. Add `type: "manager"` entries to `cards.json` only when the owner supplies the manager details.

**Done when:** the game loads with an old save, nothing is lost, the trivia shows the new easy questions, and the new fields exist in storage.

## Milestone 2: Three packages in the Store

- Read packages from `packages.json` and show them on the Store page as three cards or buttons.
- Rename the existing 90-coin pack to **College Package 1**. Keep its price and its odds (20% unique, 80% basic) exactly as they are.
- Show the Real Madrid Package and the Barcelona Package with the price 1000 coins. The buy buttons can be disabled for now if their contents are not ready.

**Done when:** the Store shows three packages with the right names and prices, and College Package 1 works exactly as before.

## Milestone 3: Free card

- Give each player one free card, using the default in the PRD (a one-time welcome card, random basic card) unless the owner has said otherwise.
- Show it with the same reveal used for pack opening and save it to the collection.
- Use the `welcomeCardClaimed` flag so it can never be claimed twice.

**Done when:** a fresh save gets exactly one free card, reloading does not give another, and an old save still works.

## Milestone 4: Bundle packages (Real Madrid and Barcelona)

- Make the 1000-coin packages work: take 1000 coins, give **every** player in the package's `cardIds` at once, and also the manager in `managerId`.
- Each package can be bought **only once**: record it in `openedPackages`, then show "Owned" and disable the button.
- If the player does not have 1000 coins, show how many more are needed and take nothing.
- Show all received cards together after buying (a simple grid or list is fine).
- If any received card is already owned, keep it and do not charge extra.
- Do not guess players or managers. If the lists in `packages.json` are empty, tell the owner exactly what to fill in (card ids and manager id) and use clearly marked placeholders.

**Done when:** buying a bundle takes 1000 coins once, adds all its players and the manager to the collection, and the second purchase is blocked.

## Milestone 5: Managers in the Collection

- Add a separate **Managers** section to the Collection page. Owned managers show in full and the rest are locked.
- Managers must not change the team rating, must not appear in normal pack pulls, and must not count as players for the lineup.
- Follow the PRD default: managers are collection only. If the owner has chosen a manager slot for the lineup, add it here without changing the 4-3-3 rules.

**Done when:** buying a bundle makes its manager appear unlocked in the Managers section, and nothing else in the game changes.

## Milestone 6: Quests

- Build a generic quest system driven by `quests.json`: a quest type, a goal, tiers and rewards.
- Add a **Quests** page and a link to it from Home.
- Implement **Quest 1**: count the player's different owned player cards with OVR 100 or higher (managers and duplicates do not count). Tiers: 2 cards = 200 coins, 3 cards = 300 coins, 5 cards = 500 coins.
- Show progress (for example "You own 3 cards with OVR 100 or higher") and a **Claim** button for each tier that is ready.
- Each tier can be claimed once. Save claimed tiers in `claimedQuestTiers`. Add the coins when claimed.
- Do not build Quests 2 and 3. Make it easy to add them later by only editing `quests.json` (and adding a new quest type in code if a new rule is needed).

**Done when:** owning 2, 3 and 5 cards with OVR 100 or higher unlocks the matching claims, each claim pays the right amount once, and a reload does not allow a second claim.

## Milestone 7: Testing and cleanup

- Test with an old save and with a brand new save.
- Run through the PRD's acceptance checklist, one line at a time, and report which items pass.
- Check every page on a phone-size screen.
- Remove any temporary test buttons (for example "give me 1000 coins") that were added during testing.
- Write a short list of what the owner still needs to provide (bundle players, manager details, Quests 2 and 3).

**Done when:** every item in the PRD checklist passes and the owner confirms the game works on a phone.