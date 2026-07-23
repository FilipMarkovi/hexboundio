import { PRIVATE_MAP_OPTIONS } from "./constants.js";

export function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function getPrivateMapLabel(mapId: string): string {
  return PRIVATE_MAP_OPTIONS.find((opt) => opt.id === mapId)?.label ?? mapId;
}

export function getRandomGuestName(): string {
  const randomId = Math.floor(1000000 + Math.random() * 9000000);
  return `Player_${randomId}`;
}
