"use client";

import * as React from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

interface MenuContextValue {
  registerItem: (element: HTMLButtonElement) => void;
  unregisterItem: (element: HTMLButtonElement) => void;
  moveFocus: (direction: 1 | -1) => void;
  moveFocusTo: (index: number) => void;
  close: () => void;
}

const MenuContext = React.createContext<MenuContextValue | null>(null);

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "end";
  className?: string;
  onOpenChange?: (open: boolean) => void;
}

const MENU_GAP = 8;
const EDGE_MARGIN = 8;

export function useDropdownMenu() {
  return React.useContext(MenuContext);
}

export function DropdownMenu({ trigger, children, align = "end", className, onOpenChange }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const [closing, setClosing] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [position, setPosition] = React.useState<{ top: number; left: number } | null>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const itemRefs = React.useRef<HTMLButtonElement[]>([]);
  const onOpenChangeRef = React.useRef(onOpenChange);
  const openRef = React.useRef(false);
  const isClosingRef = React.useRef(false);
  const closeTimerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  React.useEffect(() => {
    openRef.current = open;
  }, [open]);

  React.useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  const setOpenState = React.useCallback((next: boolean) => {
    if (next) {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      isClosingRef.current = false;
      setOpen(true);
      setMounted(true);
      setClosing(false);
      onOpenChangeRef.current?.(true);
    } else {
      if (!openRef.current || isClosingRef.current) return;
      isClosingRef.current = true;
      setClosing(true);
      onOpenChangeRef.current?.(false);
      closeTimerRef.current = window.setTimeout(() => {
        closeTimerRef.current = null;
        isClosingRef.current = false;
        setOpen(false);
        setMounted(false);
        setClosing(false);
      }, 150);
    }
  }, []);

  const toggle = React.useCallback(() => {
    if (open) {
      setOpenState(false);
    } else {
      setOpenState(true);
    }
  }, [open, setOpenState]);

  const place = React.useCallback(() => {
    const triggerEl = triggerRef.current;
    if (!triggerEl) return;
    const rect = triggerEl.getBoundingClientRect();
    const menuEl = menuRef.current;
    const menuWidth = menuEl?.offsetWidth ?? 0;
    const menuHeight = menuEl?.offsetHeight ?? 0;
    let left = align === "end" ? rect.right - menuWidth : rect.left;
    left = Math.max(EDGE_MARGIN, Math.min(left, window.innerWidth - menuWidth - EDGE_MARGIN));
    let top = rect.bottom + MENU_GAP;
    if (top + menuHeight > window.innerHeight - EDGE_MARGIN && rect.top - MENU_GAP - menuHeight >= EDGE_MARGIN) {
      top = rect.top - MENU_GAP - menuHeight;
    } else {
      top = Math.min(top, Math.max(EDGE_MARGIN, window.innerHeight - menuHeight - EDGE_MARGIN));
    }
    setPosition({ top, left });
  }, [align]);

  React.useLayoutEffect(() => {
    if (!mounted || closing) return;
    place();
    const frame = requestAnimationFrame(() => itemRefs.current[0]?.focus());
    const menuEl = menuRef.current;
    const observer = menuEl ? new ResizeObserver(() => place()) : null;
    if (menuEl && observer) observer.observe(menuEl);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [mounted, closing, place]);

  React.useEffect(() => {
    if (!open) return;

    const triggerEl = triggerRef.current;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpenState(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      triggerEl?.focus();
    };
  }, [open, setOpenState]);

  const registerItem = React.useCallback((element: HTMLButtonElement) => {
    itemRefs.current.push(element);
  }, []);

  const unregisterItem = React.useCallback((element: HTMLButtonElement) => {
    itemRefs.current = itemRefs.current.filter((el) => el !== element);
  }, []);

  const moveFocus = React.useCallback((direction: 1 | -1) => {
    const items = itemRefs.current;
    if (items.length === 0) return;
    const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
    const nextIndex = (currentIndex + direction + items.length) % items.length;
    items[nextIndex]?.focus();
  }, []);

  const moveFocusTo = React.useCallback((index: number) => {
    const items = itemRefs.current;
    items[index < 0 ? items.length - 1 : index]?.focus();
  }, []);

  const close = React.useCallback(() => setOpenState(false), [setOpenState]);

  const contextValue = React.useMemo<MenuContextValue>(
    () => ({ registerItem, unregisterItem, moveFocus, moveFocusTo, close }),
    [registerItem, unregisterItem, moveFocus, moveFocusTo, close],
  );

  function handleTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggle();
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) setOpenState(true);
    }
  }

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="menu"
        aria-expanded={open}
        className="cursor-pointer appearance-none rounded-md border-0 bg-transparent p-0 font-inherit text-inherit outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {trigger}
      </button>
      {mounted && typeof document !== "undefined"
        ? createPortal(
            <MenuContext.Provider value={contextValue}>
              <div
                ref={menuRef}
                className={cn(
                  "fixed z-[100] min-w-48 max-w-[calc(100vw-1rem)] overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-xl",
                  closing ? "animate-fade-up-out" : "animate-fade-up",
                  className,
                )}
                style={{
                  top: position?.top ?? 0,
                  left: position?.left ?? 0,
                  visibility: position ? "visible" : "hidden",
                }}
              >
                {children}
              </div>
            </MenuContext.Provider>,
            document.body,
          )
        : null}
    </div>
  );
}

export interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  destructive?: boolean;
}

export function DropdownMenuItem({ className, icon, destructive, children, onClick, ...props }: DropdownMenuItemProps) {
  const menu = React.useContext(MenuContext);
  const ref = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!menu || !ref.current) return;
    const element = ref.current;
    menu.registerItem(element);
    return () => menu.unregisterItem(element);
  }, [menu]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (!menu) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      menu.moveFocus(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      menu.moveFocus(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      menu.moveFocusTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      menu.moveFocusTo(-1);
    } else if (event.key === "Escape") {
      event.preventDefault();
      menu.close();
    }
  }

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm outline-none transition-colors hover:bg-muted focus-visible:bg-muted",
        destructive ? "text-destructive hover:bg-destructive/10 focus-visible:bg-destructive/10" : "text-foreground",
        className,
      )}
      onClick={(event) => {
        menu?.close();
        onClick?.(event);
      }}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {icon && <span className="shrink-0 text-muted-foreground [&>svg]:size-4">{icon}</span>}
      <span className="truncate">{children}</span>
    </button>
  );
}

export function DropdownMenuLabel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("px-2.5 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground", className)}>
      {children}
    </div>
  );
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div className={cn("my-1 h-px bg-border", className)} />;
}
