"use client";
import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";

interface Repo {
  id: number;
  name: string;
  full_name: string;
  description?: string | null;
  html_url?: string;
}

export default function Home() {
  const { data: session, isPending } = authClient.useSession();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [readme, setReadme] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session) {
      fetch("/api/getRepos", { credentials: "include" })
        .then((res) => res.json())
        .then((data) => setRepos(data.repos));
    }
  }, [session]);

  if (isPending)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-green-900">
        <div className="text-white text-lg animate-pulse">Loading...</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-green-900 flex justify-center items-start md:items-center py-8 px-6">
      <div className="w-full h-full flex-1 mx-auto bg-gradient-to-b from-gray-950/80 to-gray-900/60 rounded-3xl shadow-2xl border border-green-800 overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Panel */}
        <div className="md:w-1/3 p-8 flex flex-col gap-6 border-b md:border-b-0 md:border-r border-green-800 overflow-auto bg-gradient-to-b from-transparent to-black/10">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-extrabold text-green-400">
              ByteTask{" "}
              <span className="text-green-200/80 text-sm">
                by Punay Kukreja
              </span>
            </h1>
            <p className="text-green-200/80 mt-2 text-sm md:text-base max-w-[22rem]">
              Generate professional README files for your GitHub repositories
              instantly.
            </p>
          </div>

          {!session ? (
            <div className="flex justify-center md:justify-start mt-4">
              <button
                className="flex items-center gap-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-6 py-3 rounded-xl shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                onClick={() =>
                  authClient.signIn.social({
                    provider: "github",
                    callbackURL: "https://readme-bytetask.vercel.app/",
                  })
                }
              >
                <svg width="24" height="24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.36 6.84 9.72.5.09.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.36-3.37-1.36-.45-1.17-1.1-1.48-1.1-1.48-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05a9.18 9.18 0 0 1 2.5-.34c.85.01 1.71.12 2.5.34 1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.07.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.58.69.48A10.01 10.01 0 0 0 22 12.26C22 6.58 17.52 2 12 2z" />
                </svg>
                Login with GitHub
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                <label className="text-gray-200 font-medium">
                  Select Repository:
                </label>
                <select
                  className="bg-gray-800 text-green-100 px-4 py-2 rounded-lg border border-green-700 focus:outline-none focus:ring-2 focus:ring-green-400"
                  value={selectedRepo}
                  onChange={(e) => setSelectedRepo(e.target.value)}
                >
                  <option>Select a repo</option>
                  {repos.map((repo: Repo) => (
                    <option key={repo.id} value={repo.id}>
                      {repo.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className={`mt-4 w-full px-6 py-3 rounded-2xl font-semibold text-white shadow-lg transform transition-all duration-200 ${
                  !selectedRepo || loading
                    ? "bg-green-600/50 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                }`}
                disabled={!selectedRepo || loading}
                onClick={async () => {
                  setLoading(true);
                  setError("");
                  const res = await fetch("/api/generateReadme", {
                    method: "POST",
                    body: JSON.stringify({ repoId: selectedRepo }),
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                  });
                  const data = await res.json();
                  if (data.status === 401) {
                    setError(
                      "GitHub token missing or expired. Please login again."
                    );
                  } else {
                    if (data.generatedReadme) {
                      setReadme(data.generatedReadme);
                    } else {
                      setError("Something went wrong. Please try again.");
                    }
                  }
                  setLoading(false);
                }}
              >
                {loading ? "Generating..." : "Generate README"}
              </button>

              {error && (
                <p className="text-red-400 mt-2 text-center">{error}</p>
              )}

              <button
                className="mt-2 w-full px-4 py-2 bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white rounded-lg shadow-md transition transform hover:-translate-y-0.5 duration-200"
                onClick={() => authClient.signOut()}
              >
                Logout
              </button>
            </>
          )}
        </div>

        {/* Right Panel */}
        <div className="md:w-2/3 p-8 bg-gradient-to-b from-black/70 to-black/40 flex flex-col gap-6 overflow-auto">
          {!session?.session.userId && (
            <div className="flex flex-col items-center justify-center text-center mt-20 text-green-200/60">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-12 h-12"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-lg font-medium mt-4">
                Please log in to generate README files.
              </p>
            </div>
          )}
          {loading && session?.session.userId && !error ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-green-300 animate-pulse text-lg font-medium">
                Generating README...
              </p>
            </div>
          ) : readme && session?.session.userId ? (
            <div className="bg-black rounded-2xl border-2 border-green-700/60 shadow-2xl overflow-auto max-h-[72vh] p-6">
              <div className="flex justify-end">
                <button
                  className="mb-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg shadow-md transition transform hover:-translate-y-0.5 duration-200"
                  onClick={() => {
                    navigator.clipboard
                      .writeText(readme)
                      .then(() => alert("Copied to clipboard"));
                  }}
                >
                  Copy Code
                </button>
              </div>
              <div
                className="prose prose-invert text-green-200 overflow-auto prose-p:text-green-200 prose-headings:text-green-300"
                style={{
                  maxHeight: "550px",
                  overflowY: "auto",
                  paddingRight: "8px",
                }}
                dangerouslySetInnerHTML={{ __html: readme }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center mt-20 text-green-200/60">
              {session?.session.userId && (
                <>
                  <p className="text-lg font-medium">
                    Your generated README will appear here
                  </p>
                  <p className="text-sm mt-2">
                    Select a repository and click Generate README.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}