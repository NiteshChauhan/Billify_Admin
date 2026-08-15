import { nextTick, onBeforeUnmount, watch } from "vue";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const getFocusable = (root) =>
  Array.from(root?.querySelectorAll?.(FOCUSABLE_SELECTOR) || []).filter((el) => {
    const style = window.getComputedStyle(el);
    return style.visibility !== "hidden" && style.display !== "none";
  });

export function useFocusTrap(openRef, rootRef, options = {}) {
  let previousFocus = null;

  const focusInitial = async () => {
    await nextTick();
    const root = rootRef.value;
    if (!root) return;
    const target =
      (options.initialFocus?.value || options.initialFocus) ||
      root.querySelector("[data-autofocus]") ||
      getFocusable(root)[0];
    target?.focus?.();
  };

  const handleKeydown = (event) => {
    if (!openRef.value || !rootRef.value) return;
    if (event.key === "Escape" && options.closeOnEscape !== false) {
      event.preventDefault();
      options.onEscape?.();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = getFocusable(rootRef.value);
    if (!focusable.length) {
      event.preventDefault();
      rootRef.value.focus?.();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  watch(openRef, async (open) => {
    if (open) {
      previousFocus = document.activeElement;
      document.addEventListener("keydown", handleKeydown);
      await focusInitial();
      return;
    }
    document.removeEventListener("keydown", handleKeydown);
    if (options.restoreFocus !== false && previousFocus?.focus) {
      await nextTick();
      previousFocus.focus();
    }
  });

  onBeforeUnmount(() => {
    document.removeEventListener("keydown", handleKeydown);
  });

  return { focusInitial };
}
