import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquare, Send, Flag, ShieldAlert, CheckCircle2, User } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useDevotionalStore } from '../../store/useDevotionalStore';
import { useAuthStore } from '../../store/useAuthStore';

export const CommentsSheet: React.FC = () => {
  const { commentsSheetOpen, commentsDevotionalId, closeCommentsSheet, openAuthGate } = useUIStore();
  const { comments, addComment, reportComment } = useDevotionalStore();
  const { user } = useAuthStore();

  const [newCommentText, setNewCommentText] = useState('');
  const [reportSuccessId, setReportSuccessId] = useState<string | null>(null);

  if (!commentsSheetOpen || !commentsDevotionalId) return null;

  const devotionalComments = comments.filter((c) => c.devotionalId === commentsDevotionalId);

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    // Check non-anonymous constraint from §5
    if (user?.isAnonymous) {
      openAuthGate('To participate in the community discussion and post spiritual reflections, please link your account.');
      return;
    }

    addComment(
      commentsDevotionalId,
      user?.uid || 'user',
      user?.displayName || 'Devoted Disciple',
      newCommentText
    );
    setNewCommentText('');
  };

  const handleReport = (commentId: string) => {
    reportComment(commentId, user?.uid || 'anonymous');
    setReportSuccessId(commentId);
    setTimeout(() => setReportSuccessId(null), 3000);
  };

  return (
    <AnimatePresence>
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
          className="w-full sm:max-w-lg bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col max-h-[85vh] h-[650px] overflow-hidden text-neutral-900 dark:text-neutral-100"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Discipleship Reflections</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {devotionalComments.length} {devotionalComments.length === 1 ? 'reflection' : 'reflections'} shared
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
                <MessageSquare className="w-10 h-10 stroke-1 mb-2 opacity-60" />
                <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
                  No reflections shared yet
                </p>
                <p className="text-xs text-neutral-400 max-w-xs mt-1">
                  Be the first disciple to share how God spoke to you through this scripture.
                </p>
              </div>
            ) : (
              devotionalComments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800 transition-all"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold">
                        {comment.displayName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                        {comment.displayName}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Report action */}
                    <button
                      id={`report-comment-btn-${comment.id}`}
                      onClick={() => handleReport(comment.id)}
                      title="Report abusive or inappropriate comment"
                      className="p-1 text-neutral-400 hover:text-rose-500 rounded-md transition-colors"
                    >
                      <Flag className="w-3 h-3" />
                    </button>
                  </div>

                  <p className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300 pl-8">
                    {comment.body}
                  </p>

                  {reportSuccessId === comment.id && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 pl-8"
                    >
                      <ShieldAlert className="w-3 h-3 shrink-0" />
                      <span>Thank you. This reflection has been queued for moderation.</span>
                    </motion.div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer Input Bar */}
          <div className="p-3.5 sm:p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/90">
            {user?.isAnonymous ? (
              <div
                onClick={() =>
                  openAuthGate('Link your account with your email to post reflections and encourage the brethren.')
                }
                className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/50 flex items-center justify-between cursor-pointer hover:bg-blue-100/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-medium text-blue-900 dark:text-blue-200">
                    Sign in to join the conversation
                  </span>
                </div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 underline">
                  Connect Free
                </span>
              </div>
            ) : (
              <form onSubmit={handlePost} className="flex items-center gap-2">
                <input
                  id="comment-input"
                  type="text"
                  placeholder="Share a reflection or prayer request..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  id="post-comment-btn"
                  type="submit"
                  disabled={!newCommentText.trim()}
                  aria-label="Post reflection"
                  className="p-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 active:scale-95 disabled:opacity-40 shadow-sm transition-all"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
