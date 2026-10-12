import React, { useState } from 'react';
import {
  HeartIcon,
  MessageCircleIcon,
  MoreHorizontalIcon,
  ShareIcon,
  Bookmark,
  Volume2,
  Clock,
  Edit3,
  Send,
  Trash2,
  BookOpen,
  Copy,
  Check,
  ShieldCheck,
  Calendar,
  Sparkles,
  Play,
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { PlayPauseIcon } from '@/components/ui/animated-state-icons';
import { Devotional } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';
import { useDevotionalStore } from '../../store/useDevotionalStore';
import { useBookmarkStore } from '../../store/useBookmarkStore';
import { useUIStore } from '../../store/useUIStore';
import { cn } from '@/lib/utils';

export interface ProductCardHorizontalProps {
  devotional: Devotional;
  onPress: () => void;
  onBookmark?: (id: string) => void;
  isBookmarked?: boolean;
  onAudio?: (devotional: Devotional) => void;
  onEdit?: (devotional: Devotional) => void;
  onDelete?: (id: string) => void;
  onPublish?: (id: string) => void;
  isAdmin?: boolean;
  className?: string;
}

export const ProductCardHorizontal: React.FC<ProductCardHorizontalProps> = ({
  devotional,
  onPress,
  onBookmark,
  isBookmarked: externalIsBookmarked,
  onAudio,
  onEdit,
  onDelete,
  onPublish,
  isAdmin = false,
  className = '',
}) => {
  const { user } = useAuthStore();
  const { likedIds, likeDevotional, comments } = useDevotionalStore();
  const { isBookmarked: storeIsBookmarked, toggleBookmark } = useBookmarkStore();
  const {
    playDevotionalAudio,
    openCommentsSheet,
    openVerseShare,
    audioState,
  } = useUIStore();

  const [copied, setCopied] = useState(false);

  const isBookmarked =
    externalIsBookmarked !== undefined
      ? externalIsBookmarked
      : storeIsBookmarked(devotional.id);

  const isLiked = likedIds.includes(devotional.id);
  const likeCount = Math.max(0, devotional.likeCount || 0) + (isLiked && !devotional.likeCount ? 1 : 0);

  // Count comments for this devotional
  const devotionalCommentsCount = comments.filter(
    (c) => c.devotionalId === devotional.id && !c.reported
  ).length;

  const isCurrentlyPlayingAudio =
    audioState.isPlaying && audioState.devotionalId === devotional.id;

  const estimatedMinutes = Math.max(
    2,
    Math.ceil(
      ((devotional.body || '').split(/\s+/).length +
        (devotional.scriptureText || '').split(/\s+/).length) /
        160
    )
  );

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await likeDevotional(devotional.id, user?.uid || 'guest');
    } catch (err) {
      console.warn('Like error:', err);
    }
  };

  const handleToggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBookmark) {
      onBookmark(devotional.id);
    } else {
      toggleBookmark(devotional.id);
    }
  };

  const handlePlayAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAudio) {
      onAudio(devotional);
    } else {
      playDevotionalAudio(devotional);
    }
  };

  const handleOpenComments = (e: React.MouseEvent) => {
    e.stopPropagation();
    openCommentsSheet(devotional.id);
  };

  const handleShareCard = (e: React.MouseEvent) => {
    e.stopPropagation();
    openVerseShare({
      scripture: devotional.scripture,
      scriptureText: devotional.scriptureText || devotional.body.slice(0, 160),
      title: devotional.title,
      author: devotional.authorName || "The Master's Discipleship Ministries",
    });
  };

  const handleCopyScripture = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `"${devotional.scriptureText || devotional.keyThought || devotional.title}" — ${devotional.scripture}\n\nFrom: ${devotional.title} | MDMI Devotionals`;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const tags = devotional.tags && devotional.tags.length > 0 ? devotional.tags : ['Renewal', 'Grace'];
  const authorPhoto =
    devotional.authorPhotoUrl ||
    'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=120&q=80';

  const coverPhoto =
    devotional.imageUrl ||
    'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1000&q=80';

  return (
    <Card
      className={cn(
        'w-full gap-0 py-0 shadow-sm hover:shadow-md transition-all duration-300 rounded-[24px] overflow-hidden',
        // High-contrast gradient foundation: brighter colors for dark text in light mode, darker colors for white text in dark mode
        'bg-gradient-to-br from-[#FFFFFF] via-[#F8FAFC] to-[#F1F5F9] dark:from-[#080E1B] dark:via-[#101C33] dark:to-[#04070D] border-slate-200/90 dark:border-neutral-800 text-neutral-950 dark:text-white',
        className
      )}
    >
      {/* 1. Header with Author Profile, Schedule/Reading Time and Dropdown Actions */}
      <CardHeader className="flex flex-row items-center justify-between p-3.5 sm:p-4 pb-3">
        <Item className="w-full gap-3 p-0 items-center">
          <ItemMedia className="shrink-0">
            <div className="relative">
              <Image
                alt={devotional.authorName || 'Author'}
                className="h-9 w-9 rounded-full object-cover ring-2 ring-emerald-500/35 bg-neutral-200 dark:bg-neutral-800 shadow-xs"
                height={36}
                src={authorPhoto}
                width={36}
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-neutral-900 rounded-full" />
            </div>
          </ItemMedia>

          <ItemContent className="gap-0.5 min-w-0">
            <ItemTitle className="text-xs sm:text-sm font-bold text-neutral-950 dark:text-white flex items-center gap-1.5 truncate">
              <span className="truncate">{devotional.authorName || "The Master's Discipleship Ministries"}</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 inline" />
            </ItemTitle>

            <ItemDescription className="text-[11px] text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5 flex-wrap">
              <span>{devotional.scheduledDate || 'Daily Scripture'}</span>
              <span>•</span>
              <span className="font-semibold text-amber-700 dark:text-amber-400">{estimatedMinutes} min read</span>
              {devotional.publishedAt ? (
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">• Live</span>
              ) : (
                <span className="text-amber-700 dark:text-amber-400 font-bold">• Draft</span>
              )}
            </ItemDescription>
          </ItemContent>

          <ItemActions className="-me-1 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="More options"
                  className="h-8 w-8 text-neutral-500 hover:text-neutral-950 dark:hover:text-white rounded-full"
                >
                  <MoreHorizontalIcon className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={handlePlayAudio} className="gap-2 cursor-pointer">
                  <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Listen Spoken Word</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleToggleBookmark} className="gap-2 cursor-pointer">
                  <Bookmark className={cn('w-4 h-4', isBookmarked ? 'fill-amber-500 text-amber-500' : 'text-neutral-500')} />
                  <span>{isBookmarked ? 'Remove Bookmark' : 'Save to Vault'}</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleShareCard} className="gap-2 cursor-pointer">
                  <ShareIcon className="w-4 h-4 text-[#5E72E4]" />
                  <span>Share Scripture Card</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleCopyScripture} className="gap-2 cursor-pointer">
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-neutral-500" />}
                  <span>{copied ? 'Copied Scripture!' : 'Copy Scripture'}</span>
                </DropdownMenuItem>

                {(isAdmin || onEdit) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit?.(devotional);
                      }}
                      className="gap-2 cursor-pointer text-[#5E72E4]"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit Devotional & Cover</span>
                    </DropdownMenuItem>
                  </>
                )}

                {isAdmin && onPublish && !devotional.publishedAt && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onPublish(devotional.id);
                    }}
                    className="gap-2 cursor-pointer text-emerald-600"
                  >
                    <Send className="w-4 h-4" />
                    <span>Publish to Live Feed</span>
                  </DropdownMenuItem>
                )}

                {isAdmin && onDelete && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(devotional.id);
                    }}
                    className="gap-2 cursor-pointer text-rose-600 focus:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Devotional</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </ItemActions>
        </Item>
      </CardHeader>

      {/* 2. Visual Media: Aspect 14/9 with Scripture Badge & Audio Quick-Trigger */}
      <CardContent className="p-0">
        <div
          role="button"
          tabIndex={0}
          onClick={onPress}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onPress();
            }
          }}
          className="relative aspect-14/9 sm:aspect-16/9 w-full border-y border-slate-200/90 dark:border-neutral-800/90 overflow-hidden group cursor-pointer bg-neutral-900"
        >
          <img
            alt={devotional.title}
            className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
            src={coverPhoto}
            loading="lazy"
          />

          {/* Ambient Scrim for contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/35 pointer-events-none" />

          {/* Top-Left Scripture Anchor Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/25 text-white text-[11px] font-extrabold tracking-wide shadow-md">
            <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate max-w-[180px] sm:max-w-none">{devotional.scripture}</span>
          </div>

          {/* Top-Right Quick-Play Floating Audio Button */}
          <button
            type="button"
            onClick={handlePlayAudio}
            title={isCurrentlyPlayingAudio ? 'Playing Spoken Word' : 'Listen Spoken Word'}
            aria-label="Listen audio"
            className={cn(
              'absolute top-3 right-3 p-2.5 rounded-full shadow-xl transition-all active:scale-90 flex items-center justify-center cursor-pointer',
              isCurrentlyPlayingAudio
                ? 'bg-emerald-500 text-white ring-4 ring-emerald-400/40 animate-pulse'
                : 'bg-black/65 hover:bg-emerald-600 text-white backdrop-blur-md border border-white/20'
            )}
          >
            <PlayPauseIcon size={18} color="#FFFFFF" active={isCurrentlyPlayingAudio} />
          </button>

          {/* Bottom Overlay Pill / Tags */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/30 shadow-xs">
              {tags[0] || 'Devotional'}
            </span>

            <span className="text-[10px] font-semibold text-white/90 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded border border-white/10 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>{estimatedMinutes} min read</span>
            </span>
          </div>
        </div>

        {/* 3. Devotional Headline, Key Excerpt, and Hashtags */}
        <div
          role="button"
          tabIndex={0}
          onClick={onPress}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onPress();
            }
          }}
          className="px-4 sm:px-5 py-3.5 space-y-1.5 cursor-pointer text-left"
        >
          <h2 className="font-bold text-base sm:text-lg text-neutral-950 dark:text-white leading-snug group-hover:text-[#65A30D] dark:group-hover:text-[#84CC16] transition-colors line-clamp-2">
            {devotional.title}
          </h2>

          <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 font-serif-reading italic line-clamp-2 leading-relaxed font-medium">
            “{devotional.keyThought || devotional.scriptureText || devotional.body.slice(0, 160)}”
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-bold text-[#65A30D] dark:text-[#84CC16] hover:underline"
              >
                #{tag.replace(/\s+/g, '')}
              </span>
            ))}
          </div>
        </div>
      </CardContent>

      {/* 4. Social / Engagement Action Footer (card-06 spec with real interactivity) */}
      <CardFooter className="flex items-center justify-between border-t border-slate-200/90 dark:border-neutral-800/90 px-2 sm:px-3 py-1.5 flex-wrap gap-1">
        {/* Like Action */}
        <Button
          onClick={handleToggleLike}
          variant="ghost"
          size="sm"
          className={cn(
            'shrink-0 h-9 px-2.5 sm:px-3 rounded-xl gap-1.5 transition-colors cursor-pointer',
            isLiked
              ? 'text-rose-600 dark:text-rose-400 font-bold'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-rose-600'
          )}
        >
          <HeartIcon
            className={cn('w-4 h-4 transition-transform active:scale-125', isLiked ? 'fill-rose-500 text-rose-500' : '')}
          />
          <span className="text-xs font-semibold tabular-nums">{likeCount}</span>
          <span className="hidden sm:inline text-xs font-medium">{likeCount === 1 ? 'Like' : 'Likes'}</span>
        </Button>

        {/* Comment Action */}
        <Button
          onClick={handleOpenComments}
          variant="ghost"
          size="sm"
          className="shrink-0 h-9 px-2.5 sm:px-3 rounded-xl gap-1.5 text-neutral-600 dark:text-neutral-400 hover:text-[#5E72E4] cursor-pointer"
        >
          <MessageCircleIcon className="w-4 h-4" />
          <span className="text-xs font-semibold tabular-nums">{devotionalCommentsCount}</span>
          <span className="hidden sm:inline text-xs font-medium">Comments</span>
        </Button>

        {/* Audio Action */}
        <Button
          onClick={handlePlayAudio}
          variant="ghost"
          size="sm"
          className={cn(
            'shrink-0 h-9 px-2.5 sm:px-3 rounded-xl gap-1.5 cursor-pointer',
            isCurrentlyPlayingAudio
              ? 'text-emerald-600 font-bold bg-emerald-500/10'
              : 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-600'
          )}
        >
          <Volume2 className="w-4 h-4" />
          <span className="hidden sm:inline text-xs font-medium">Audio</span>
        </Button>

        {/* Bookmark Action */}
        <Button
          onClick={handleToggleBookmark}
          variant="ghost"
          size="sm"
          className={cn(
            'shrink-0 h-9 px-2.5 rounded-xl gap-1.5 cursor-pointer',
            isBookmarked
              ? 'text-amber-500 font-bold'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-amber-500'
          )}
        >
          <Bookmark className={cn('w-4 h-4', isBookmarked ? 'fill-amber-500 text-amber-500' : '')} />
          <span className="hidden md:inline text-xs font-medium">{isBookmarked ? 'Saved' : 'Save'}</span>
        </Button>

        {/* Share Action */}
        <Button
          onClick={handleShareCard}
          variant="ghost"
          size="sm"
          className="shrink-0 h-9 px-2.5 sm:px-3 rounded-xl gap-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white cursor-pointer"
        >
          <ShareIcon className="w-4 h-4" />
          <span className="hidden sm:inline text-xs font-medium">Share</span>
        </Button>

        {/* Admin Quick Action (if onEdit / isAdmin) */}
        {(isAdmin || onEdit) && (
          <div className="flex items-center gap-1 ml-auto">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(devotional);
                }}
                className="h-8 px-2.5 text-xs font-bold text-[#5E72E4] border-[#5E72E4]/40 hover:bg-[#5E72E4]/10 rounded-xl"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1" />
                <span>Edit</span>
              </Button>
            )}

            {isAdmin && onPublish && !devotional.publishedAt && (
              <Button
                variant="default"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onPublish(devotional.id);
                }}
                className="h-8 px-2.5 text-xs font-bold bg-[#65A30D] hover:bg-[#548a0a] text-white rounded-xl"
              >
                <Send className="w-3.5 h-3.5 mr-1" />
                <span>Publish</span>
              </Button>
            )}

            {isAdmin && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(devotional.id);
                }}
                className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 rounded-xl"
                title="Delete devotional"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default ProductCardHorizontal;
