/**
 * Shared by CommitteeAvatarRow.tsx and CommitteePanel.tsx so the same
 * analyst gets the same photo in both places -- extracted here to
 * avoid two independent copies of this logic drifting apart, same
 * reasoning as every other "shared helper" in this codebase.
 */
export const COMMITTEE_PHOTOS = [
    "lina", "sarah", "jasmine", "priya", "marcus_j", "donald",
    "arjun", "chris", "kenji", "declan", "olivia", "ethan", "mei",
];

/**
 * Guaranteed-unique assignment across ALL analysts passed in, not
 * hash-based (a hash-mod assignment can collide once analyst count
 * exceeds the photo pool -- see the real bug this replaced). Analysts
 * are sorted alphabetically for a stable, deterministic order across
 * reloads, then assigned photos by index. Analysts beyond the pool
 * size get null (render a generic bot icon, never a reused face).
 */
export function buildCommitteePhotoAssignments(analystNames: string[]): Map<string, string | null> {
    const sorted = [...analystNames].sort();
    const map = new Map<string, string | null>();
    sorted.forEach((name, i) => {
        map.set(name, i < COMMITTEE_PHOTOS.length ? `/committee/${COMMITTEE_PHOTOS[i]}.png` : null);
    });
    return map;
}
