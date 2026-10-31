# Football Friends Cards: Milestones

Build plan based on the PRD. Each milestone ends with something you can open and test, and each one builds on the last.

## Milestone 1: Project setup and data

- Build the small save/load helper that keeps these in localStorage: coins, owned cards, lineup, today's trivia progress, and the date of the last weekly pack claim.

**Done when:** you can save a value in the browser, refresh, and still see it.

## Milestone 2: Trivia page

- Show 3 questions a day, one at a time, with 4 options.
- Correct answer gives +150 coins. Wrong answer gives nothing.
- After the 3 questions are answered, lock the page until the next day.

**Done when:** answering correctly raises your coins, and refreshing does not let you answer again.

## Milestone 3: Store and pack opening

- One button that costs 90 coins and gives 1 card.
- Odds: 20% chance of a unique card (3 cards, equal chance) and 80% chance of a basic card (12 cards, equal chance).
- Show the card with a simple flip or reveal and save it to the collection.
- Duplicates do nothing.

**Done when:** coins go down by 90, a card appears, and it is still owned after a refresh.

**Testing tip:** add a hidden "give me 1,000 coins" button while testing, and remove it before sharing the site.

## Milestone 4: Collection page

- Show all 15 cards.
- Owned cards appear in full. Cards not owned appear locked or greyed out.

**Done when:** a new card opened in the store shows up unlocked here.

## Milestone 5: Home page and weekly pack

- Show the coin balance and links to the other pages.
- Add a "claim free pack" button that works only on Thursday, once per Thursday.

**Done when:** the button is disabled on other days and works once on Thursday. Test it by temporarily changing the day in the code.

## Milestone 6: Lineup page

- Fixed 4-3-3 layout with 11 slots.
- The player picks an owned card for each slot.
- Any card can go in any slot, and each card can be used only once.
- Show the team rating (the average rating of the 11 cards).
- Save the lineup.

**Done when:** you can fill the team, see the rating, and the lineup is still there after a refresh.

## Milestone 7: Polish

- Clean and simple design, mobile-first.
- Check every page on a real phone.
- Add the special effect for the 3 unique cards.
- Optional: add the backup code that moves progress to a new device.

**Done when:** all five pages look good on a phone screen.

## Milestone 8: Real cards and launch

- Replace the placeholders with the final 15 cards and images, all at the same size.
- Remove any testing buttons.
- Put the site on GitHub Pages or Netlify.
- Send the link to your friends and fix what they find in the first few days.

**Done when:** every friend can open the link and play on their own phone.

## Note

Do not wait for the final card images. Milestones 1 to 6 work fine with the sample card repeated a few times, so the designer has time to finish the rest.
