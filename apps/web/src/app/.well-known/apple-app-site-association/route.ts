/**
 * iOS Universal Links: envly.fr links open the app when it is installed.
 * Only paths that have a screen in the app; everything else stays on the website.
 * Must be served as JSON, without redirect, on every domain listed in the app's associatedDomains.
 */
const APP_ID = "X4NZH246AH.fr.envly.app";

export const dynamic = "force-static";

export function GET() {
  return Response.json(
    {
      applinks: {
        details: [
          {
            appIDs: [APP_ID],
            components: [
              { "/": "/w/*", comment: "Public lists" },
              { "/": "/u/*", comment: "Public profiles" },
              { "/": "/s/*", comment: "Secret Santa invitations" },
              { "/": "/collection/*", comment: "My lists" },
            ],
          },
        ],
      },
      webcredentials: { apps: [APP_ID] },
    },
    { headers: { "Cache-Control": "public, max-age=3600" } }
  );
}
