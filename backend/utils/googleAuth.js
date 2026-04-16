import { OAuth2Client } from "google-auth-library";

export const verifyGoogleIdToken = async (idToken) => {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured");
  }

  const oauthClient = new OAuth2Client(clientId);
  const ticket = await oauthClient.verifyIdToken({
    idToken,
    audience: clientId,
  });

  const payload = ticket.getPayload();
  if (!payload?.email) {
    throw new Error("Google account email not available");
  }

  return {
    email: payload.email.toLowerCase(),
    name: payload.name || payload.email,
    emailVerified: Boolean(payload.email_verified),
    picture: payload.picture,
  };
};
