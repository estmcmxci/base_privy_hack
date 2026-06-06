const APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const CLIENT_ID = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID;

if (!APP_ID) {
  throw new Error("NEXT_PUBLIC_PRIVY_APP_ID is not set");
}

if (!CLIENT_ID) {
  throw new Error("NEXT_PUBLIC_PRIVY_CLIENT_ID is not set");
}

export function getPrivyAppId(): string {
  return APP_ID!;
}

export function getPrivyClientId(): string {
  return CLIENT_ID!;
}
