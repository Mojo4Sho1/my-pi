/**
 * Hook substrate tests (Stage 5a.1b).
 *
 * Validates hook registration, dispatch, policy decisions,
 * and error isolation behavior.
 */

import { describe, it, expect } from "vitest";
import { createHookRegistry, NULL_REGISTRY, registerHookInstaller } from "../extensions/shared/hooks.js";

describe("HookRegistry registration", () => {
  it("registers and fires policy hooks", () => {
    const registry = createHookRegistry();
    let fired = false;

    registry.registerPolicy("beforeDelegation", (event) => {
      fired = event.payload === "payload";
      return { allowed: true };
    });

    registry.dispatchPolicy("beforeDelegation", "payload");
    expect(fired).toBe(true);
  });

  it("registers and fires observer hooks", () => {
    const registry = createHookRegistry();
    let fired = false;

    registry.registerObserver("afterDelegation", (event) => {
      fired = event.payload === "payload";
    });

    registry.dispatchObserver("afterDelegation", "payload");
    expect(fired).toBe(true);
  });

  it("unregister removes hooks", () => {
    const registry = createHookRegistry();
    let count = 0;

    const unregister = registry.registerObserver("afterDelegation", () => {
      count++;
    });

    registry.dispatchObserver("afterDelegation", {});
    unregister();
    registry.dispatchObserver("afterDelegation", {});

    expect(count).toBe(1);
  });

  it("fires multiple hooks on the same event", () => {
    const registry = createHookRegistry();
    const calls: string[] = [];

    registry.registerObserver("afterDelegation", () => {
      calls.push("first");
    });
    registry.registerObserver("afterDelegation", () => {
      calls.push("second");
    });

    registry.dispatchObserver("afterDelegation", {});
    expect(calls).toEqual(["first", "second"]);
  });
});

describe("HookRegistry policy dispatch", () => {
  it("allows when no hooks are registered", () => {
    const registry = createHookRegistry();
    expect(registry.dispatchPolicy("beforeDelegation", {})).toEqual({
      allowed: true,
      failures: [],
    });
  });

  it("allows when a single hook allows", () => {
    const registry = createHookRegistry();
    registry.registerPolicy("beforeDelegation", () => ({ allowed: true }));

    expect(registry.dispatchPolicy("beforeDelegation", {}).allowed).toBe(true);
  });

  it("denies when a single hook denies", () => {
    const registry = createHookRegistry();
    registry.registerPolicy("beforeDelegation", () => ({
      allowed: false,
      reason: "blocked",
    }));

    expect(registry.dispatchPolicy("beforeDelegation", {})).toEqual({
      allowed: false,
      reason: "blocked",
      annotations: undefined,
      failures: [],
    });
  });

  it("allows when multiple hooks all allow", () => {
    const registry = createHookRegistry();
    registry.registerPolicy("beforeDelegation", () => ({ allowed: true }));
    registry.registerPolicy("beforeDelegation", () => ({ allowed: true }));

    expect(registry.dispatchPolicy("beforeDelegation", {}).allowed).toBe(true);
  });

  it("returns the first denial when multiple hooks disagree", () => {
    const registry = createHookRegistry();
    registry.registerPolicy("beforeDelegation", () => ({ allowed: true }));
    registry.registerPolicy("beforeDelegation", () => ({
      allowed: false,
      reason: "first deny",
      annotations: { source: "policy-1" },
    }));
    registry.registerPolicy("beforeDelegation", () => ({
      allowed: false,
      reason: "second deny",
    }));

    expect(registry.dispatchPolicy("beforeDelegation", {})).toEqual({
      allowed: false,
      reason: "first deny",
      annotations: { source: "policy-1" },
      failures: [],
    });
  });
});

describe("HookRegistry observer dispatch", () => {
  it("passes the correct payload to observers", () => {
    const registry = createHookRegistry();
    let payload: unknown;

    registry.registerObserver("afterDelegation", (event) => {
      payload = event.payload;
    });

    registry.dispatchObserver("afterDelegation", { ok: true });
    expect(payload).toEqual({ ok: true });
  });

  it("supports observable side effects across multiple observers", () => {
    const registry = createHookRegistry();
    const seen: string[] = [];

    registry.registerObserver("afterDelegation", () => {
      seen.push("a");
    });
    registry.registerObserver("afterDelegation", () => {
      seen.push("b");
    });

    registry.dispatchObserver("afterDelegation", {});
    expect(seen).toEqual(["a", "b"]);
  });
});

describe("HookRegistry error isolation", () => {
  it("captures policy hook failures and continues dispatch", () => {
    const registry = createHookRegistry();
    let allowedHookRan = false;

    registry.registerPolicy("beforeDelegation", () => {
      throw new Error("policy exploded");
    });
    registry.registerPolicy("beforeDelegation", () => {
      allowedHookRan = true;
      return { allowed: true };
    });

    const result = registry.dispatchPolicy("beforeDelegation", {});

    expect(result.allowed).toBe(true);
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0].error).toContain("policy exploded");
    expect(allowedHookRan).toBe(true);
    expect(registry.getFailures()).toHaveLength(1);
  });

  it("captures observer hook failures and continues dispatch", () => {
    const registry = createHookRegistry();
    let otherObserverRan = false;

    registry.registerObserver("afterDelegation", () => {
      throw new Error("observer exploded");
    });
    registry.registerObserver("afterDelegation", () => {
      otherObserverRan = true;
    });

    const result = registry.dispatchObserver("afterDelegation", {});

    expect(result.failures).toHaveLength(1);
    expect(result.failures[0].error).toContain("observer exploded");
    expect(otherObserverRan).toBe(true);
  });

  it("clearFailures resets accumulated failures", () => {
    const registry = createHookRegistry();
    registry.registerObserver("afterDelegation", () => {
      throw new Error("boom");
    });

    registry.dispatchObserver("afterDelegation", {});
    expect(registry.getFailures()).toHaveLength(1);

    registry.clearFailures();
    expect(registry.getFailures()).toEqual([]);
  });
});

describe("NULL_REGISTRY", () => {
  it("returns allow/empty results without throwing", () => {
    expect(NULL_REGISTRY.dispatchPolicy("beforeDelegation", {})).toEqual({
      allowed: true,
      failures: [],
    });
    expect(NULL_REGISTRY.dispatchObserver("afterDelegation", {})).toEqual({
      failures: [],
    });
    expect(NULL_REGISTRY.getFailures()).toEqual([]);
  });
});

describe("hook installers", () => {
  it("applies installers to newly created registries", () => {
    const seen: string[] = [];
    const unregister = registerHookInstaller((registry) => {
      registry.registerObserver("afterDelegation", () => {
        seen.push("installed");
      });
    });

    const registry = createHookRegistry();
    registry.dispatchObserver("afterDelegation", {});
    unregister();

    expect(seen).toEqual(["installed"]);
  });

  it("unregister removes the installer for future registries", () => {
    let count = 0;
    const unregister = registerHookInstaller((registry) => {
      registry.registerObserver("afterDelegation", () => {
        count++;
      });
    });

    unregister();

    const registry = createHookRegistry();
    registry.dispatchObserver("afterDelegation", {});
    expect(count).toBe(0);
  });

  it("applies multiple installers in registration order", () => {
    const order: string[] = [];
    const unregisterA = registerHookInstaller((registry) => {
      order.push("install-a");
      registry.registerObserver("afterDelegation", () => {
        order.push("observer-a");
      });
    });
    const unregisterB = registerHookInstaller((registry) => {
      order.push("install-b");
      registry.registerObserver("afterDelegation", () => {
        order.push("observer-b");
      });
    });

    const registry = createHookRegistry();
    registry.dispatchObserver("afterDelegation", {});
    unregisterA();
    unregisterB();

    expect(order).toEqual(["install-a", "install-b", "observer-a", "observer-b"]);
  });
});
