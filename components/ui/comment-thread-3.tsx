"use client";

import React, { useState, useRef, useMemo } from "react";
import {
  MessageSquare,
  Send,
  Flag,
  Edit2,
  Trash2,
  ExternalLink,
  ImagePlus,
  X,
  Check,
  ChevronDown,
} from "lucide-react";

import { useDevotionalStore, isMyComment } from "../../src/store/useDevotionalStore";
import { useAuthStore } from "../../src/store/useAuthStore";
import { useUIStore } from "../../src/store/useUIStore";
import { Comment } from "../../src/types";
import { RichTextToolbar } from "../../src/components/ui/RichTextToolbar";
import { RichTextRenderer } from "../../src/components/ui/RichTextRenderer";
import { processImageFile } from "../../src/lib/imageUtils";

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
  const { comments, addComment, editComment, removeComment, reportComment } = useDevotionalStore();
  const { user, isAdmin } = useAuthStore();
  const { openAuthGate, openCommentsSheet } = useUIStore();

  const [expanded, setExpanded] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [commentImage, setCommentImage] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [reportSuccessId, setReportSuccessId] = useState<string | null>(null);

  // Edit Comment State
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [isProcessingEditImage, setIsProcessingEditImage] = useState(false);

  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const newCommentInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const devotionalComments = useMemo(() => {
    if (!devotionalId) return [];
    const list = comments.filter((c) => c.devotionalId === devotionalId);
    const seen = new Set<string>();
    return list.filter((c) => {
      if (!c || !c.id || seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  }, [comments, devotionalId]);

  const visibleComments = expanded ? devotionalComments : devotionalComments.slice(0, maxInitial);
  const hasMore = devotionalComments.length > maxInitial;

  const handleDeviceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingImage(true);
      const dataUrl = await processImageFile(file, { maxDimension: 1000, quality: 0.85 });
      setCommentImage(dataUrl);
    } catch (err) {
      console.warn("Error reading device image:", err);
      const reader = new FileReader();
      reader.onload = (event) => {
        setCommentImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeviceEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingEditImage(true);
      const dataUrl = await processImageFile(file, { maxDimension: 1000, quality: 0.85 });
      setEditingImage(dataUrl);
    } catch (err) {
      console.warn("Error reading edit image:", err);
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditingImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsProcessingEditImage(false);
      if (editFileInputRef.current) editFileInputRef.current.value = "";
    }
  };

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!devotionalId) return;
    if (!newCommentText.trim() && !commentImage) return;

    if (user?.isAnonymous) {
      openAuthGate(
        "To participate in fellowship discussion and post spiritual reflections, please link your account."
      );
      return;
    }

    addComment(
      devotionalId,
      user?.uid || "user",
      user?.displayName || "Devoted Disciple",
      newCommentText,
      user?.photoUrl || null,
      commentImage || null
    );
    setNewCommentText("");
    setCommentImage(null);
  };

  const handleStartEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingText(comment.body);
    setEditingImage(comment.imageUrl || null);
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editingText.trim()) return;
    await editComment(
      commentId,
      editingText,
      devotionalId || undefined,
      editingImage
    );
    setEditingCommentId(null);
    setEditingText("");
    setEditingImage(null);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingText("");
    setEditingImage(null);
  };

  const handleReport = (commentId: string) => {
    if (!devotionalId) return;
    reportComment(commentId, user?.uid || "anonymous", devotionalId);
    setReportSuccessId(commentId);
    setTimeout(() => setReportSuccessId(null), 3000);
  };

  const handleOpenAll = () => {
    if (onViewAll) {
      onViewAll();
    } else if (devotionalId) {
      openCommentsSheet(devotionalId);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden text-neutral-900 dark:text-neutral-100">
      {/* Header - Identical to CommentsSheet */}
      <div className="p-4 sm:p-5 border-b border-[#E9ECEF] dark:border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#5E72E4]/10 text-[#5E72E4] flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-[#172B4D] dark:text-white">
              Discipleship Reflections
            </h3>
            <p className="text-xs text-[#525F7F] dark:text-neutral-400">
              {devotionalComments.length}{" "}
              {devotionalComments.length === 1 ? "reflection" : "reflections"} shared
            </p>
          </div>
        </div>

        {/* Action Button: Opens the Popup */}
        <button
          type="button"
          onClick={handleOpenAll}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#5E72E4]/30 bg-[#5E72E4]/10 hover:bg-[#5E72E4]/20 text-[#5E72E4] dark:text-[#889af7] text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          title="Open Full Reflections Popup"
          aria-label="Open Full Reflections Popup"
        >
          <span>More</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Comment List - Identical to CommentsSheet Cards */}
      <div className="p-4 sm:p-5 space-y-3.5">
        {devotionalComments.length === 0 ? (
          <div
            onClick={handleOpenAll}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleOpenAll()}
            className="flex flex-col items-center justify-center text-center py-8 px-4 rounded-xl border border-dashed border-slate-200 dark:border-neutral-800 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition-all cursor-pointer group"
          >
            <MessageSquare className="w-8 h-8 stroke-1 mb-2 opacity-50 text-[#5E72E4] group-hover:scale-110 transition-transform" />
            <p className="text-sm font-semibold text-[#172B4D] dark:text-neutral-200">
              No reflections shared yet
            </p>
            <p className="text-xs text-[#525F7F] dark:text-neutral-400 max-w-xs mt-1">
              Be the first disciple to share how God spoke to you through this scripture.
            </p>
          </div>
        ) : (
          visibleComments.map((comment: Comment, idx: number) => {
            const isAuthor = isMyComment(comment, user);
            const canEdit = isAuthor || isAdmin;
            const isEditingThis = editingCommentId === comment.id;
            const authorName =
              isAuthor && user?.displayName
                ? user.displayName
                : comment.displayName || "Devoted Disciple";
            const authorPhoto =
              isAuthor && user?.photoUrl ? user.photoUrl : comment.photoUrl || null;

            return (
              <div
                key={`comm-${comment.id}-${idx}`}
                className="p-4 rounded-xl bg-[#F7FAFC] dark:bg-neutral-800/60 border border-[#E9ECEF] dark:border-neutral-800 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
              >
                {/* Author row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {authorPhoto ? (
                      <img
                        src={authorPhoto}
                        alt={authorName}
                        className="w-7 h-7 rounded-full object-cover shadow-sm ring-1 ring-neutral-300 dark:ring-neutral-700"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-[#5E72E4] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                        {authorName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs font-bold text-[#172B4D] dark:text-neutral-200">
                      {authorName}
                    </span>
                    {isAuthor && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#5E72E4]/10 text-[#5E72E4] border border-[#5E72E4]/20">
                        You
                      </span>
                    )}
                    <span className="text-[10px] text-[#8898AA]">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                    {comment.updatedAt && (
                      <span className="text-[10px] text-neutral-400 italic">
                        (edited)
                      </span>
                    )}
                  </div>

                  {/* Actions (Edit, Delete, Report) */}
                  <div className="flex items-center gap-1.5">
                    {canEdit && !isEditingThis && (
                      <button
                        type="button"
                        onClick={() => handleStartEdit(comment)}
                        title="Edit your reflection"
                        className="px-2 py-1 rounded-md text-[11px] font-bold text-[#5E72E4] bg-[#5E72E4]/10 hover:bg-[#5E72E4]/20 border border-[#5E72E4]/25 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    )}
                    {canEdit && !isEditingThis && (
                      <button
                        type="button"
                        onClick={() => removeComment(comment.id, devotionalId || undefined)}
                        title="Delete reflection"
                        className="p-1 text-neutral-400 hover:text-rose-500 rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      id={`report-comment-btn-${comment.id}`}
                      onClick={() => handleReport(comment.id)}
                      title="Report reflection"
                      className="p-1 text-neutral-400 hover:text-[#F5365C] rounded-md transition-colors cursor-pointer"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {isEditingThis ? (
                  /* Inline editor when editing */
                  <div className="space-y-2 pl-9">
                    <RichTextToolbar
                      textareaRef={editInputRef}
                      value={editingText}
                      onChange={setEditingText}
                    />
                    <textarea
                      ref={editInputRef}
                      rows={3}
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#5E72E4] bg-white dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white focus:outline-none"
                    />

                    {/* Edit photo */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="file"
                        ref={editFileInputRef}
                        onChange={handleDeviceEditImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      {editingImage ? (
                        <div className="relative inline-block">
                          <img
                            src={editingImage}
                            alt="Reflection attachment preview"
                            className="w-16 h-16 rounded-lg object-cover border border-neutral-300 dark:border-neutral-700"
                          />
                          <button
                            type="button"
                            onClick={() => setEditingImage(null)}
                            title="Remove photo"
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-sm hover:bg-rose-600 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => editFileInputRef.current?.click()}
                          className="px-2.5 py-1 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <ImagePlus className="w-3.5 h-3.5 text-[#5E72E4]" />
                          <span>
                            {isProcessingEditImage ? "Processing..." : "Attach Photo"}
                          </span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-3 py-1 rounded-md text-xs text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(comment.id)}
                        className="px-3 py-1 rounded-md text-xs font-bold bg-[#5E72E4] text-white hover:bg-[#4a5ec4] flex items-center gap-1 shadow-sm cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Comment Body with RichTextRenderer & attached image */
                  <>
                    <div className="text-xs leading-relaxed text-[#525F7F] dark:text-neutral-300 pl-9">
                      <RichTextRenderer content={comment.body} />
                    </div>

                    {comment.imageUrl && (
                      <div className="mt-2.5 pl-9">
                        <img
                          src={comment.imageUrl}
                          alt="Attached reflection photo"
                          className="max-h-56 rounded-lg object-cover border border-neutral-200 dark:border-neutral-700 shadow-xs"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })
        )}

        {/* View All / More trigger button */}
        {hasMore && (
          <button
            type="button"
            onClick={handleOpenAll}
            className="w-full py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-800/80 hover:bg-slate-100 dark:hover:bg-neutral-800 border border-slate-200/80 dark:border-neutral-750 text-xs font-bold text-[#5E72E4] dark:text-[#889af7] flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
          >
            <span>View all {devotionalComments.length} reflections in full popup</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Reflection Input Form - Identical to CommentsSheet */}
      <form
        onSubmit={handlePost}
        className="p-4 sm:p-5 border-t border-[#E9ECEF] dark:border-neutral-800 bg-[#F7FAFC] dark:bg-neutral-900/80 space-y-3"
      >
        <RichTextToolbar
          textareaRef={newCommentInputRef}
          value={newCommentText}
          onChange={setNewCommentText}
        />

        <div className="relative">
          <textarea
            ref={newCommentInputRef}
            rows={2}
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Share your spiritual reflection, prayer insight, or revelation..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#CAD1D7] dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5E72E4]/40 resize-none transition-all placeholder:text-neutral-400"
          />
        </div>

        {/* Device Image Attachment Preview */}
        {commentImage && (
          <div className="relative inline-block mt-1">
            <img
              src={commentImage}
              alt="Device upload preview"
              className="w-20 h-20 rounded-xl object-cover border border-[#CAD1D7] dark:border-neutral-700 shadow-xs"
            />
            <button
              type="button"
              onClick={() => setCommentImage(null)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs hover:bg-rose-600 cursor-pointer"
              title="Remove image"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Action Row */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleDeviceImageUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-300 border border-[#CAD1D7] dark:border-neutral-700 rounded-lg hover:bg-white dark:hover:bg-neutral-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ImagePlus className="w-3.5 h-3.5 text-[#5E72E4]" />
            <span>{isProcessingImage ? "Processing..." : "Attach Photo"}</span>
          </button>

          <button
            type="submit"
            disabled={!newCommentText.trim() && !commentImage}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#5E72E4] hover:bg-[#4a5ec4] disabled:opacity-50 text-white flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Share Reflection</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default CommentThread3;
