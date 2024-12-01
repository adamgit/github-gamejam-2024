/**
 * Only exists so that: mission-system code can access the player's main desktop-OS
 * ... note: we may have mutiple desktops in future.
 */

import { OperatingSystem } from '../data/OperatingSystem';

let OSForMissions: OperatingSystem | null = null;

export function setMissionOS(os: OperatingSystem) {
  OSForMissions = os;
}

export function getMissionOS(): OperatingSystem {
  if (!OSForMissions) {
    throw new Error('Mission OS not initialized');
  }
  return OSForMissions;
}

/** LAST MINUTE HACK so that missions can check current-rep (which is embedded deep in OS-services ,ugh) */
export function getFailableMissionOS(): OperatingSystem | undefined {
  return OSForMissions;
}