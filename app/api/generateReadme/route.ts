import { auth } from "@/lib/auth";
import { headers, cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(req: NextRequest) {
  const { repoId } = await req.json();

  const h = await headers();

  const session = await auth.api.getSession({ headers: h });
  console.log("Session auth:", session);
  console.log("Cookies at end of request:", (await cookies()).getAll());

  if (!session) {
    return NextResponse.json({ status: 401, message: "Not authenticated" });
  }

  if (!repoId) {
    return NextResponse.json(
      { status: 400, message: "Repo ID is required" },
      { status: 400 }
    );
  }

  const { accessToken } = await auth.api.getAccessToken({
    headers: h,
    body: { providerId: "github", userId: session.session.userId },
  });

  if (!accessToken) {
    return new Response("GitHub token missing", { status: 401 });
  }

  const repoRes = await fetch(`https://api.github.com/repositories/${repoId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!repoRes.ok) {
    return new Response("GitHub API error", { status: repoRes.status });
  }

  const repo = await repoRes.json();

  const readmeRes = await fetch(
    `https://api.github.com/repos/${repo.full_name}/readme`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3.raw",
      },
    }
  );

  console.log("Existing README fetch status:", readmeRes);

  const existingReadme = readmeRes.ok ? await readmeRes.text() : "";
  const prompt = `
You are an expert software engineer and technical writer. Generate a highly professional, visually appealing, and complete README for this GitHub repository:

Repo: https://github.com/${repo.full_name}
Description: ${repo.description || "No description provided"}
Existing README content (if any): ${existingReadme || "None"}

The README must include the following sections in order, with appropriate headings and emojis:
1. 🎯 Project Title
2. 📝 Description
3. ⚡ Features
4. 💻 Installation Guide
5. 🏗️ Project Structure (folder/file explanation)
6. 🛠️ Tech Stack
7. 🤝 Contributing
8. 📄 License
9. ❓ Questions / Contact Info

Requirements:
- Provide the README in HTML format, no markdown.
- Use a black background with bright green headings and light green code blocks.
- Add CSS styling to make headings, paragraphs, lists, and code blocks look professional.
- Include emojis for sections, bullets, or highlights where appropriate.
- Keep it readable, professional, and visually appealing.
- Avoid explanations or content outside the README.

Return only the HTML content.
`;

  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  let newReadme = result.text;
  newReadme = newReadme!
    .replace(/```(?:html)?/g, "")
    .replace(/```/g, "")
    .trim();

  return NextResponse.json({
    repo,
    generatedReadme: newReadme,
  });
}
