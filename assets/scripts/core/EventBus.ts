/**
 * EventBus - 轻量事件总线（跨 UI/系统通信）
 */

import { EventTarget } from 'cc';

export const EventBus = new EventTarget();

export const EVENTS = {
  REQUEST_PICK_PET: 'REQUEST_PICK_PET', // payload: { slot: 0|1 }
  PET_PICKED: 'PET_PICKED',             // payload: { slot: 0|1, itemId: string }
  NOTIFY: 'NOTIFY',                     // payload: { msg: string }
  TUTORIAL_NEXT: 'TUTORIAL_NEXT',       // payload: { step: number }
  WEATHER_POPUP: 'WEATHER_POPUP',       // payload: { type, bonusText }
  STORM_BOSS_UPDATE: 'STORM_BOSS_UPDATE', // payload: { progress, goal }
} as const;

