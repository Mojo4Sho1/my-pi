export const SPECIALIST_IDS = {
  PLANNER: "planner",
  BUILDER: "builder",
  REVIEWER: "reviewer",
  TESTER: "tester",
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
  SPECIALIST_IDS.TESTER,
  SPECIALIST_IDS.SPEC_WRITER,
  SPECIALIST_IDS.SCHEMA_DESIGNER,
  SPECIALIST_IDS.ROUTING_DESIGNER,
  SPECIALIST_IDS.CRITIC,
  SPECIALIST_IDS.BOUNDARY_AUDITOR,
] as const;

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
