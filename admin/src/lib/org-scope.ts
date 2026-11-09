/**
 * The productora the signed-in person works for, or null for platform staff
 * (Uxora / AFORIQ), who see every productora.
 *
 * The database already keeps each productora's private data to itself. This
 * also hides other productoras' *published* events and venues, which are
 * public for the site but don't belong in someone else's panel. AuthGuard
 * sets it as soon as it knows who is signed in.
 */
let currentOrgId: string | null = null;

export function setOrgScope(orgId: string | null) {
  currentOrgId = orgId;
}

export function orgScope(): string | null {
  return currentOrgId;
}
