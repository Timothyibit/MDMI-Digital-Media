"use client";

import React, { useState, useMemo } from "react";
import {
  GitCommitVertical,
  MessageSquare,
  Share2,
  UserPlus,
  ChevronDown,
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
import { useDevotionalStore } from "../../src/store/useDevotionalStore";
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
  const { comments, addComment } = useDevotionalStore();
  const { user } = useAuthStore();
  const { openAuthGate, openCommentsSheet } = useUIStore();

  const [expanded, setExpanded] = useState(false);
  const [localEntries, setEntries] = useState<Entry[]>(INITIAL);
  const [draft, setDraft] = useState("");

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
      const isSelf = !!(user?.uid && c.uid === user.uid);
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
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <MessageSquare className="size-4 text-primary" />
            <span>Reflections &amp; Community Activity</span>
          </CardTitle>
          {entries.length > 0 && (
            <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
              {entries.length} {entries.length === 1 ? "entry" : "entries"}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3.5 pt-4">
        {entries.length === 0 ? (
          <div className="py-6 flex flex-col items-center justify-center text-center text-muted-foreground">
            <MessageSquare className="size-7 opacity-40 mb-1.5 text-primary" />
            <p className="text-xs font-semibold text-foreground">No reflections shared yet</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Be the first disciple to share a spiritual insight or prayer from this scripture.
            </p>
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
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-foreground">
                        {entry.name}
                      </span>
                      {entry.isSelf && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-primary/10 text-primary border border-primary/20">
                          You
                        </span>
                      )}
                    </div>
                    <span className="text-muted-foreground text-[11px]">
                      {entry.time}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-sans">
                    {entry.text}
                  </p>
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
          <Input
            placeholder="Share your spiritual reflection..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            className="text-xs sm:text-sm h-9 bg-background"
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
