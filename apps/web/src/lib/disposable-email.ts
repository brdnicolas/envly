import domains from "disposable-email-domains";
import wildcards from "disposable-email-domains/wildcard.json";

/**
 * Throwaway inboxes (yopmail, 10minutemail, guerrillamail…), from the community-maintained
 * `disposable-email-domains` list (~120k domains + wildcard providers). Update with `yarn up disposable-email-domains`.
 * Apple's "Hide My Email" relay (privaterelay.appleid.com) is a real, persistent inbox: always allowed.
 */
const BLOCKED = new Set<string>(domains);
const ALLOWED = new Set(["privaterelay.appleid.com"]);

export function isDisposableEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@")[1];
  if (!domain || ALLOWED.has(domain)) return false;
  if (BLOCKED.has(domain)) return true;
  // Wildcard providers: any subdomain of theirs is disposable too.
  return (wildcards as string[]).some((w) => domain === w || domain.endsWith(`.${w}`));
}
