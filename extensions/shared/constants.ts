export const SPECIALIST_IDS = {
  PLANNER: "planner",
  BUILDER: "builder",
  REVIEWER: "reviewer",
  TESTER: "tester",
  BUILDER_TEST: "builder-test",
  SPEC_WRITER: "spec-writer",
  SCHEMA_DESIGNER: "schema-designer",
  ROUTING_DESIGNER: "routing-designer",
  CRITIC: "critic",
  BOUNDARY_AUDITOR: "boundary-auditor",
} as const;

export const ALL_SPECIALIST_IDS = [
  SPECIALIST_IDS.PLANNER,
  SPECIALIST_IDS.BUILDER,
  SPECIALIST_IDS.REVIEWER,
  SPECIALIST_IDS.BUILDER_TEST,
  SPECIALIST_IDS.SPEC_WRITER,
  SPECIALIST_IDS.SCHEMA_DESIGNER,
  SPECIALIST_IDS.ROUTING_DESIGNER,
  SPECIALIST_IDS.CRITIC,
  SPECIALIST_IDS.BOUNDARY_AUDITOR,
] as const;

export const SPECIALIST_ALIASES = {
  [SPECIALIST_IDS.TESTER]: {
    canonicalTarget: SPECIALIST_IDS.BUILDER_TEST,
    lifecycleState: "deprecated",
    reason: "tester is the legacy runtime id for the canonical builder-test specialist.",
    cleanupCondition:
      "Advance after team definitions, tests, and documentation prefer builder-test and no known runtime references require tester.",
  },
} as const;

export const ALL_SPECIALIST_INPUT_IDS = [
  ...ALL_SPECIALIST_IDS,
  SPECIALIST_IDS.TESTER,
] as const;

export type CanonicalSpecialistId = typeof ALL_SPECIALIST_IDS[number];
export type SpecialistInputId = typeof ALL_SPECIALIST_INPUT_IDS[number];

export function resolveSpecialistId(id: string): CanonicalSpecialistId | undefined {
  if ((ALL_SPECIALIST_IDS as readonly string[]).includes(id)) {
    return id as CanonicalSpecialistId;
  }

  const alias = SPECIALIST_ALIASES[id as keyof typeof SPECIALIST_ALIASES];
  return alias?.canonicalTarget;
}

export function resolveSpecialistAgentId(id: string): string | undefined {
  const prefix = "specialist_";
  const shortId = id.startsWith(prefix) ? id.slice(prefix.length) : id;
  const resolved = resolveSpecialistId(shortId);
  return resolved ? `${prefix}${resolved}` : undefined;
}

export function getSpecialistAliasMetadata(id: string) {
  return SPECIALIST_ALIASES[id as keyof typeof SPECIALIST_ALIASES];
}

export const HOOK_EVENTS = {
  SESSION_START: "onSessionStart",
  SESSION_END: "onSessionEnd",
  TEAM_START: "onTeamStart",
  BEFORE_STATE_TRANSITION: "beforeStateTransition",
  AFTER_STATE_TRANSITION: "afterStateTransition",
  BEFORE_DELEGATION: "beforeDelegation",
  AFTER_DELEGATION: "afterDelegation",
  BEFORE_SUBPROCESS_SPAWN: "beforeSubprocessSpawn",
  AFTER_SUBPROCESS_EXIT: "afterSubprocessExit",
  ADEQUACY_FAILURE: "onAdequacyFailure",
  POLICY_VIOLATION: "onPolicyViolation",
  ARTIFACT_WRITTEN: "onArtifactWritten",
  COMMAND_INVOKED: "onCommandInvoked",
} as const;

export const DASHBOARD_WIDGET_KEY = "my-pi-dashboard";
