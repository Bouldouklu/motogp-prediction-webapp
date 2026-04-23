### **FEEDBACK MotoGP BETS**



##### **Functional**

###### **Main page**

* ~~Once the championship is made and locked, reduce the height of the block to have more relevant info on screen~~ ✅ Done — collapses to a single compact row when locked
* ~~Have the previous race tab above the next up (after the first race is done obviously) but as a drop down option so that we don't loose to much height again~~ ✅ Done — Previous Races section is now collapsible and starts collapsed, keeping Upcoming Races visible without scrolling
* ~~remove the right submitted tab for the championship podium~~ ✅ Done
* ~~maybe make the leaderboard button something different from the other elements (like a browser tab at the top?) or just placed differently~~ ✅ Done — moved to header bar next to Logout, removed the card from the content area



###### **Race prediction**

* ~~add time of the sprint and the race along with the date if possible and not too complicated~~ ✅ Done — sprint_datetime and race_datetime columns added; prediction page shows e.g. "Sat, Mar 1, 08:00 AM" (estimated UTC times, update via Supabase SQL editor once official schedule is published)
* ~~on desktop at least, make the "Predict the top 3 finishers of the Sprint Race." on the same line as the title because unused space on the right~~ ✅ Done — subtitle now sits inline with the title for all 3 sections (Sprint, Race, Glorious 7)
* ~~Mabe remove the # inb front of number and put an \_ between number and name for more visual clarity~~ ✅ Done — rider dropdown now shows `93_MARQUEZ Marc` instead of `#93 MARQUEZ Marc`
* ~~Make sure all the name fit in one line width of the drop down menu (toprak \& diggia)~~ ✅ Done — names truncate to one line, SELECTED label replaced with a compact ✓
* Surname option when typing if possible, but definitely not prio



###### **Glorious 7**

Je ne sais pas encore, tu peux me redonner les autres option que AI avait propose?



###### **Leaderboard**

* ~~add the column for penalties to the general one~~ ✅ Done — Penalties column added to the standings table, shown in red when non-zero
* ~~add the penalties as a small red element (when relevant) to the per race one~~ ✅ Done — small red `-10` badge appears below the score in each cell when a penalty was applied
* ~~add a total column to the per race~~ ✅ Already done — sticky Total column on the right of the Points per Race table
* ~~Make sure the per race as the details for each race, meaning points for each of the 3 results~~ ✅ Done — each cell now shows S:/R:/G: subtotals in small grey text beneath the total
* ~~The per race should be scrollable left to right to go over the whole season without losing the names and total~~ ✅ Already done — overflow-x-auto with sticky Player (left) and Total (right) columns



##### **Aesthetics**

###### **Main page**

* If possible to get images of the tracks in the block corresponding that would be great (similar to the GP or F1 websites), maybe just the one coming up? We can also use the images currently on the MotoGP website for the previous season
* ~~Can we have the riders photos (from the GP website) once the podium selections are done both for the championship and the race? but very optional~~ ✅ Done — rider portraits loaded from MotoGP CDN via external_id; small circular photo in the locked championship row; faded full portrait in the championship grid cards; circular photos + last name in the Next Up hero card when prediction is submitted; falls back gracefully if image unavailable
* ~~Removing the line "round X" from each race element to make the rest of the text bigger. And maybe making the number a bigger low opacity element in the block~~ ✅ Done — "Round X" badge removed; large faint round number now sits as a decorative background element top-right of each card
* ~~Do we need the "predict now" and "predict" buttons? maybe just clicking on the race element brings us to the prediction screen?~~ ✅ Done — entire card is now a clickable link; Predict/Edit buttons removed; predicted races show a small green "✓ Prediction submitted" line instead







# **Round 2:**

being able to cancel a name in one click to allow for some shuffling around

being able to see the bets in the home page after prediction done to avoid having to go into edit mode to check

Change (edit prediction) to locked or something once the cut-off is reached

-> define penalties (50pts is too weak compared to the currently possible 225 total per weekend

change scoring weight: maybe make final championship equivalent to 2,5 or 3 races?

250

175

100

and also have "off by" options



for race/sprint/glorious 7, reduce the total amount for 2nd and 3rd position to put a bit more focus on the winner

reduce total amount of points maybe? to balance with final podium value

Maybe not going all the way to "off by 5"





being able to see everyone's bet after the cut-off (an penalty margin: probably end of FP1 as the latest time)



all names always with the same formatting in the leader board page



Detailed points for each weekend (sprint + race + glorious) Maybe even the break down of each podium on hover or when clicking on it.

A way to see what the others predictions were once the weekend is done

missing the glorious 7 result in the previous race (and also results until last position to score points 5 right now) -> make that feature only visible for the last weekend, then it collapse when a new weekend is done



