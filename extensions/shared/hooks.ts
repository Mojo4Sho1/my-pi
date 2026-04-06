/**
 * Hook substrate for lifecycle events (Stage 5a.1b, Decision #38).
 *
 * Three hook classes (Phase 1 implements policy and observer):
 * - Policy hooks: authoritative gates (allow/deny with structured reasons)
 * - Observer hooks: non-authoritative listeners (logging, metrics, projections)
 * - Review hooks: deferred to Phase 2
 *
 * Governance: hooks do not reroute, do not gain broad context, and failures
 * are isolated — a broken hook never crashes execution.
 */

import type {
  HookEvent,
  HookFailure,
  PolicyResult,
  HookEventName,
} from "./types.js";

export type PolicyHook = <T>(event: HookEvent<T>) => PolicyResult;
export type ObserverHook = <T>(event: HookEvent<T>) => void;
export type HookInstaller = (registry: HookRegistry) => void;

export interface PolicyDispatchResult {
  allowed: boolean;
  reason?: string;
  annotations?: Record<string, unknown>;
  failures: HookFailure[];
}

export interface ObserverDispatchResult {
  failures: HookFailure[];
}

interface RegisteredHook<T> {
  id: string;
  hook: T;
}

const GLOBAL_HOOK_INSTALLERS = new Set<HookInstaller>();

function createSessionId(): string {
  return `hook_session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createHookId(kind: "policy" | "observer", eventName: HookEventName): string {
  return `${kind}_${eventName}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export class HookRegistry {
  private readonly policyHooks = new Map<HookEventName, RegisteredHook<PolicyHook>[]>();
  private readonly observerHooks = new Map<HookEventName, RegisteredHook<ObserverHook>[]>();
  private readonly failures: HookFailure[] = [];
  private readonly sessionId: string;
  private readonly disabled: boolean;

  constructor(options?: { sessionId?: string; disabled?: boolean }) {
    this.sessionId = options?.sessionId ?? createSessionId();
    this.disabled = options?.disabled ?? false;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  /** Register a policy hook for an event. Returns unregister function. */
  registerPolicy(eventName: HookEventName, hook: PolicyHook): () => void {
    if (this.disabled) {
      return () => {};
    }

    const registration: RegisteredHook<PolicyHook> = {
      id: createHookId("policy", eventName),
      hook,
    };
    const hooks = this.policyHooks.get(eventName) ?? [];
    hooks.push(registration);
    this.policyHooks.set(eventName, hooks);

    return () => {
      const current = this.policyHooks.get(eventName) ?? [];
      this.policyHooks.set(
        eventName,
        current.filter((entry) => entry.id !== registration.id)
      );
    };
  }

  /** Register an observer hook for an event. Returns unregister function. */
  registerObserver(eventName: HookEventName, hook: ObserverHook): () => void {
    if (this.disabled) {
      return () => {};
    }

    const registration: RegisteredHook<ObserverHook> = {
      id: createHookId("observer", eventName),
      hook,
    };
    const hooks = this.observerHooks.get(eventName) ?? [];
    hooks.push(registration);
    this.observerHooks.set(eventName, hooks);

    return () => {
      const current = this.observerHooks.get(eventName) ?? [];
      this.observerHooks.set(
        eventName,
        current.filter((entry) => entry.id !== registration.id)
      );
    };
  }

  /**
   * Dispatch a policy event. Runs all registered policy hooks.
   * Returns { allowed: true } if all hooks allow, or the first denial.
   * Hook failures are captured as HookFailure records, not thrown.
   */
  dispatchPolicy<T>(eventName: HookEventName, payload: T): PolicyDispatchResult {
    if (this.disabled) {
      return { allowed: true, failures: [] };
    }

    const failures: HookFailure[] = [];
    let denial: Exclude<PolicyResult, { allowed: true }> | undefined;
    const event = this.createEvent(eventName, payload);

    for (const registration of this.policyHooks.get(eventName) ?? []) {
      try {
        const result = registration.hook(event);
        if (!result.allowed && !denial) {
          denial = result;
        }
      } catch (error) {
        failures.push(this.recordFailure(registration.id, eventName, error));
      }
    }

    if (denial) {
      return {
        allowed: false,
        reason: denial.reason,
        annotations: denial.annotations,
        failures,
      };
    }

    return {
      allowed: true,
      failures,
    };
  }

  /**
   * Dispatch an observer event. Runs all registered observer hooks.
   * Hook failures are captured as HookFailure records, not thrown.
   */
  dispatchObserver<T>(eventName: HookEventName, payload: T): ObserverDispatchResult {
    if (this.disabled) {
      return { failures: [] };
    }

    const failures: HookFailure[] = [];
    const event = this.createEvent(eventName, payload);

    for (const registration of this.observerHooks.get(eventName) ?? []) {
      try {
        registration.hook(event);
      } catch (error) {
        failures.push(this.recordFailure(registration.id, eventName, error));
      }
    }

    return { failures };
  }

  /** Get all hook failures recorded since last clear */
  getFailures(): HookFailure[] {
    return [...this.failures];
  }

  /** Clear recorded failures */
  clearFailures(): void {
    this.failures.length = 0;
  }

  private createEvent<T>(eventName: HookEventName, payload: T): HookEvent<T> {
    return {
      eventName,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      payload,
    };
  }

  private recordFailure(hookId: string, eventName: HookEventName, error: unknown): HookFailure {
    const failure: HookFailure = {
      hookId,
      eventName,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    };
    this.failures.push(failure);
    return failure;
  }
}

export function registerHookInstaller(installer: HookInstaller): () => void {
  GLOBAL_HOOK_INSTALLERS.add(installer);
  return () => {
    GLOBAL_HOOK_INSTALLERS.delete(installer);
  };
}

export function createHookRegistry(): HookRegistry {
  const registry = new HookRegistry();
  for (const installer of GLOBAL_HOOK_INSTALLERS) {
    installer(registry);
  }
  return registry;
}

/** No-op registry for tests and environments without registered hooks. */
export const NULL_REGISTRY = new HookRegistry({
  sessionId: "hook_session_null",
  disabled: true,
});
