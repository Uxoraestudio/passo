/**
 * Welcome tour of the panel. It opens by itself the first time each person
 * signs in on a browser, and again from "Ver guía del panel" (account menu or
 * Configuración). Done is remembered per user, in this browser.
 */

const doneKey = (userId: string) => `aforiq-admin:onboarding-done:${userId}`;
const START_EVENT = "aforiq:onboarding-start";

export function isOnboardingDone(userId: string) {
  try {
    return localStorage.getItem(doneKey(userId)) === "1";
  } catch {
    // Private mode: don't nag on every page.
    return true;
  }
}

export function markOnboardingDone(userId: string) {
  try {
    localStorage.setItem(doneKey(userId), "1");
  } catch {
    // Nothing to remember it in.
  }
}

/** Opens the tour on the current page. */
export function startOnboarding() {
  window.dispatchEvent(new Event(START_EVENT));
}

export function onOnboardingStart(callback: () => void) {
  window.addEventListener(START_EVENT, callback);
  return () => window.removeEventListener(START_EVENT, callback);
}
