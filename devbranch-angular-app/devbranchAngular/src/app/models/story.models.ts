export interface Room {
  id: string;
  name: string;
  description: string;
  clues_present: string[];
  navigation: string[];
  scripted_scene?: string;
}

export interface Clue {
  id: string;
  label: string;
  location: string;
  contents: string;
  twist: string;
}

export interface Character {
  id: string;
  name: string;
  role: string;
  interview_lines?: any; // Can be more specific if structure is known
  behavior?: any; // Can be more specific if structure is known
}

export interface Victim {
  id: string;
  name: string;
  cause_of_death: string;
  discovery_location: string;
  notes: string;
}

export interface ScriptedScene {
  id: string;
  location: string;
  trigger: string;
  beats: any[]; // Can be more specific if structure is known
}

export interface Ending {
  trigger: string[];
  accusation_screen: string;
  final_narration_by_rudi: string[];
}

export interface StoryPlot {
  title: string;
  subtitle: string;
  setting: string;
  narrator: string;
  characters: Record<string, Character>;
  victims: Record<string, Victim>;
  clues: Record<string, Clue>;
  rooms: Record<string, Room>;
  scripted_scenes: Record<string, ScriptedScene>;
  ending: Ending;
}

export interface StoryPrint {
  [key: string]: any;
}
