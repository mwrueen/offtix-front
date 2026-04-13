/**
 * Invitation IDs that already have a Notification row (same company invite).
 * Used to avoid showing the same invite twice (synthetic list + DB notification).
 */
export function invitationIdsCoveredByNotifications(notifications) {
  const set = new Set();
  for (const n of notifications || []) {
    if (n.type !== 'invitation' || !n.relatedId) continue;
    const rm = n.relatedModel;
    if (rm != null && rm !== 'Invitation') continue;
    set.add(String(n.relatedId));
  }
  return set;
}
