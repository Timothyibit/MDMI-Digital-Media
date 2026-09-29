"use client";

import React, { useState, useMemo } from "react";
import {
  GitCommitVertical,
  MessageSquare,
  Share2,
  UserPlus,
  ChevronDown,
  Edit2,
  Check,
  Trash2,
  ExternalLink,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDevotionalStore, isMyComment } from "../../src/store/useDevotionalStore";
import { useAuthStore } from "../../src/store/useAuthStore";
import { useUIStore } from "../../src/store/useUIStore";

type CommentEntry = {
  kind: "comment";
  id: string;
  name: string;
  avatar: string;
  time: string;
  text: string;
  image?: string | null;
  isSelf?: boolean;
};

type EventEntry = {
  kind: "event";
  id: string;
  icon: typeof Share2;
  time: string;
  text: string;
};

type Entry = CommentEntry | EventEntry;

const INITIAL: Entry[] = [];

export interface CommentThread3Props {
  devotionalId?: string;
  onViewAll?: () => void;
  maxInitial?: number;
}

export function CommentThread3({
  devotionalId,
  onViewAll,
  maxInitial = 2,
}: CommentThread3Props = {}) {
  const { comments, addComment, editComment, removeComment } = useDevotionalStore();
  const { user, isAdmin } = useAuthStore();
  const { openAuthGate, openCommentsSheet } = useUIStore();

  const [expanded, setExpanded] = useState(false);
  const [localEntries, setEntries] = useState<Entry[]>(INITIAL);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const devotionalComments = useMemo(() => {
    if (!devotionalId) return null;
    return comments.filter((c) => c.devotionalId === devotionalId);
  }, [comments, devotionalId]);

  const entries: Entry[] = useMemo(() => {
    if (!devotionalId) return localEntries;

    if (!devotionalComments || devotionalComments.length === 0) {
      return [];
    }

    // Earliest ones first (sorted by createdAt ascending)
    const sorted = [...devotionalComments].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    return sorted.map((c) => {
      const isSelf = isMyComment(c, user);
      const name = isSelf && user?.displayName ? user.displayName : (c.displayName || "Devoted Disciple");
      const avatar = isSelf && user?.photoUrl ? user.photoUrl : (c.photoUrl || "");

      return {
        kind: "comment" as const,
        id: c.id,
        name,
        avatar,
        time: new Date(c.createdAt).toLocaleDateString([], {
          month: "short",
          day: "numeric",
        }),
        text: c.body,
        image: c.imageUrl,
        isSelf,
      };
    });
  }, [devotionalId, devotionalComments, localEntries, user]);

  // Earliest visible slice vs all
  const visibleEntries = expanded ? entries : entries.slice(0, maxInitial);
  const hasMore = entries.length > maxInitial;

  const send = () => {
    const text = draft.trim();
    if (!text) return;

    if (devotionalId) {
      if (user?.isAnonymous) {
        openAuthGate(
          "To participate in the community discussion and post spiritual reflections, please link your account."
        );
        return;
      }
      addComment(
        devotionalId,
        user?.uid || "user",
        user?.displayName || "Devoted Disciple",
        text,
        user?.photoUrl || null
      );
    } else {
      setEntries((prev) => [
        ...prev,
        {
          kind: "comment",
          id: `me-${prev.length}`,
          name: user?.displayName || "You",
          avatar: user?.photoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80",
          time: "now",
          text,
          isSelf: true,
        },
      ]);
    }
    setDraft("");
  };

  const handleOpenAll = () => {
    if (onViewAll) {
      onViewAll();
    } else if (devotionalId) {
      openCommentsSheet(devotionalId);
    } else {
      setExpanded(true);
    }
  };

  return (
    <Card className="border border-border/80 bg-card text-card-foreground shadow-sm rounded-xl overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex items-center justify-between">
          <CardTitle
            onClick={handleOpenAll}
            className="flex items-center gap-2 text-base font-bold cursor-pointer hover:text-primary transition-colors"
          >
            <MessageSquare className="size-4 text-primary" />
            <span>Reflections &amp; Community Activity</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            {entries.length > 0 && (
              <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                {entries.length} {entries.length === 1 ? "entry" : "entries"}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenAll}
              className="text-xs font-bold text-primary hover:text-primary/90 h-7 px-2.5 flex items-center gap-1 cursor-pointer"
            >
              <span>Reflections Sheet</span>
              <ExternalLink className="size-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3.5 pt-4">
        {entries.length === 0 ? (
          <div
            onClick={handleOpenAll}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleOpenAll()}
            className="py-6 px-4 flex flex-col items-center justify-center text-center text-muted-foreground hover:bg-muted/30 rounded-xl transition-all cursor-pointer group"
          >
            <MessageSquare className="size-7 opacity-40 mb-1.5 text-primary group-hover:scale-110 transition-transform" />
            <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
              No reflections shared yet
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs">
              Be the first disciple to share a spiritual insight or prayer from this scripture.
            </p>
            <span className="mt-2 text-xs font-bold text-primary underline underline-offset-2">
              Share First Reflection &amp; View Comments
            </span>
          </div>
        ) : (
          visibleEntries.map((entry, idx) =>
            entry.kind === "comment" ? (
              <div key={`entry-${entry.id}-${idx}`} className="flex gap-3 items-start">
                <Avatar className="size-8 ring-1 ring-border">
                  <AvatarImage src={entry.avatar} alt={entry.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {entry.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-1 flex-col gap-0.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-foreground">
                        {entry.name}
                      </span>
                      {entry.isSelf && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-primary/10 text-primary border border-primary/20">
                          You
                        </span>
                      )}
                      {(entry.isSelf || isAdmin) && editingId !== entry.id && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(entry.id);
                            setEditingText(entry.text);
                          }}
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold text-primary hover:bg-primary/10 transition-colors flex items-center gap-0.5 cursor-pointer ml-1"
                          title="Edit your reflection"
                        >
                          <Edit2 className="size-2.5" />
                          <span>Edit</span>
                        </button>
                      )}
                      {(entry.isSelf || isAdmin) && editingId !== entry.id && (
                        <button
                          type="button"
                          onClick={() => {
                            if (devotionalId) {
                              removeComment(entry.id, devotionalId);
                            } else {
                              setEntries((prev) => prev.filter((e) => e.id !== entry.id));
                            }
                          }}
                          className="p-0.5 rounded text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                          title="Delete reflection"
                        >
                          <Trash2 className="size-2.5" />
                        </button>
                      )}
                    </div>
                    <span className="text-muted-foreground text-[11px] shrink-0">
                      {entry.time}
                    </span>
                  </div>

                  {editingId === entry.id ? (
                    <div className="mt-1 space-y-2">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        rows={2}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-primary bg-background text-xs text-foreground focus:outline-none"
                      />
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingId(null);
                            setEditingText("");
                          }}
                          className="h-7 px-2 text-xs cursor-pointer"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          disabled={!editingText.trim() || isSavingEdit}
                          onClick={async () => {
                            setIsSavingEdit(true);
                            if (devotionalId) {
                              await editComment(entry.id, editingText.trim(), devotionalId);
                            } else {
                              setEntries((prev) =>
                                prev.map((e) => (e.id === entry.id ? { ...e, text: editingText.trim() } : e))
                              );
                            }
                            setIsSavingEdit(false);
                            setEditingId(null);
                            setEditingText("");
                          }}
                          className="h-7 px-3 text-xs font-bold gap-1 cursor-pointer"
                        >
                          <Check className="size-3" />
                          <span>{isSavingEdit ? "Saving..." : "Save"}</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-sans">
                      {entry.text}
                    </p>
                  )}
                  {entry.image && (
                    <div className="mt-2 max-w-xs rounded-xl overflow-hidden border border-border bg-muted/40">
                      <img
                        src={entry.image}
                        alt="Attached reflection photo"
                        className="w-full h-auto max-h-44 object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div
                key={`entry-${entry.id}-${idx}`}
                className="text-muted-foreground flex items-center gap-3 text-xs py-0.5"
              >
                <div className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full">
                  <entry.icon className="size-3.5" />
                </div>
                <span className="flex-1 font-medium">{entry.text}</span>
                <span className="text-[11px] opacity-75">{entry.time}</span>
              </div>
            )
          )
        )}

        {/* Access all reflections toggle button */}
        {hasMore && !expanded && (
          <div className="pt-2 flex items-center justify-between border-t border-dashed border-border/60">
            <span className="text-xs text-muted-foreground">
              Showing earliest reflections
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenAll}
              className="text-xs font-bold text-primary hover:text-primary/80 h-8 px-2.5 flex items-center gap-1 cursor-pointer"
            >
              <span>View all {entries.length} reflections</span>
              <ChevronDown className="size-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-3 border-t border-border/40 bg-muted/20">
        <div className="flex w-full gap-2 items-center">
          {user && !user.isAnonymous && (
            <Avatar className="size-8 ring-1 ring-border shrink-0">
              <AvatarImage src={user.photoUrl || undefined} alt={user.displayName || "You"} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {user.displayName
                  ? user.displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                  : "U"}
              </AvatarFallback>
            </Avatar>
          )}
          <Input
            placeholder="Share your spiritual reflection..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            className="text-xs sm:text-sm h-9 bg-background flex-1"
          />
          <Button
            onClick={send}
            disabled={!draft.trim()}
            size="sm"
            className="h-9 px-4 font-bold text-xs"
          >
            Send
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export default CommentThread3;
