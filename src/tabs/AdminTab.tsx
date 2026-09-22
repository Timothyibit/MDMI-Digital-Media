import React, { useState } from 'react';
import {
  ShieldAlert,
  BarChart3,
  PlusCircle,
  FileText,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Eye,
  Heart,
  Users,
  Send,
  Flag,
  Sparkles,
  ArrowRight,
  Edit3,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useDevotionalStore } from '../store/useDevotionalStore';
import { Devotional } from '../types';

export const AdminTab: React.FC = () => {
  const { user, isAdmin, toggleAdminRole } = useAuthStore();
  const {
    devotionals,
    comments,
    createDevotional,
    deleteDevotional,
    publishDevotional,
    approveComment,
    removeComment,
  } = useDevotionalStore();

  const [activeSection, setActiveSection] = useState<'metrics' | 'create' | 'moderate' | 'manage'>('metrics');

  // Form State
  const [title, setTitle] = useState('');
  const [scripture, setScripture] = useState('');
  const [scriptureText, setScriptureText] = useState('');
  const [keyThought, setKeyThought] = useState('');
  const [body, setBody] = useState('');
  const [prayerPrompt, setPrayerPrompt] = useState('');
  const [authorName, setAuthorName] = useState(user?.displayName || "The Master's Discipleship Ministries");
  const [authorRole, setAuthorRole] = useState('Senior Ministry Overseer');
  const [audioUrl, setAudioUrl] = useState('https://actions.google.com/sounds/v1/water/rain_heavy.ogg');
  const [tagInput, setTagInput] = useState('Discipleship, Prayer, Consecration');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  if (!isAdmin) {
    return (
      <div className="py-20 px-4 text-center max-w-md mx-auto">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/20 text-amber-500 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white font-display-scripture">
          Ministry Admin Access Required
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
          The Admin Console is restricted to ministry leadership for authoring daily devotionals and moderating community reflections.
        </p>
        <button
          id="grant-admin-permission-btn"
          onClick={toggleAdminRole}
          className="mt-6 py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all active:scale-95"
        >
          Enable Overseer Privileges (Demo)
        </button>
      </div>
    );
  }

  // Calculate Metrics
  const totalViews = devotionals.reduce((sum, d) => sum + (d.viewCount || 0), 0);
  const totalLikes = devotionals.reduce((sum, d) => sum + (d.likeCount || 0), 0);
  const publishedCount = devotionals.filter((d) => d.publishedAt !== null).length;
  const draftCount = devotionals.length - publishedCount;
  const reportedComments = comments.filter((c) => c.reported);

  const handleSaveDevotional = (isDraft: boolean) => {
    if (!title.trim() || !scripture.trim() || !body.trim()) {
      setStatusNotice('Title, scripture, and body are required fields.');
      return;
    }

    const tags = tagInput.split(',').map((t) => t.trim()).filter(Boolean);

    createDevotional({
      authorId: user?.uid || 'admin_mdmi',
      title: title.trim(),
      scripture: scripture.trim(),
      scriptureText: scriptureText.trim() || scripture.trim(),
      keyThought: keyThought.trim() || title.trim(),
      body: body.trim(),
      prayerPrompt: prayerPrompt.trim() || 'Lord Jesus, conform my heart to Your likeness.',
      authorName: authorName.trim(),
      authorRole: authorRole.trim(),
      audioUrl: audioUrl.trim() || null,
      audioDurationSeconds: 195,
      publishedAt: isDraft ? null : new Date().toISOString(),
      tags: tags.length > 0 ? tags : ['Discipleship'],
    });

    setTitle('');
    setScripture('');
    setScriptureText('');
    setKeyThought('');
    setBody('');
    setPrayerPrompt('');
    setStatusNotice(isDraft ? 'Devotional saved as draft.' : 'Devotional published immediately to feed!');
    setTimeout(() => setStatusNotice(null), 3000);
    setActiveSection('manage');
  };

  return (
    <div className="space-y-6 pb-28 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-600 text-white font-display-scripture">
              MDMI Overseer
            </span>
            <h1 className="text-2xl font-bold font-display-scripture text-neutral-900 dark:text-white">
              Ministry Management Console
            </h1>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Manage devotional publications, audio assets, and prayer reflections
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800 self-start">
          {[
            { id: 'metrics', label: 'Metrics', icon: BarChart3 },
            { id: 'create', label: 'Author', icon: PlusCircle },
            { id: 'moderate', label: `Queue (${reportedComments.length})`, icon: Flag },
            { id: 'manage', label: 'Writings', icon: FileText },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeSection === id
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {statusNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* METRICS DASHBOARD SECTION */}
      {activeSection === 'metrics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-5 rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-md">
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-xs font-medium">Total Devotional Views</span>
                <Eye className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white tabular-nums font-display-scripture">
                {totalViews}
              </p>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">
                ↑ Continuous ministry reach
              </span>
            </div>

            <div className="p-5 rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-md">
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-xs font-medium">Active Disciples (24h)</span>
                <Users className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white tabular-nums font-display-scripture">
                248
              </p>
              <span className="text-[10px] text-neutral-400 font-medium mt-1 block">
                Across web & mobile apps
              </span>
            </div>

            <div className="p-5 rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-md">
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-xs font-medium">Total Amens</span>
                <Heart className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white tabular-nums font-display-scripture">
                {totalLikes}
              </p>
              <span className="text-[10px] text-rose-500 font-semibold mt-1 block">
                Fellowship affirmations
              </span>
            </div>

            <div className="p-5 rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-md">
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-xs font-medium">Published / Drafts</span>
                <FileText className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white tabular-nums font-display-scripture">
                {publishedCount} <span className="text-sm font-normal text-neutral-400">/ {draftCount}</span>
              </p>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-1 block">
                {draftCount > 0 ? `${draftCount} drafts pending` : 'All teachings live'}
              </span>
            </div>
          </div>

          {/* Ministry Cloud Security & System Health */}
          <div className="p-5 rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-md">
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              System Status & Cloud Architecture
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800">
                <p className="font-semibold text-neutral-900 dark:text-white">Firestore Database</p>
                <p className="text-neutral-500 dark:text-neutral-400 text-[11px] mt-0.5">
                  Modular security rules active with atomic field validations.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800">
                <p className="font-semibold text-neutral-900 dark:text-white">Anonymous Auth Gate</p>
                <p className="text-neutral-500 dark:text-neutral-400 text-[11px] mt-0.5">
                  Frictionless onboarding. Identity upgrade preserves same UID.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800">
                <p className="font-semibold text-neutral-900 dark:text-white">Community Moderation</p>
                <p className="text-neutral-500 dark:text-neutral-400 text-[11px] mt-0.5">
                  {reportedComments.length} items currently in review queue.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE DEVOTIONAL SECTION */}
      {activeSection === 'create' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveDevotional(false);
          }}
          className="p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-md shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
            <h3 className="font-bold text-base text-neutral-900 dark:text-white">
              Author New Devotional
            </h3>
            <span className="text-xs text-neutral-400">Supports Markdown body formatting</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Devotional Title *
              </label>
              <input
                id="admin-devotional-title"
                type="text"
                required
                placeholder="e.g. Abiding in the Living Vine"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Scripture Reference *
              </label>
              <input
                id="admin-scripture-ref"
                type="text"
                required
                placeholder="e.g. John 15:5"
                value={scripture}
                onChange={(e) => setScripture(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Scripture Verse Text *
            </label>
            <textarea
              id="admin-scripture-text"
              rows={2}
              required
              placeholder="e.g. I am the vine, ye are the branches: He that abideth in me..."
              value={scriptureText}
              onChange={(e) => setScriptureText(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs focus:ring-2 focus:ring-blue-500 leading-relaxed font-serif-reading italic"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Key Meditation Thought (Callout Banner)
            </label>
            <input
              id="admin-key-thought"
              type="text"
              placeholder="e.g. Discipleship is not striving for Christ; it is resting in Christ."
              value={keyThought}
              onChange={(e) => setKeyThought(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Devotional Body (Rich Markdown) *
            </label>
            <textarea
              id="admin-devotional-body"
              rows={8}
              required
              placeholder="Enter full theological exposition. Use ### for subheadings, - for lists, etc."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs focus:ring-2 focus:ring-blue-500 font-mono leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Daily Prayer of Consecration
            </label>
            <textarea
              id="admin-prayer-prompt"
              rows={2}
              placeholder="e.g. Heavenly Father, teach my restless soul to abide..."
              value={prayerPrompt}
              onChange={(e) => setPrayerPrompt(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs focus:ring-2 focus:ring-blue-500 italic"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Author Name
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Audio Narration Stream URL (MP3/OGG)
              </label>
              <input
                type="url"
                placeholder="https://storage.googleapis.com/.../audio.mp3"
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-3">
            <button
              id="save-draft-devotional-btn"
              type="button"
              onClick={() => handleSaveDevotional(true)}
              className="px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300"
            >
              Save as Draft
            </button>

            <button
              id="publish-now-devotional-btn"
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Publish Now (Live Feed)</span>
            </button>
          </div>
        </form>
      )}

      {/* MODERATION QUEUE SECTION */}
      {activeSection === 'moderate' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-neutral-900 dark:text-white">
              Reported Reflections Queue ({reportedComments.length})
            </h3>
            <span className="text-xs text-neutral-400">
              Discipleship reflections flagged by brethren for review
            </span>
          </div>

          {reportedComments.length === 0 ? (
            <div className="py-16 text-center text-neutral-400 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl">
              <CheckCircle className="w-10 h-10 stroke-1 mx-auto mb-2 text-emerald-500" />
              <p className="font-semibold text-sm text-neutral-700 dark:text-neutral-300">
                Moderation queue is pristine
              </p>
              <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
                No user comments have been flagged for review. The fellowship remains harmonious.
              </p>
            </div>
          ) : (
            reportedComments.map((comment) => (
              <div
                key={comment.id}
                className="p-4 sm:p-5 rounded-2xl border border-rose-500/30 bg-rose-50/20 dark:bg-rose-950/20 backdrop-blur-md shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                      Flagged by {comment.reportedBy.length} user{comment.reportedBy.length === 1 ? '' : 's'}
                    </span>
                    <span className="text-xs font-bold text-neutral-900 dark:text-white">
                      Author: {comment.displayName}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 leading-relaxed font-serif-reading">
                  “{comment.body}”
                </p>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    id={`approve-comment-${comment.id}`}
                    onClick={() => approveComment(comment.id)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Approve & Clear Flag</span>
                  </button>

                  <button
                    id={`remove-comment-${comment.id}`}
                    onClick={() => removeComment(comment.id)}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Comment</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MANAGE WRITINGS SECTION */}
      {activeSection === 'manage' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-neutral-900 dark:text-white">
              All Devotionals ({devotionals.length})
            </h3>
            <button
              onClick={() => setActiveSection('create')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create New</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {devotionals.map((d) => (
              <div
                key={d.id}
                className="p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-md flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 font-display-scripture">
                      {d.scripture}
                    </span>
                    {d.publishedAt ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                        Published
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
                        Draft
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                    {d.title}
                  </h4>
                  <p className="text-xs text-neutral-400 mt-0.5 truncate">
                    By {d.authorName} • {d.viewCount} views • {d.likeCount} amens
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!d.publishedAt && (
                    <button
                      onClick={() => publishDevotional(d.id)}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      Publish
                    </button>
                  )}

                  <button
                    onClick={() => deleteDevotional(d.id)}
                    className="p-2 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                    title="Delete devotional"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
