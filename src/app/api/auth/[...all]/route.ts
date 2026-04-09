import { toNextJsHandler } from "better-auth/next-js"

import { auth } from "@/server/auth"

const authHandlers = toNextJsHandler(auth)

export const GET = authHandlers.GET
export const POST = authHandlers.POST
export const PATCH = authHandlers.PATCH
export const PUT = authHandlers.PUT
export const DELETE = authHandlers.DELETE
