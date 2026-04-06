import {
  GITHUB_STARS_REVALIDATE_SECONDS,
  OPENBACKLOG_REPO_NAME,
  OPENBACKLOG_REPO_OWNER,
} from "@/lib/github"

type GitHubRepoResponse = {
  stargazers_count?: number
}

export async function getOpenBacklogRepoStars() {
  try {
    const token = process.env.GITHUB_TOKEN

    const response = await fetch(
      `https://api.github.com/repos/${OPENBACKLOG_REPO_OWNER}/${OPENBACKLOG_REPO_NAME}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "openbacklog-web",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        next: { revalidate: GITHUB_STARS_REVALIDATE_SECONDS },
      },
    )

    if (!response.ok) {
      return null
    }

    const data = (await response.json()) as GitHubRepoResponse

    return typeof data.stargazers_count === "number"
      ? data.stargazers_count
      : null
  } catch {
    return null
  }
}
