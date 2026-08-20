import { describe, it, expect } from "vitest"
import { getAuthDecision, type SessionInfo } from "../auth-decisions"

// Fixture helpers
const noSession = null

const publicUser: SessionInfo = {
  userId: "u1",
  role: "PUBLIC",
  isActive: false,
  emailVerified: true,
}

const activeScholar: SessionInfo = {
  userId: "u2",
  role: "SCHOLAR",
  isActive: true,
  emailVerified: true,
}

const inactiveScholar: SessionInfo = {
  userId: "u3",
  role: "SCHOLAR",
  isActive: false,
  emailVerified: true,
}

const adminUser: SessionInfo = {
  userId: "u4",
  role: "ADMIN",
  isActive: true,
  emailVerified: true,
}

describe("Public routes (/, /browse, /papers/...)", () => {
  it("allows unauthenticated users", () => {
    expect(getAuthDecision("/", noSession)).toEqual({ action: "allow" })
    expect(getAuthDecision("/browse", noSession)).toEqual({ action: "allow" })
  })

  it("allows any authenticated user", () => {
    expect(getAuthDecision("/browse", publicUser)).toEqual({ action: "allow" })
    expect(getAuthDecision("/browse", activeScholar)).toEqual({ action: "allow" })
    expect(getAuthDecision("/browse", adminUser)).toEqual({ action: "allow" })
  })
})

describe("Auth pages (/login, /register)", () => {
  it("allows unauthenticated users to visit login", () => {
    expect(getAuthDecision("/login", noSession)).toEqual({ action: "allow" })
  })

  it("allows unauthenticated users to visit register", () => {
    expect(getAuthDecision("/register", noSession)).toEqual({ action: "allow" })
  })

  it("redirects authenticated public users away from login", () => {
    expect(getAuthDecision("/login", publicUser)).toEqual({
      action: "redirect",
      to: "/",
    })
  })

  it("redirects authenticated scholars away from login", () => {
    expect(getAuthDecision("/login", activeScholar)).toEqual({
      action: "redirect",
      to: "/scholar",
    })
  })

  it("redirects authenticated admins away from login", () => {
    expect(getAuthDecision("/login", adminUser)).toEqual({
      action: "redirect",
      to: "/admin",
    })
  })
})

describe("Scholar routes (/scholar/...)", () => {
  it("redirects unauthenticated users to /login", () => {
    expect(getAuthDecision("/scholar/submissions", noSession)).toEqual({
      action: "redirect",
      to: "/login",
    })
  })

  it("redirects PUBLIC-role users to /403", () => {
    expect(getAuthDecision("/scholar/submissions", publicUser)).toEqual({
      action: "redirect",
      to: "/403",
    })
  })

  it("redirects inactive scholars to /403", () => {
    // isActive false means admin hasn't activated their account yet
    expect(getAuthDecision("/scholar/submissions", inactiveScholar)).toEqual({
      action: "redirect",
      to: "/403",
    })
  })

  it("allows active scholars", () => {
    expect(getAuthDecision("/scholar/submissions", activeScholar)).toEqual({
      action: "allow",
    })
  })

  it("allows admins to access scholar routes", () => {
    expect(getAuthDecision("/scholar/submissions", adminUser)).toEqual({
      action: "allow",
    })
  })
})

describe("Admin routes (/admin/...)", () => {
  it("redirects unauthenticated users to /login", () => {
    expect(getAuthDecision("/admin/dashboard", noSession)).toEqual({
      action: "redirect",
      to: "/login",
    })
  })

  it("redirects PUBLIC-role users to /403", () => {
    expect(getAuthDecision("/admin/dashboard", publicUser)).toEqual({
      action: "redirect",
      to: "/403",
    })
  })

  it("redirects scholars to /403", () => {
    expect(getAuthDecision("/admin/dashboard", activeScholar)).toEqual({
      action: "redirect",
      to: "/403",
    })
  })

  it("allows admin users", () => {
    expect(getAuthDecision("/admin/dashboard", adminUser)).toEqual({
      action: "allow",
    })
  })
})

describe("API routes (/api/...)", () => {
  it("always allows API routes (let route handlers protect themselves)", () => {
    expect(getAuthDecision("/api/auth/session", noSession)).toEqual({
      action: "allow",
    })
    expect(getAuthDecision("/api/papers", publicUser)).toEqual({
      action: "allow",
    })
  })
})

describe("Public scholar profiles (/scholar/<id>)", () => {
  it("lets anonymous visitors read a scholar profile", () => {
    expect(getAuthDecision("/scholar/clx123abc", null)).toEqual({ action: "allow" })
  })

  it("lets public-role users read a scholar profile", () => {
    expect(getAuthDecision("/scholar/clx123abc", publicUser)).toEqual({ action: "allow" })
  })
})
