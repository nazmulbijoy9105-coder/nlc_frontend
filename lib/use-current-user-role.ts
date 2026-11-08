"use client";

import { useSyncExternalStore } from "react";
import { getUser } from "@/lib/auth";

const SERVER_SNAPSHOT = "__NLC_SERVER_SNAPSHOT__";
const ANONYMOUS_SNAPSHOT = "__NLC_ANONYMOUS__";

function subscribeToSession() {
  // The auth store is currently updated by the auth flow and followed by navigation.
  // There is no independent event source to subscribe to yet.
  return () => {};
}

function getClientRoleSnapshot(): string {
  return getUser()?.role ?? ANONYMOUS_SNAPSHOT;
}

function getServerRoleSnapshot(): string {
  return SERVER_SNAPSHOT;
}

/**
 * Reads the cached role without a setState-in-effect hydration bridge.
 * The server snapshot is deliberately distinct so protected pages render a
 * neutral loading state until the browser has read its local session.
 */
export function useCurrentUserRole(): { role: string | null; loaded: boolean } {
  const snapshot = useSyncExternalStore(
    subscribeToSession,
    getClientRoleSnapshot,
    getServerRoleSnapshot,
  );

  return {
    role: snapshot === SERVER_SNAPSHOT || snapshot === ANONYMOUS_SNAPSHOT ? null : snapshot,
    loaded: snapshot !== SERVER_SNAPSHOT,
  };
}
