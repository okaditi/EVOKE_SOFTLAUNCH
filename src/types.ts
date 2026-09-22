export interface WaitlistFormData {
  name: string;
  email: string;
  primaryGame: string;
}

export type DisciplineOption = {
  value: string;
  label: string;
  genre: string;
};

export const DISCIPLINES: DisciplineOption[] = [
  { value: 'valorant', label: 'VALORANT', genre: 'Tactical FPS' },
  { value: 'cs2', label: 'COUNTER-STRIKE 2', genre: 'Tactical FPS' },
  { value: 'bgmi', label: 'BATTLEGROUNDS / MOBILE', genre: 'Battle Royale' },
  { value: 'dota', label: 'DOTA 2 / MOBA', genre: 'Competitive MOBA' },
  { value: 'fighting', label: 'FIGHTING GAMES (FGC)', genre: 'Direct 1v1' },
  { value: 'other', label: 'OTHER ARENA', genre: 'Multi-Discipline' },
];

export type InteractiveObjectId =
  | 'monitor'
  | 'monitor_power'
  | 'controller'
  | 'chair'
  | 'headset'
  | 'pc'
  | 'keyboard'
  | 'mouse';

export interface DiscoveryItem {
  id: InteractiveObjectId;
  label: string;
  discoveryText: string;
  subtext: string;
  iconName: string;
}

export const DISCOVERY_ITEMS: Record<InteractiveObjectId, DiscoveryItem> = {
  controller: {
    id: 'controller',
    label: 'PRO CONTROLLER',
    discoveryText: 'PLAY.',
    subtext: 'Forged for instinct and milliseconds.',
    iconName: 'Gamepad2',
  },
  chair: {
    id: 'chair',
    label: 'CHAMPION SEAT',
    discoveryText: 'PROVE.',
    subtext: 'Ergonomic 360° swiveling battle throne facing desk.',
    iconName: 'Armchair',
  },
  pc: {
    id: 'pc',
    label: 'EVOKE APEX RIG',
    discoveryText: 'PROGRESS.',
    subtext: 'Zero latency liquid-cooled computational dominance. Click to power ON/OFF.',
    iconName: 'Cpu',
  },
  headset: {
    id: 'headset',
    label: 'ACOUSTIC CANOPY',
    discoveryText: 'COMPETE.',
    subtext: 'Pinpoint spatial telemetry. Click to put on headphones and play soundtrack.',
    iconName: 'Headphones',
  },
  mouse: {
    id: 'mouse',
    label: 'PRECISION MOUSE',
    discoveryText: 'TRACK.',
    subtext: 'Drag mouse on desk to move live cursor on the curved display.',
    iconName: 'Mouse',
  },
  monitor: {
    id: 'monitor',
    label: 'CURVED DISPLAY',
    discoveryText: 'MORE THAN A GAME.',
    subtext: 'The definitive competitive ecosystem taking shape.',
    iconName: 'Monitor',
  },
  monitor_power: {
    id: 'monitor_power',
    label: 'MONITOR POWER',
    discoveryText: 'MORE THAN A GAME.',
    subtext: 'Toggle 240Hz spatial display illumination.',
    iconName: 'Power',
  },
  keyboard: {
    id: 'keyboard',
    label: 'MECHANICAL DECK',
    discoveryText: "WHAT'S NEXT?",
    subtext: 'Tactile precision crafted for master champions.',
    iconName: 'Keyboard',
  },
};

