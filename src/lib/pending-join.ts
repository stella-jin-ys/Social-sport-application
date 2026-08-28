export type PendingJoin = { groupSlug: string; returnTo: string };

const intentKey = "huddle:pending-join";
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validate(intent: PendingJoin) {
  if (!slugPattern.test(intent.groupSlug) || intent.returnTo !== `/groups/${intent.groupSlug}`) {
    throw new Error("Invalid pending join intent");
  }
}

export function setPendingJoin(intent: PendingJoin) {
  validate(intent);
  window.sessionStorage.setItem(intentKey, JSON.stringify(intent));
}

export function readPendingJoin(): PendingJoin | null {
  const serializedIntent = window.sessionStorage.getItem(intentKey);

  if (!serializedIntent) return null;

  try {
    const intent = JSON.parse(serializedIntent) as PendingJoin;
    validate(intent);
    return intent;
  } catch {
    clearPendingJoin();
    return null;
  }
}

export function clearPendingJoin() {
  window.sessionStorage.removeItem(intentKey);
}
