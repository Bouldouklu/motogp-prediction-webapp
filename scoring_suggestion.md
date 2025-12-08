# Final Scoring System Specification

## Overview
This document outlines the scoring system for the MotoGP prediction league. The system is designed to heavily reward accuracy and "close calls" in race weekends while ensuring the season-long Championship prediction carries sufficient weight to act as a significant anchor.

## 1. Season Championship Predictions
**Goal:** Predict the final top 3 riders of the season.
**Significance:** This long-term prediction is weighted to be roughly equivalent to **two perfect race weekends** (225 × 2 = 450), emphasizing its importance and difficulty.

| Position Correct | Points |
|------------------|--------|
| **1st Place** | **250** |
| **2nd Place** | **100** |
| **3rd Place** | **100** |
| **Total Max** | **450** |

---

## 2. Race Weekend Predictions
For each Grand Prix weekend, players predict the **Top 3** riders for three distinct categories:
1.  **Sprint Race**
2.  **Main Race**
3.  **Glorious 7** (Mini-league of 7 riders)

### Scoring Scale (Per Category)
Points are awarded for each rider in the predicted Top 3 based on their actual finishing position relative to the prediction. This scale rewards exact accuracy heavily but also ensures that getting the "Right Rider in the Wrong Order" yields a strong score.

| Accuracy | Points | Description |
|----------|--------|-------------|
| **Exact Match** | **25** | Perfect prediction. |
| **Off by 1** | **18** | e.g., Predicted 1st, finished 2nd. |
| **Off by 2** | **15** | e.g., Predicted 1st, finished 3rd. |
| **Off by 3** | **10** | Just outside the "perfect zone". |
| **Off by 4** | **6** | |
| **Off by 5** | **2** | |
| **Off by 6+** | **0** | No points. |

### Maximum Potential Weekend Score
*   **Sprint:** 75 points (3 × 25)
*   **Race:** 75 points (3 × 25)
*   **Glorious 7:** 75 points (3 × 25)
*   **Total Weekend Max:** **225 points**

*(Two perfect weekends = 450 points, matching the Championship Max)*

### Example Scenarios
*   **Perfect Prediction:** You predict Rider A for 1st, and they finish 1st.
    *   Result: **25 points**.
*   **Right Rider, Wrong Order:** You predict Rider A for 1st, but they finish 2nd (Off by 1).
    *   Result: **18 points**.
*   **Still on Podium:** You predict Rider A for 1st, but they finish 3rd (Off by 2).
    *   Result: **15 points**.

---

## 3. Late Submission Penalties
Predictions submitted after the deadline (FP1 start) incur progressive penalties to maintain fairness while allowing participation.

| Offense | Penalty |
|---------|---------|
| **1st Late Submission** | **-10 points** |
| **2nd Late Submission** | **-25 points** |
| **3rd+ Late Submission** | **-50 points** (each) |
