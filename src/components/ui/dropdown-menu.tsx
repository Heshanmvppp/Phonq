"use client";

import * as React from "react";

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

export function DropdownMenu({ trigger, children, align = "end", className, onOpenChange }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const itemRefs = React.useRef<HTMLButtonElement[]>([]);
  const onOpenChangeRef = React.useRef(onOpenChange);

  React.useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  function setOpenState(next: boolean) {
    setOpen(next);
    onOpenChangeRef.current?.(next);
  }

  function toggle() {
    setOpenState(!open);
  }

  React.useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpenState(false);
      }
    };

    const trigger = triggerRef.current;

    document.addEventListener("mousedown", onPointerDown);
    const frame = requestAnimationFrame(() => {
      itemRefs.current[0]?.focus();
    });

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("mousedown", onPointerDown);
      trigger?.focus();
    };
  }, [open]);

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

  const close = React.useCallback(() => setOpenState(false), []);

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
      {open && (
        <MenuContext.Provider value={contextValue}>
          <div
            className={cn(
              "absolute z-50 mt-2 min-w-48 overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-xl animate-fade-up",
              align === "end" ? "right-0" : "left-0",
              className,
            )}
          >
            {children}
          </div>
        </MenuContext.Provider>
      )}
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
