# Gemini Agent Instructions — Enterprise Datacenter Murder Mystery
# File: GEMINI_INSTRUCTIONS.md
# Place this file in the project root directory

---

## Overview

You are implementing a murder mystery web application in Angular.
The story content lives in two source files:

- `src/assets/story/enterpriseDatacenter/storyPlot1.json`
  This is the technical story file. It contains all rooms, clues,
  characters, scripted scenes, victim data, alibi logic, and the
  ending trigger. Drive all game logic from this file.

- `src/assets/story/enterpriseDatacenter/storyPrint.json`
  This is the written narrative version. Use this for flavor text,
  narration boxes, Bad Rudi's spoken lines, scene descriptions,
  and any atmospheric copy that appears on screen.

Do not hardcode any story content into components.
Do not duplicate content between the two files in your implementation.
Load both files via Angular HttpClient and reference them separately
based on what you need — logic from storyPlot1, prose from storyPrint.

---

## File Structure

Work only within the following directories:

src/
  app/
    components/      ← Create all new components here
    services/        ← Create StoryService here to load both JSON files
    models/          ← Create TypeScript interfaces here for story data
  assets/
    story/
      enterpriseDatacenter/
        storyPlot1.json   ← DO NOT MODIFY
        storyPrint.json   ← DO NOT MODIFY

Do not modify any file outside of src/app and src/assets.
Do not install any new npm packages.
Do not modify angular.json, package.json, or tsconfig.json.

---

## Step 1 — Create TypeScript Interfaces

Create the following file:
`src/app/models/story.models.ts`

Define interfaces for:
- Room (id, name, description, clues_present, navigation, scripted_scene?)
- Clue (id, label, location, contents, twist)
- Character (id, name, role, interview_lines?, behavior?)
- Victim (id, name, cause_of_death, discovery_location, notes)
- ScriptedScene (id, location, trigger, beats)
- Ending (trigger, accusation_screen, final_narration_by_rudi)
- StoryPlot (title, subtitle, setting, narrator, characters,
             victims, clues, rooms, scripted_scenes, ending)
- StoryPrint (use a flexible structure — this file is prose-based)

---

## Step 2 — Create StoryService

Create the following file:
`src/app/services/story.service.ts`

This service must:
- Load storyPlot1.json using HttpClient and expose it as an Observable
- Load storyPrint.json using HttpClient and expose it as an Observable
- Expose the current room state
- Expose the collected clues state as a Record<string, boolean>
- Expose the current scripted scene state
- Provide a method to navigate between rooms by room id
- Provide a method to collect a clue by clue id
- Provide a method to check if the ending trigger conditions are met
  (player has collected both clue_vm109_logs and clue_gx20)

---

## Step 3 — Build These Components

Build each component listed below as a standalone Angular component.
Each component should pull data from StoryService only.
No story content should be hardcoded in any component.

### TitleScreenComponent
`src/app/components/title-screen/`

Display from storyPlot1.json:
- story.title
- story.subtitle
- story.setting

Display a Begin Investigation button that transitions to room_entrance.

---

### RoomComponent
`src/app/components/room/`

This is the main gameplay component. It must:
- Display the current room name and description from storyPlot1.json
- List all clues present in the room as clickable items
- When a clue is clicked, mark it collected and display:
  - clue.contents from storyPlot1.json
  - clue.twist from storyPlot1.json
  - Relevant prose from storyPrint.json if available
- Display navigation buttons for each room id in the room's
  navigation array, using the target room's name as the button label
- If the room has a scripted_scene value, trigger that scene
  on first entry only
- After clue_vm109_logs and clue_gx20 are both collected,
  display a Make Your Accusation button

---

### ScriptedSceneComponent
`src/app/components/scripted-scene/`

Displays scripted beats one at a time.
Player clicks through each beat sequentially.
Pull beats from storyPlot1.json scripted_scenes array by scene id.
When all beats are complete, return control to RoomComponent.

Scenes to implement:
- manager_intro (triggers on first entry to room_entrance)
- rudi_interview (triggers on first entry to room_rudis_terminal)
- rudi_qnap_breakdown (triggers when clue_workstation is collected)

---

### ClueLogComponent
`src/app/components/clue-log/`

A persistent sidebar or collapsible panel.
Shows all clues the player has collected so far.
Each entry displays:
- clue.label
- clue.contents
- clue.twist

---

### RudiNarratorComponent
`src/app/components/rudi-narrator/`

A styled terminal-style box that appears at the bottom of the screen.
Displays Bad Rudi's narration lines from storyPrint.json.
Should feel like terminal output — monospace font, dim green or
amber text on dark background.
Triggered by scripted scenes and clue discoveries.

---

### EndingComponent
`src/app/components/ending/`

Triggered when player clicks Make Your Accusation after collecting
both clue_vm109_logs and clue_gx20.

Display from storyPlot1.json ending:
- accusation_screen text
- final_narration_by_rudi lines, revealed one at a time
  in the RudiNarratorComponent style

Display a Case Closed screen when all narration lines are complete.

---

## Step 4 — Routing

Set up Angular routing with these routes:

/ → TitleScreenComponent
/investigate → RoomComponent (default room: room_entrance)
/ending → EndingComponent

Use Angular Router. No external routing libraries.

---

## Step 5 — Visual Design

Apply these styles globally or per component. No external CSS libraries.
Use CSS variables defined in styles.css for theming.
```css
:root {
  --bg-primary: #0a0a0a;
  --bg-secondary: #111318;
  --bg-panel: #1a1d24;
  --accent-red: #8b0000;
  --accent-red-dim: #3d0000;
  --accent-amber: #b8860b;
  --text-primary: #c9cdd4;
  --text-dim: #6b7280;
  --text-rudi: #4ade80;
  --font-body: 'Segoe UI', sans-serif;
  --font-mono: 'Courier New', monospace;
  --border-dim: #2a2d35;
}
```

Rules:
- Background is always dark. No white backgrounds anywhere.
- Emergency lighting effect: subtle dark red glow on key panels.
- RudiNarratorComponent always uses --font-mono and --text-rudi.
- Clue items should look like evidence cards — bordered, slightly
  elevated, dim red accent on hover.
- Navigation buttons should feel like door controls — structured,
  not playful.
- All transitions between rooms should fade in and out.
- Mobile responsive. Stack panels vertically on small screens.

---

## Step 6 — Compile Check

After implementing all components run:

ng serve

The app must compile with zero errors and zero warnings.
If there are errors fix them before considering the task complete.
Every route must be reachable.
Every scripted scene must play through completely.
The ending must trigger correctly when both clues are collected.

---

## What You Must Not Do

- Do not hardcode any story text into component templates or TypeScript
- Do not install any npm packages
- Do not modify storyPlot1.json or storyPrint.json
- Do not create any files outside of src/app and src/assets
- Do not use NgRx, Akita, or any external state management library
- Do not use any CSS framework including Bootstrap or Tailwind
- Do not add animations beyond simple CSS fade transitions
- Do not add any AI API calls — Bad Rudi's lines are all in the JSON

---

## Summary Checklist

- [ ] story.models.ts created with all interfaces
- [ ] StoryService loads both JSON files via HttpClient
- [ ] TitleScreenComponent renders and routes to investigation
- [ ] RoomComponent renders rooms, clues, and navigation from JSON
- [ ] ScriptedSceneComponent plays all three scenes correctly
- [ ] ClueLogComponent tracks and displays collected clues
- [ ] RudiNarratorComponent renders in terminal style
- [ ] EndingComponent triggers on correct clue combination
- [ ] Routing configured for all three routes
- [ ] CSS variables applied consistently across all components
- [ ] ng serve runs with zero errors
- [ ] All rooms navigable
- [ ] Ending reachable and completable
