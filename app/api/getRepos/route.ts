import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  // check session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  console.log("Session auth :", session);

  

  if (!session) {
    return new Response("Not authenticated", { status: 401 });
  }

  // get GitHub access token
  const { accessToken } = await auth.api.getAccessToken({
    headers: await headers(),
    body: { providerId: "github", userId: session.session.userId },
  });

  if (!accessToken) {
    return new Response("GitHub token missing", { status: 401 });
  }

  // call GitHub API
  const res = await fetch("https://api.github.com/user/repos", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const repos = await res.json();

  return NextResponse.json({ repos });
}
