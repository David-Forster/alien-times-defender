### Game Requirements: Multiplication Tables Trainer (Beta Version)

#### 1. Overview
- **Game Purpose**: Develop a simple computer game to improve players' mental arithmetic skills, specifically focusing on multiplication tables from 2x2 to 12x12 (i.e., all combinations where both factors range from 2 to 12).
- **Target Audience**: Players looking to practice and enhance quick recall of multiplication facts.
- **Core Gameplay Loop**: Present multiplication puzzles sequentially (e.g., "4 x 7="). The player inputs an answer within a time limit. Correct answers reduce difficulty ratings and advance progress; incorrect or timed-out answers increase difficulty. The game adapts puzzle selection to focus on areas of weakness.
- **Version Scope**: Beta version – Keep implementation minimal, focusing on core mechanics. No advanced graphics, multiplayer, or external integrations unless specified.
- **Platform**: [To be clarified; assume desktop/web-based with keyboard input for answers unless otherwise specified.]
- **Win/Loss Conditions**: No traditional "win" state; the game ends after a fixed number of puzzles or user-initiated exit, showing a summary of competency improvements.

#### 2. Data Structures
- **User-Competency Table**:
  - A table (e.g., dictionary or array of objects) containing all possible multiplication combinations (2x2 to 12x12), resulting in 121 entries (11x11, since 2-12 inclusive).
  - Each entry represents a unique puzzle (e.g., "2x2", "2x3", ..., "12x12"). Treat commutative pairs as the same (e.g., 4x7 is identical to 7x4) to avoid duplication, unless specified otherwise.
  - Properties per entry:
    - **puzzle**: String representation of the puzzle (e.g., "4 x 7").
    - **rating** (Expected Difficulty): Hardcoded integer from 1 (easiest) to 100 (hardest), based on relative difficulty. Examples:
      - Easy: "2 x 2" = 5.
      - Medium: "5 x 5" = 40.
      - Hard: "7 x 8" = 95.
      - [Implement a full hardcoded mapping for all 121 entries; use logical progression where lower numbers are easier, and numbers like 7,8,9,11,12 are harder.]
    - **userRating** (Dynamic Competency): Integer from 1 to 100, initialized to the value of **rating**. This tracks player-specific performance and adjusts over time:
      - Increases (makes "harder") on incorrect answers or timeouts.
      - Decreases (makes "easier"/better competency) on correct answers, with larger decreases for faster responses.
  - Storage: Persist the table locally (e.g., via JSON file or local storage) to maintain progress across sessions. Reset option for new players.

#### 3. Gameplay Mechanics
- **Puzzle Presentation**:
  - Display puzzles one at a time in a simple text format (e.g., "4 x 7 = " with an input field).
  - Time Limit: 25 seconds per puzzle. If no answer is submitted, treat as incorrect and proceed to the next puzzle.
- **Answer Input and Scoring**:
  - Player inputs a numeric answer (integer only).
  - If correct:
    - Measure response time (from puzzle display to submission).
    - Decrease **userRating** based on speed:
      - Max decrease (e.g., -10 points) if answered in ≤5 seconds.
      - Min decrease (e.g., -1 point) if answered in 20+ seconds (but still within limit).
      - Linear interpolation or tiered system for times in between (e.g., define formula: decrease = max_decrease - (time / max_time) * (max_decrease - min_decrease)).
    - Cap **userRating** at 1 (minimum).
  - If incorrect or timeout:
    - Increase **userRating** by a small fixed amount (e.g., +5 points).
    - Cap **userRating** at 100 (maximum).
- **Game Session**:
  - A session consists of a sequence of puzzles (e.g., 20-50; configurable).
  - At session end, display a summary:
    - Net improvement/degradation: Calculate total change in **userRating** across all presented puzzles (sum of deltas; positive sum = degradation, negative = improvement).
    - Optionally, show a list or heatmap of puzzles with their before/after **userRating**.
- **Puzzle Selection Algorithm**:
  - **Initial Behavior**: In early sessions (e.g., first 1-3 games), select a broad range of puzzles across difficulty levels to baseline player competency.
  - **Adaptive Behavior**: In subsequent selections:
    - Prioritize puzzles where **userRating** is high (indicating struggle), but avoid overwhelming with only the hardest.
    - Reduce frequency of low **userRating** puzzles (easy for the player).
    - If player performs well overall (e.g., average **userRating** < 30), introduce more high-rating puzzles.
    - Algorithm Suggestion: Use weighted random selection where weight = **userRating** (higher = more likely to be selected). Adjust weights dynamically after each answer.
  - Avoid repetition in a single session unless necessary for focus.

#### 4. User Interface and Experience
- **Minimal UI**:
  - Main Screen: Display current puzzle, timer countdown, input field, and submit button.
  - Feedback: Immediate after answer (e.g., "Correct! Time: 3s" or "Incorrect. Answer was 28.").
  - End Screen: Summary of net changes, perhaps a progress bar or table showing updated **userRating** for puzzles encountered.
- **Accessibility**: Keyboard-friendly input; clear text; optional sound cues for timer/start.
- **Progress Tracking**: Over multiple sessions, aim for **userRating** to trend downward toward 1 for all puzzles.

#### 5. Technical Requirements
- **Language/Framework**: [To be clarified; assume Python with a simple library like Tkinter for GUI, or web-based with HTML/JS.]
- **Edge Cases**:
  - Handle invalid inputs (e.g., non-numeric) as incorrect.
  - Ensure no division by zero or invalid operations (not applicable here).
  - Randomize puzzle order within selection logic to keep it engaging.
- **Testing**: Unit tests for rating adjustments, selection algorithm, and persistence.
- **Extensibility**: Design modularly for future expansions (e.g., adding division, higher tables).

### Questions to Refine Requirements
To make these requirements clearer and more robust for an AI coding assistant, here are some questions based on ambiguities, gaps, or potential improvements in your notes:

1. **Platform and Tech Stack**: What platform should the game target (e.g., web browser, desktop app, mobile)? Any preferred programming language or framework (e.g., Python, JavaScript, Unity)?

2. **Puzzle Format and Input**: Should puzzles always be in "A x B =" format, or vary (e.g., "What is 4 times 7?")? How should answers be input – keyboard only, on-screen number pad, or voice? Should we treat commutative pairs (e.g., 4x7 and 7x4) as identical entries in the table, or separate?

3. **Game Length and Ending**: How many puzzles per session/round? Should the game end after a fixed number, time limit, when all **userRating** reach a threshold, or only when the user quits?

4. **Adjustment Details**: What specific increments for **userRating** changes? E.g., +5 for wrong/timeout; -10 max for fast correct, -1 min for slow correct? Should there be a formula for time-based decreases (e.g., linear scale)? Any caps on how much it can change per puzzle?

5. **Difficulty Hardcoding**: You mentioned basing ratings on experience – do you have preferences for specific ratings beyond the examples (e.g., rate all 2x as easy, 11x/12x as hard)? Should we use a formula instead (e.g., rating = (A + B) * factor)?

6. **Net Improvement Calculation**: How exactly to compute/display "net improvement/degradation"? E.g., average delta across puzzles, total sum, or percentage change? Should it include all table entries or only those presented in the session?

7. **Multi-User and Persistence**: Support multiple players (e.g., profiles)? How to save/load the competency table (local file, browser storage, cloud)?

8. **Better Ideas/Suggestions**: 
   - To make it more engaging, add streaks (e.g., bonus decreases for 5 correct in a row) or levels (unlock harder tables)?
   - Visual aids like a competency heatmap (grid showing **userRating** colors) at the end?
   - Adaptive timeout: Shorten for easy puzzles, lengthen for hard?
   - Track overall player level or badges for motivation?
   - Error handling: What if the player enters negative numbers or decimals?

Let me know your answers, and I can refine these requirements further!