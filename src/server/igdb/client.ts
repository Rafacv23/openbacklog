const TWITCH_TOKEN_ENDPOINT = "https://id.twitch.tv/oauth2/token"
const IGDB_BASE_URL = "https://api.igdb.com/v4"

const DEFAULT_REQUEST_TIMEOUT_MS = 10_000
const DEFAULT_MAX_RETRIES = 3
const TOKEN_EXPIRATION_SAFETY_SECONDS = 60

type IgdbAccessTokenResponse = {
  access_token: string
  expires_in: number
  token_type: string
}

type CachedAccessToken = {
  expiresAt: number
  token: string
}

type IgdbCover = {
  url?: string | null
}

type IgdbNamedEntity = {
  name?: string | null
}

type IgdbPlatform = {
  abbreviation?: string | null
  name?: string | null
}

export type IgdbGame = {
  id: number
  name: string
  slug: string
  summary?: string | null
  cover?: IgdbCover | null
  first_release_date?: number | null
  rating?: number | null
  genres?: IgdbNamedEntity[] | null
  platforms?: IgdbPlatform[] | null
  checksum?: string | null
  updated_at?: number | null
}

let cachedToken: CachedAccessToken | null = null

function getRequiredEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing ${name}`)
  }

  return value
}

function getRequestTimeoutMs(): number {
  const rawValue = Number(process.env.IGDB_REQUEST_TIMEOUT_MS)

  if (!Number.isFinite(rawValue) || rawValue <= 0) {
    return DEFAULT_REQUEST_TIMEOUT_MS
  }

  return rawValue
}

function getMaxRetries(): number {
  const rawValue = Number(process.env.IGDB_MAX_RETRIES)

  if (!Number.isFinite(rawValue) || rawValue < 1) {
    return DEFAULT_MAX_RETRIES
  }

  return Math.floor(rawValue)
}

function shouldRetry(status: number): boolean {
  return status === 429 || status >= 500
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  maxRetries: number,
): Promise<Response> {
  let attempt = 0

  while (true) {
    attempt += 1

    try {
      const response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(getRequestTimeoutMs()),
      })

      if (!shouldRetry(response.status) || attempt >= maxRetries) {
        return response
      }
    } catch (error) {
      if (attempt >= maxRetries) {
        throw error
      }
    }

    const exponentialBackoffMs = 250 * 2 ** (attempt - 1)
    const jitterMs = Math.floor(Math.random() * 125)
    await sleep(exponentialBackoffMs + jitterMs)
  }
}

async function getAccessToken(): Promise<string> {
  const now = Date.now()

  if (cachedToken && cachedToken.expiresAt > now) {
    return cachedToken.token
  }

  const clientId = getRequiredEnv("IGDB_CLIENT_ID")
  const clientSecret = getRequiredEnv("IGDB_CLIENT_SECRET")

  const tokenUrl = new URL(TWITCH_TOKEN_ENDPOINT)
  tokenUrl.searchParams.set("client_id", clientId)
  tokenUrl.searchParams.set("client_secret", clientSecret)
  tokenUrl.searchParams.set("grant_type", "client_credentials")

  const response = await fetchWithRetry(
    tokenUrl.toString(),
    {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    },
    getMaxRetries(),
  )

  if (!response.ok) {
    throw new Error(`IGDB auth failed with status ${response.status}`)
  }

  const data = (await response.json()) as IgdbAccessTokenResponse

  const expiresAt =
    now +
    Math.max(data.expires_in - TOKEN_EXPIRATION_SAFETY_SECONDS, 1) * 1_000

  cachedToken = {
    token: data.access_token,
    expiresAt,
  }

  return data.access_token
}

function escapeSearchTerm(searchTerm: string): string {
  return searchTerm.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
}

const IGDB_GAME_FIELDS =
  "id,name,slug,summary,cover.url,first_release_date,rating,genres.name,platforms.abbreviation,platforms.name,checksum,updated_at,version_parent"

function createSearchBody(query: string, limit: number): string {
  const escapedQuery = escapeSearchTerm(query)

  return [
    `fields ${IGDB_GAME_FIELDS};`,
    `search \"${escapedQuery}\";`,
    "where version_parent = null;",
    `limit ${limit};`,
  ].join(" ")
}

function createGameByIdBody(id: number): string {
  return [
    `fields ${IGDB_GAME_FIELDS};`,
    `where id = ${id} & version_parent = null;`,
    "limit 1;",
  ].join(" ")
}

export function toCoverImageUrl(url: string | null | undefined): string | null {
  if (!url) {
    return null
  }

  const normalizedUrl = url.replace("t_thumb", "t_cover_big")

  if (normalizedUrl.startsWith("//")) {
    return `https:${normalizedUrl}`
  }

  if (normalizedUrl.startsWith("http://")) {
    return normalizedUrl.replace("http://", "https://")
  }

  return normalizedUrl
}

export async function searchIgdbGames(
  query: string,
  limit: number,
): Promise<IgdbGame[]> {
  const clientId = getRequiredEnv("IGDB_CLIENT_ID")
  const accessToken = await getAccessToken()

  const response = await fetchWithRetry(
    `${IGDB_BASE_URL}/games`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Client-ID": clientId,
        Authorization: `Bearer ${accessToken}`,
      },
      body: createSearchBody(query, limit),
      cache: "no-store",
    },
    getMaxRetries(),
  )

  if (!response.ok) {
    throw new Error(`IGDB games search failed with status ${response.status}`)
  }

  const data = (await response.json()) as IgdbGame[]

  return data.filter((game) => Boolean(game?.id && game?.name && game?.slug))
}

export async function getIgdbGameById(id: number): Promise<IgdbGame | null> {
  if (!Number.isInteger(id) || id <= 0) {
    return null
  }

  const clientId = getRequiredEnv("IGDB_CLIENT_ID")
  const accessToken = await getAccessToken()

  const response = await fetchWithRetry(
    `${IGDB_BASE_URL}/games`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Client-ID": clientId,
        Authorization: `Bearer ${accessToken}`,
      },
      body: createGameByIdBody(id),
      cache: "no-store",
    },
    getMaxRetries(),
  )

  if (!response.ok) {
    throw new Error(`IGDB game fetch failed with status ${response.status}`)
  }

  const data = (await response.json()) as IgdbGame[]
  const game = data.find((entry) => Boolean(entry?.id && entry?.name && entry?.slug))

  return game ?? null
}
