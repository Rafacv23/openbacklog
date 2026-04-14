import {
  and,
  asc,
  eq,
  inArray,
  isNotNull,
  like,
  ne,
  notInArray,
  or,
  sql,
} from "drizzle-orm"

import { db } from "@/server/db"
import { friendships, user } from "@/server/db/schema"
import { parsePeopleSearch, parseUsernameCandidate } from "@/server/friends/validation"

const DEFAULT_PEOPLE_LIMIT = 12
const MAX_PEOPLE_LIMIT = 48

export type FriendCard = {
  userId: string
  username: string
  displayName: string
  followersCount: number
  followingCount: number
}

export type FriendsHubData = {
  search: string
  following: FriendCard[]
  discover: FriendCard[]
}

export type FollowMutationResult =
  | { status: "ok"; following: boolean }
  | { status: "not_found" }
  | { status: "invalid_target" }

function clampLimit(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_PEOPLE_LIMIT
  }

  return Math.min(Math.max(Math.floor(value), 1), MAX_PEOPLE_LIMIT)
}

function toDisplayName(input: {
  displayUsername: string | null
  username: string
}): string {
  return input.displayUsername ?? input.username
}

async function getDirectionalCounts(userIds: string[]) {
  const followersByUserId = new Map<string, number>()
  const followingByUserId = new Map<string, number>()

  if (userIds.length === 0) {
    return {
      followersByUserId,
      followingByUserId,
    }
  }

  const [followerRows, followingRows] = await Promise.all([
    db
      .select({
        userId: friendships.addresseeUserId,
        count: sql<number>`count(*)`,
      })
      .from(friendships)
      .where(inArray(friendships.addresseeUserId, userIds))
      .groupBy(friendships.addresseeUserId),
    db
      .select({
        userId: friendships.requesterUserId,
        count: sql<number>`count(*)`,
      })
      .from(friendships)
      .where(inArray(friendships.requesterUserId, userIds))
      .groupBy(friendships.requesterUserId),
  ])

  for (const row of followerRows) {
    followersByUserId.set(row.userId, Number(row.count))
  }

  for (const row of followingRows) {
    followingByUserId.set(row.userId, Number(row.count))
  }

  return {
    followersByUserId,
    followingByUserId,
  }
}

export async function getFollowerStats(userId: string): Promise<{
  followerCount: number
  followingCount: number
}> {
  const counts = await getDirectionalCounts([userId])

  return {
    followerCount: counts.followersByUserId.get(userId) ?? 0,
    followingCount: counts.followingByUserId.get(userId) ?? 0,
  }
}

export async function getFriendsHub(input: {
  viewerUserId: string
  search?: unknown
  limit?: number
}): Promise<FriendsHubData> {
  const safeLimit = clampLimit(input.limit)
  const search = parsePeopleSearch(input.search)
  const searchPattern = search.length > 0 ? `%${search}%` : ""

  const followingRows = await db
    .select({
      targetUser: user,
    })
    .from(friendships)
    .innerJoin(user, eq(friendships.addresseeUserId, user.id))
    .where(
      and(
        eq(friendships.requesterUserId, input.viewerUserId),
        isNotNull(user.username),
      ),
    )
    .orderBy(asc(user.username))

  const followedUserIds = followingRows.map((row) => row.targetUser.id)

  const discoverFilters = [ne(user.id, input.viewerUserId), isNotNull(user.username)]

  if (followedUserIds.length > 0) {
    discoverFilters.push(notInArray(user.id, followedUserIds))
  }

  if (searchPattern.length > 0) {
    const searchFilter = or(
      like(user.username, searchPattern),
      like(user.displayUsername, searchPattern),
      like(user.name, searchPattern),
    )

    if (searchFilter) {
      discoverFilters.push(searchFilter)
    }
  }

  const discoverRows = await db
    .select()
    .from(user)
    .where(and(...discoverFilters))
    .orderBy(asc(user.username))
    .limit(safeLimit)

  const allUserIds = [
    ...new Set([
      ...followingRows.map((row) => row.targetUser.id),
      ...discoverRows.map((row) => row.id),
    ]),
  ]

  const { followersByUserId, followingByUserId } = await getDirectionalCounts(allUserIds)

  const following: FriendCard[] = followingRows
    .filter((row): row is typeof row & { targetUser: typeof row.targetUser & { username: string } } =>
      Boolean(row.targetUser.username),
    )
    .map((row) => ({
      userId: row.targetUser.id,
      username: row.targetUser.username,
      displayName: toDisplayName({
        displayUsername: row.targetUser.displayUsername,
        username: row.targetUser.username,
      }),
      followersCount: followersByUserId.get(row.targetUser.id) ?? 0,
      followingCount: followingByUserId.get(row.targetUser.id) ?? 0,
    }))

  const discover: FriendCard[] = discoverRows
    .filter((entry): entry is typeof entry & { username: string } => Boolean(entry.username))
    .map((entry) => ({
      userId: entry.id,
      username: entry.username,
      displayName: toDisplayName({
        displayUsername: entry.displayUsername,
        username: entry.username,
      }),
      followersCount: followersByUserId.get(entry.id) ?? 0,
      followingCount: followingByUserId.get(entry.id) ?? 0,
    }))

  return {
    search,
    following,
    discover,
  }
}

async function findTargetUserByUsername(usernameCandidate: unknown) {
  const username = parseUsernameCandidate(usernameCandidate)

  if (!username) {
    return null
  }

  const rows = await db
    .select({
      id: user.id,
      username: user.username,
    })
    .from(user)
    .where(eq(user.username, username))
    .limit(1)

  const targetUser = rows[0]

  if (!targetUser?.username) {
    return null
  }

  return {
    id: targetUser.id,
    username: targetUser.username,
  }
}

export async function followUserByUsername(input: {
  followerUserId: string
  targetUsername: unknown
}): Promise<FollowMutationResult> {
  const targetUser = await findTargetUserByUsername(input.targetUsername)

  if (!targetUser) {
    return { status: "not_found" }
  }

  if (targetUser.id === input.followerUserId) {
    return { status: "invalid_target" }
  }

  await db
    .insert(friendships)
    .values({
      requesterUserId: input.followerUserId,
      addresseeUserId: targetUser.id,
      status: "accepted",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoNothing({
      target: [friendships.requesterUserId, friendships.addresseeUserId],
    })

  return {
    status: "ok",
    following: true,
  }
}

export async function unfollowUserByUsername(input: {
  followerUserId: string
  targetUsername: unknown
}): Promise<FollowMutationResult> {
  const targetUser = await findTargetUserByUsername(input.targetUsername)

  if (!targetUser) {
    return { status: "not_found" }
  }

  if (targetUser.id === input.followerUserId) {
    return { status: "invalid_target" }
  }

  await db
    .delete(friendships)
    .where(
      and(
        eq(friendships.requesterUserId, input.followerUserId),
        eq(friendships.addresseeUserId, targetUser.id),
      ),
    )

  return {
    status: "ok",
    following: false,
  }
}
