import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDebounce } from "./useDebounce.js";
import { useLocalStorage } from "./useLocalStorage.js";

// renderHook runs a hook inside a tiny test component, so a hook can be
// tested on its own: result.current is what it returned on the last render

describe("useDebounce", () => {
  it("only passes on the value after it stops changing", () => {
    // Fake timers: the test moves the clock itself, instead of waiting
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 400), {
      initialProps: { value: "d" },
    });

    rerender({ value: "du" });
    act(() => vi.advanceTimersByTime(300));
    rerender({ value: "dune" }); // a key press before the 400ms were up
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe("d"); // still the first value

    act(() => vi.advanceTimersByTime(100)); // 400ms since the last change
    expect(result.current).toBe("dune"); // "du" was skipped completely
  });
});

describe("useLocalStorage", () => {
  const KEY = "test.key";

  it("starts from the fallback, and saves changes", () => {
    const { result } = renderHook(() => useLocalStorage(KEY, 0));
    expect(result.current[0]).toBe(0);

    act(() => result.current[1](5));
    expect(result.current[0]).toBe(5);
    expect(localStorage.getItem(KEY)).toBe("5");
  });

  it("starts from what's stored", () => {
    localStorage.setItem(KEY, JSON.stringify(["saved"]));
    const { result } = renderHook(() => useLocalStorage(KEY, []));
    expect(result.current[0]).toEqual(["saved"]);
  });

  it("falls back when stored data is broken or rejected", () => {
    const fallback = [];
    const onlyArrays = (value) => {
      if (!Array.isArray(value)) throw new Error("not a list");
      return value;
    };

    localStorage.setItem(KEY, "{broken");
    expect(renderHook(() => useLocalStorage(KEY, fallback)).result.current[0]).toBe(fallback);

    localStorage.setItem(KEY, '{"a":1}');
    expect(renderHook(() => useLocalStorage(KEY, fallback, onlyArrays)).result.current[0]).toBe(fallback);
  });

  it("picks up changes made in another tab", () => {
    const { result } = renderHook(() => useLocalStorage(KEY, 0));

    // What the browser does when another tab saves
    act(() => {
      localStorage.setItem(KEY, "42");
      window.dispatchEvent(new StorageEvent("storage", { key: KEY, storageArea: localStorage }));
    });

    expect(result.current[0]).toBe(42);
  });
});
