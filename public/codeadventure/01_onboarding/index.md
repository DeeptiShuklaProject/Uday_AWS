# Level 1: Target Closest Enemy 🎯

Welcome to the **CodeAdventure Gaming Zone**! 🎮

---

### 🕹️ How to Play:
1. **Choose Language**: Select your preferred programming language (Python, JavaScript, TypeScript, Java, C++, C#, Go, Rust, Bash, Ruby, PHP) from the dropdown menu above the editor.
2. **Mission Objective**: Two enemy monsters (`enemy_1` and `enemy_2`) are approaching your spaceship at different distances (`dist_1` and `dist_2`) during each turn.
3. **Write Logic**: Write comparison logic (`if dist_1 < dist_2`) to `print()` the name of whichever enemy is **closest** (smallest distance).
4. **Fire & Win**: Click the **"Run & Play Game"** button to execute your code. Your laser cannon will fire in real-time, destroy enemy monsters, and award XP points!

---

<CodeAdventureGame levelId="onboarding" />

---

<Quiz 
  question="Why must your program output the enemy with the smallest distance in each turn?"
  options="[
    'Because closest enemies present the immediate threat of impact before reaching 0 distance.',
    'Because enemy names require alphabetical sorting.',
    'Because standard output requires integers only.',
    'To clear your ship memory buffer.'
  ]"
  answerIndex={0}
  explanation="Closest enemies reach your base fastest, so destroying the minimum distance enemy prevents ship destruction."
/>
