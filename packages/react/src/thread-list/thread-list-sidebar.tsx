"use client";

import type { ThreadMetadata } from "@agent-ui-sdk/core";
import {
  EllipsisVertical,
  MessageSquarePlus,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Star,
  StarOff,
  Trash2,
} from "lucide-react";
import { type KeyboardEvent, useCallback, useMemo, useRef, useState } from "react";
import { cn } from "src/lib/utils";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Input } from "../components/ui/input";
import { ScrollArea } from "../components/ui/scroll-area";
import { useThreadList } from "./thread-list-provider";

// ===== Time grouping =====

interface TimeGroup {
  label: string;
  threads: ThreadMetadata[];
}

function getTimeGroups(threads: ThreadMetadata[]): TimeGroup[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: Record<string, ThreadMetadata[]> = {
    Today: [],
    Yesterday: [],
    "Previous 7 Days": [],
    Older: [],
  };

  for (const thread of threads) {
    const t = thread.updatedAt.getTime();
    if (t >= today.getTime()) {
      groups.Today!.push(thread);
    } else if (t >= yesterday.getTime()) {
      groups.Yesterday!.push(thread);
    } else if (t >= weekAgo.getTime()) {
      groups["Previous 7 Days"]!.push(thread);
    } else {
      groups.Older!.push(thread);
    }
  }

  return ["Today", "Yesterday", "Previous 7 Days", "Older"]
    .filter((label) => groups[label]!.length > 0)
    .map((label) => ({ label, threads: groups[label]! }));
}

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

// ===== ThreadListItem =====

interface ThreadListItemProps {
  thread: ThreadMetadata;
  isActive: boolean;
  onSwitch: () => void;
  onRename: (title: string) => void;
  onFavorite: () => void;
  onUnfavorite: () => void;
  onDelete: () => void;
}

function ThreadListItem({
  thread,
  isActive,
  onSwitch,
  onRename,
  onFavorite,
  onUnfavorite,
  onDelete,
}: ThreadListItemProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleStartRename = useCallback(() => {
    setRenameValue(thread.title ?? "");
    setIsRenaming(true);
    // Focus on next tick after render
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [thread.title]);

  const handleConfirmRename = useCallback(() => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== thread.title) {
      onRename(trimmed);
    }
    setIsRenaming(false);
  }, [renameValue, thread.title, onRename]);

  const handleRenameKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleConfirmRename();
      } else if (e.key === "Escape") {
        setIsRenaming(false);
      }
    },
    [handleConfirmRename],
  );

  return (
    <>
      {/* biome-ignore lint/a11y/useSemanticElements: contains nested interactive elements (DropdownMenu button) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => !isRenaming && onSwitch()}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !isRenaming) onSwitch();
        }}
        className={cn(
          "group relative flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
          "hover:bg-muted/50",
          isActive && "bg-muted",
        )}
      >
        {/* Favorite star */}
        {thread.favorited && <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />}

        {/* Title or rename input */}
        <div className="min-w-0 flex-1">
          {isRenaming ? (
            <Input
              ref={inputRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleConfirmRename}
              onKeyDown={handleRenameKeyDown}
              className="h-6 px-1 py-0 text-sm"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="block truncate">{thread.title || "New Thread"}</span>
          )}
        </div>

        {/* Time + menu */}
        {!isRenaming && (
          <div className="flex shrink-0 items-center gap-1">
            <span className="text-muted-foreground text-xs opacity-0 transition-opacity group-hover:opacity-100">
              {formatRelativeTime(thread.updatedAt)}
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <EllipsisVertical className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={handleStartRename}>
                  <Pencil className="mr-2 size-4" />
                  Rename
                </DropdownMenuItem>
                {thread.favorited ? (
                  <DropdownMenuItem onClick={onUnfavorite}>
                    <StarOff className="mr-2 size-4" />
                    Unfavorite
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={onFavorite}>
                    <Star className="mr-2 size-4" />
                    Favorite
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Thread</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{thread.title || "New Thread"}&quot;? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                onDelete();
                setShowDeleteDialog(false);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ===== ThreadListSidebar =====

export interface ThreadListSidebarProps {
  className?: string;
  /** Default collapsed state. Default: false */
  defaultCollapsed?: boolean;
}

export function ThreadListSidebar({ className, defaultCollapsed = false }: ThreadListSidebarProps) {
  const { threads, activeThreadId, isLoading, actions } = useThreadList();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const timeGroups = useMemo(() => getTimeGroups(threads), [threads]);

  const handleNewThread = useCallback(async () => {
    await actions.createThread();
  }, [actions]);

  if (collapsed) {
    return (
      <div
        className={cn(
          "border-r bg-background flex h-full w-12 flex-col items-center py-2",
          className,
        )}
      >
        <Button variant="ghost" size="icon" className="mb-2" onClick={() => setCollapsed(false)}>
          <PanelLeftOpen className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleNewThread}>
          <MessageSquarePlus className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("border-r bg-background flex h-full w-64 flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <Button variant="ghost" size="sm" className="gap-2" onClick={handleNewThread}>
          <MessageSquarePlus className="size-4" />
          New Thread
        </Button>
        <Button variant="ghost" size="icon" className="size-7" onClick={() => setCollapsed(true)}>
          <PanelLeftClose className="size-4" />
        </Button>
      </div>

      {/* Thread list */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading ? (
            <div className="text-muted-foreground flex items-center justify-center py-8 text-sm">
              Loading...
            </div>
          ) : threads.length === 0 ? (
            <div className="text-muted-foreground flex items-center justify-center py-8 text-sm">
              No threads yet
            </div>
          ) : (
            timeGroups.map((group) => (
              <div key={group.label} className="mb-3">
                <div className="text-muted-foreground mb-1 px-3 text-xs font-medium">
                  {group.label}
                </div>
                {group.threads.map((thread) => (
                  <ThreadListItem
                    key={thread.id}
                    thread={thread}
                    isActive={thread.id === activeThreadId}
                    onSwitch={() => actions.switchThread(thread.id)}
                    onRename={(title) => actions.renameThread(thread.id, title)}
                    onFavorite={() => actions.favoriteThread(thread.id)}
                    onUnfavorite={() => actions.unfavoriteThread(thread.id)}
                    onDelete={() => actions.deleteThread(thread.id)}
                  />
                ))}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
