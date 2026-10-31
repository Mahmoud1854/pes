# Football Friends Cards: PRD

Draft v1 · October 31, 2026

## 1. Overview

A small website for a group of friends, inspired by mobile football games like eFootball and FC Mobile. Players answer football trivia to earn coins, spend coins on packs, collect cards of the friends themselves (made by a friend who is a designer), and build a 4-3-3 lineup from the cards they own.

**Goal:** have fun with friends. This is not a public product, so there is no scale, payment or moderation work.

**Success looks like:** friends open the site every day for the trivia, come back every Thursday for the free pack, and compare lineups.

## 2. Core loop

1. Answer 3 trivia questions a day to earn coins.
2. Spend coins (or use the free Thursday pack) to open packs and get cards.
3. Fill the 4-3-3 lineup with the best cards you own.
4. Come back tomorrow.

## 3. Cards

- The pool has **15 cards in total**: **3 unique** (standout) cards and **12 basic** cards.
- Each card is a **finished image** (a photo of the friend in an eFootball-style design). The image already shows the **name, club badge, position and rating**.
- Sample card: portrait, about 470 × 660 pixels (roughly 7:10). All 15 cards should use the same size and shape.
- The skills and stars drawn on the cards are **decoration only**. They have no effect on the game.
- Ratings range from **80 to 110**. Suggested split (to be confirmed): basic cards at the lower end of the range, the 3 unique cards at the top.
- The rating is also stored in `cards.json` so the lineup page can calculate the team rating.
- Duplicates do nothing. A repeat card just stays in the collection.

## 4. Coins and trivia

- **3 multiple-choice questions per day.**
- Correct answer: **+150 coins**. Wrong answer: nothing.
- Maximum per day: **450 coins**.
- Questions come from `questions.json`: **100 medium-difficulty football questions in easy English**, each with 4 options.
- Each player can answer the day's 3 questions only once. The next set unlocks the next day.

## 5. Packs

- **Paid pack:** costs **90 coins** and gives **exactly 1 card**.
- **Free pack:** one every week, available on **Thursday**.
- **Drop odds:** 20% chance of a unique card (the 3 unique cards are equally likely, about 6.7% each) and 80% chance of a basic card (the 12 basic cards are equally likely, about 6.7% each). In practice every card has the same chance.
- A perfect trivia day buys 5 packs. Collecting all 15 cards takes roughly 50 packs on average, about 10 days of perfect trivia, plus the free Thursday packs.

## 6. Lineup

- Fixed **4-3-3** formation: 11 slots (1 goalkeeper, 4 defenders, 3 midfielders, 3 attackers).
- The player picks which owned card goes in each slot.
- **Any card can play in any slot.** The position on the card is for display only.
- **Each card can be used only once** per lineup, so a player needs at least 11 different cards to fill a full team.
- Suggested: show a **team rating** (average rating of the 11 cards) so friends can compare lineups.

## 7. Pages

1. **Home:** coins, the free Thursday pack, links to everything else.
2. **Trivia:** the 3 daily questions.
3. **Store:** spend 90 coins to open a pack.
4. **Collection:** all 15 cards, with owned ones shown and the rest locked.
5. **Lineup:** the 4-3-3 builder with the team rating.

## 8. Design

- **Clean and simple:** light, minimal layout where the cards are the main thing you look at.
- **Mobile-first**, working on desktop too.
- Pack opening: show the one card with a flip or reveal, and a small special effect for the 3 unique cards (suggested).

## 9. Technical approach

- Plain **HTML, CSS and JavaScript**, no backend and no accounts.
- Progress is saved in the browser (**localStorage**): coins, owned cards, lineup, today's trivia progress, and the date of the last weekly pack claim.
- Cards live in a `cards.json` file (id, name, club, position, rating, image path) and questions in `questions.json`, so they can be edited without touching the code.
- Card images are saved as JPG or WebP at the same size, with small file sizes so the site loads quickly on phones.
- Hosted as static files (for example GitHub Pages or Netlify).
- Nice to have: a **backup code** players can copy and paste to move their progress to a new device.

## 10. Known limits (accepted)

- Progress lives on one device. Clearing browser data loses it.
- Anyone who knows the browser dev tools could edit their coins. Daily and weekly limits are on the honor system.
- The sample card has a small "Pixelcut" watermark in the corner. This is accepted for now because the friend cannot export it at this size without it.

## 11. Out of scope for version 1

- Accounts and login
- Leaderboards across devices
- Trading cards between friends
- Playing matches
- Payments or real money of any kind

## 12. Open items

- Final names, clubs, positions and exact ratings for the 15 cards (from the designer).
- What happens after all 100 questions have been used (suggested: shuffle and repeat).
- Daily reset and Thursday timing: based on the player's device date (suggested).
- Whether to add the backup code in the first version.
