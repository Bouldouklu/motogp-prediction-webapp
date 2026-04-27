# **FEEDBACK MotoGP BETS**

## **Functional**

### **Race prediction**

Being able to cancel a name in one click to allow for some shuffling around — ✅ Done: clear (✕) button appears on each RiderSelect when a rider is selected; clicking it calls onChange('') and clears the slot instantly.

Still show the complete list once a name is selected to allow for easy change — ✅ Done: removed excludeIds filtering from the dropdown; all riders are always visible in the list.

Not blocking an already selected rider name to allow for some shuffling, but maybe making the whole podium card go "ALERT" when a name is inputed twice — ✅ Done: duplicate detection per category (Sprint / Race / Glorious 7); any slot sharing a rider with another slot in the same category shows an amber "⚠ Duplicate rider — check your podium" banner and amber ring. Cross-category duplicates (e.g. same rider in Sprint 1st and Race 1st) are intentionally allowed.

Change (edit prediction) button to locked or something once the cut-off is reached. And also add a penalty margin: end of FP1 as the latest time. 

Surname option when typing if possible, but definitely not prio


### **Glorious 7**

TBD


## **Aesthetics**

### **player Main page**

Being able to see the weekend bets in the player home page after prediction done to avoid having to go into edit mode to check — ✅ Done: "Your Bets" 3-column panel (Sprint / Race / Glorious 7) now appears in the Next Up card once a prediction is submitted.

If possible to get images of the tracks in the block corresponding that would be great (similar to the GP or F1 websites), maybe just the one coming up? We can also use the images currently on the MotoGP website for the previous season

Can we have the riders photos (from the GP website) once the podium selections are done both for the championship and the race? but very optional — ⚠️ Partially done / blocked: UI is wired up (circular photos in championship row, faded portraits in grid cards, Next Up hero card). However photos are not displaying — only a grey placeholder appears. The MotoGP CDN URL pattern (`resources.motogp.com/files/results/2026/riders/{external\_id}/portrait.png`) may be wrong or require authentication. Needs investigation: verify the correct CDN URL format for 2026 rider portraits.

More clarity on the **race results in the "previous race" card**: 

* showing all 3 podiums
* Showing the inputed bets as priority
* showing the actual results (top 5 each time)
* Showing the points earned



### **Leaderboard:**

Being able to see everyone's bet after the cut-off -> extra table in the leaderboard to show that to avoid clutter? — ✅ Done: "Weekend Bets" collapsible section added at the bottom of the leaderboard. One row per past race; expanding it shows all players' Sprint / Race / Glorious 7 picks in a table. Only visible for races past their cut-off.

Detailed points for each weekend with the break down of each contestant's podium (on hover or when clicking on it?).



## **Scoring:** ✅ Done

For race/sprint/glorious 7, reduce the total amount for 2nd and 3rd position to put a bit more focus on the winner
Reduce total amount of points maybe? to balance with final podium value

1:
Correct:20pts
Off by 1:16pts
Off by 2:12pts



2:
Correct:16pts
Off by 1:12pts
Off by 2:8pts



3:
Correct:14pts
Off by 1:10pts
Off by 2:6pts



Not going all the way to "off by 5", stop at "off by 2" -> considering then the top 5 to determine the points — ✅ Implemented: off-by-3+ scores 0, position-aware tables in engine.





**Penalties:** ✅ Done
1st offence: 35pts
2nd offence: 55pts
all following offences: 75pts







**Final championship** ✅ Done — Option 1 chosen (350 pts total ≈ 2.3 perfect race weekends)

option 1 (CHOSEN): 350 TOTAL

1: 130 pts (correct) / 104 pts (off by 1) / 78 pts (off by 2)
2: 120 pts (correct) / 96 pts (off by 1) / 72 pts (off by 2)
3: 100 pts (correct) / 80 pts (off by 1) / 60 pts (off by 2)

⚠️ After deploying, run "Calculate Scores" in /admin for every completed race to refresh stored scores in Supabase.



