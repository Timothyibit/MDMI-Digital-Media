import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  MessageSquare,
  Send,
  Flag,
  ShieldAlert,
  User,
  Edit2,
  Check,
  RotateCcw,
  ImagePlus,
  Trash2,
} from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useDevotionalStore, isMyComment } from '../../store/useDevotionalStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Comment } from '../../types';
import { RichTextToolbar } from '../ui/RichTextToolbar';
import { RichTextRenderer } from '../ui/RichTextRenderer';
import { processImageFile } from '../../lib/imageUtils';

export const CommentsSheet: React.FC = () => {
  const { commentsSheetOpen, commentsDevotionalId, closeCommentsSheet, openAuthGate } = useUIStore();
  const { comments, addComment, editComment, removeComment, reportComment } = useDevotionalStore();
  const { user, isAdmin } = useAuthStore();

  const [newCommentText, setNewCommentText] = useState('');
  const [commentImage, setCommentImage] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [reportSuccessId, setReportSuccessId] = useState<string | null>(null);

  // Edit Comment State
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [isProcessingEditImage, setIsProcessingEditImage] = useState(false);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const newCommentInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const devotionalComments = useMemo(() => {
    if (!commentsDevotionalId) return [];
    const list = comments.filter((c) => c.devotionalId === commentsDevotionalId);
    const seen = new Set<string>();
    return list.filter((c) => {
      if (!c || !c.id || seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  }, [comments, commentsDevotionalId]);

  const handleDeviceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingImage(true);
      const dataUrl = await processImageFile(file, { maxDimension: 1000, quality: 0.85 });
      setCommentImage(dataUrl);
    } catch (err) {
      console.warn('Error reading device image:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        setCommentImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
      console.warn('Error reading edit image:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditingImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsProcessingEditImage(false);
      if (editFileInputRef.current) editFileInputRef.current.value = '';
    }
  };

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentsDevotionalId) return;
    if (!newCommentText.trim() && !commentImage) return;

    if (user?.isAnonymous) {
      openAuthGate(
        'To participate in fellowship discussion and post spiritual reflections, please link your account.'
      );
      return;
    }

    addComment(
      commentsDevotionalId,
      user?.uid || 'user',
      user?.displayName || 'Devoted Disciple',
      newCommentText,
      user?.photoUrl || null,
      commentImage || null
    );
    setNewCommentText('');
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
      commentsDevotionalId || undefined,
      editingImage
    );
    setEditingCommentId(null);
    setEditingText('');
    setEditingImage(null);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingText('');
    setEditingImage(null);
  };

  const handleReport = (commentId: string) => {
    reportComment(commentId, user?.uid || 'anonymous', commentsDevotionalId || undefined);
    setReportSuccessId(commentId);
    setTimeout(() => setReportSuccessId(null), 3000);
  };

  return (
    <AnimatePresence>
      {commentsSheetOpen && commentsDevotionalId && (
        <div
          id="comments-sheet-overlay"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
          onClick={closeCommentsSheet}
        >
        <motion.div
          id="comments-bottom-sheet"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-xl bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col max-h-[88vh] h-[700px] overflow-hidden text-neutral-900 dark:text-neutral-100"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#E9ECEF] dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#5E72E4]/10 text-[#5E72E4] flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#172B4D] dark:text-white">
                  Discipleship Reflections
                </h3>
                <p className="text-xs text-[#525F7F] dark:text-neutral-400">
                  {devotionalComments.length}{' '}
                  {devotionalComments.length === 1 ? 'reflection' : 'reflections'} shared
                </p>
              </div>
            </div>
            <button
              id="close-comments-btn"
              onClick={closeCommentsSheet}
              aria-label="Close comments"
              className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Comment List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {devotionalComments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 text-neutral-400">
                <MessageSquare className="w-10 h-10 stroke-1 mb-2 opacity-60 text-[#5E72E4]" />
                <p className="text-sm font-semibold text-[#172B4D] dark:text-neutral-300">
                  No reflections shared yet
                </p>
                <p className="text-xs text-[#525F7F] dark:text-neutral-400 max-w-xs mt-1">
                  Be the first disciple to share how God spoke to you through this scripture.
                </p>
              </div>
            ) : (
              devotionalComments.map((comment: Comment, idx: number) => {
                const isAuthor = isMyComment(comment, user);
                const canEdit = isAuthor || isAdmin;
                const isEditingThis = editingCommentId === comment.id;
                const authorName = isAuthor && user?.displayName ? user.displayName : (comment.displayName || 'Devoted Disciple');
                const authorPhoto = isAuthor && user?.photoUrl ? user.photoUrl : (comment.photoUrl || null);

                return (
                  <div
                    key={`comm-${comment.id}-${idx}`}
                    className="p-4 rounded-xl bg-[#F7FAFC] dark:bg-neutral-800/60 border border-[#E9ECEF] dark:border-neutral-800 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                  >
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

                      {/* Action buttons (Edit, Delete & Report) */}
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
                            onClick={() => removeComment(comment.id, commentsDevotionalId || undefined)}
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
                      /* Inline Comment Editor with Rich Text Formatting & Photo management */
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

                        {/* Edit attached photo */}
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
                              <span>{isProcessingEditImage ? 'Processing...' : 'Attach Photo'}</span>
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
                            <Check className="w-3 h-3" />
                            <span>Save Changes</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Render Formatted Reflection */
                      <div className="pl-9 text-xs">
                        <RichTextRenderer content={comment.body} />
                      </div>
                    )}

                    {comment.imageUrl && (
                      <div className="mt-2.5 pl-9">
                        <div className="max-w-xs rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800">
                          <img
                            src={comment.imageUrl}
                            alt="Attached reflection photo"
                            className="w-full h-auto max-h-48 object-cover"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    )}

                    {reportSuccessId === comment.id && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 text-[10px] text-[#FB6340] flex items-center gap-1 pl-9 font-medium"
                      >
                        <ShieldAlert className="w-3 h-3 shrink-0" />
                        <span>Thank you. This reflection has been queued for moderation.</span>
                      </motion.div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Input Bar with Formatting Tools */}
          <div className="p-3.5 sm:p-4 border-t border-[#E9ECEF] dark:border-neutral-800 bg-white dark:bg-neutral-900">
            {user?.isAnonymous ? (
              <div
                onClick={() =>
                  openAuthGate(
                    'Link your account with your email to post reflections and encourage the brethren.'
                  )
                }
                className="p-3 rounded-lg bg-[#5E72E4]/10 border border-[#5E72E4]/20 flex items-center justify-between cursor-pointer hover:bg-[#5E72E4]/15 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#5E72E4]" />
                  <span className="text-xs font-medium text-[#172B4D] dark:text-blue-200">
                    Sign in to join the fellowship conversation
                  </span>
                </div>
                <span className="text-xs font-bold text-[#5E72E4] underline">
                  Connect Free
                </span>
              </div>
            ) : (
              <form onSubmit={handlePost} className="space-y-2">
                <div className="flex items-center gap-2 px-0.5">
                  {user?.photoUrl ? (
                    <img
                      src={user.photoUrl}
                      alt={user.displayName || 'You'}
                      className="w-5 h-5 rounded-full object-cover ring-1 ring-neutral-300 dark:ring-neutral-700 shrink-0"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-[#5E72E4] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                      {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'D'}
                    </div>
                  )}
                  <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 truncate">
                    Sharing reflection as <strong className="text-neutral-900 dark:text-neutral-200">{user?.displayName || 'Devoted Disciple'}</strong>
                  </span>
                </div>

                <RichTextToolbar
                  textareaRef={newCommentInputRef}
                  value={newCommentText}
                  onChange={setNewCommentText}
                />

                {commentImage && (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                    <img src={commentImage} alt="Attachment" className="w-10 h-10 rounded-lg object-cover" />
                    <span className="text-[11px] text-neutral-600 dark:text-neutral-300 flex-1 truncate">
                      Photo attached from device
                    </span>
                    <button
                      type="button"
                      onClick={() => setCommentImage(null)}
                      className="p-1 rounded-full text-neutral-400 hover:text-rose-500 cursor-pointer"
                      title="Remove attachment"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex items-end gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleDeviceImageUpload}
                    accept="image/*"
                    className="hidden"
                    aria-label="Upload device photo"
                  />
                  <textarea
                    ref={newCommentInputRef}
                    id="comment-input"
                    rows={2}
                    placeholder="Share a reflection, prayer request, or scripture insight..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-[#CAD1D7] dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-[#172B4D] dark:text-white focus:outline-none focus:border-[#5E72E4]"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload image from device"
                    aria-label="Upload image from device"
                    className="p-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-750 text-neutral-600 dark:text-neutral-300 transition-colors shrink-0 cursor-pointer"
                  >
                    <ImagePlus className="w-4 h-4" />
                  </button>
                  <button
                    id="post-comment-btn"
                    type="submit"
                    disabled={!newCommentText.trim() && !commentImage}
                    aria-label="Post reflection"
                    className="p-2.5 rounded-lg bg-[#5E72E4] text-white hover:bg-[#4a5ec4] active:scale-95 disabled:opacity-40 shadow-[0_4px_10px_rgba(94,114,228,0.35)] transition-all shrink-0 cursor-pointer"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};
