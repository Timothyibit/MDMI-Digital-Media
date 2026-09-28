import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  ShieldCheck,
  Shield,
  Search,
  RefreshCw,
  Mail,
  Flame,
  Clock,
  BookOpen,
  Church,
  Phone,
  MapPin,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  UserCheck,
  UserX,
  X,
  Calendar,
  Bell,
  Eye,
} from 'lucide-react';
import { useAuthStore, BOOTSTRAP_ADMIN_EMAIL } from '../../store/useAuthStore';
import { UserProfile } from '../../types';
import { Badge, Button } from '../common';
import { PaginationPageDefault } from '@/components/application/pagination/pagination';

const USERS_PER_PAGE = 6;

export const AdminUserManager: React.FC = () => {
  const {
    user: currentUser,
    fetchAllRegisteredUsers,
    promoteUserToAdmin,
    demoteUserFromAdmin,
    adminVerifyDisciple,
  } = useAuthStore();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user' | 'verified' | 'unverified'>('all');
  const [sortBy, setSortBy] = useState<'streak' | 'minutes' | 'recent' | 'name'>('streak');
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, sortBy]);
  
  // Modals & Notices
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [actionConfirmUser, setActionConfirmUser] = useState<{
    user: UserProfile;
    action: 'promote' | 'demote';
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadUsers = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const fetched = await fetchAllRegisteredUsers();
      setUsers(fetched);
    } catch (err: any) {
      console.warn('Error fetching registered users:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const showNotice = (message: string, type: 'success' | 'error' = 'success') => {
    setActionNotice({ message, type });
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleVerifyDisciple = async (uid: string, name?: string | null) => {
    setActionLoading(true);
    const res = await adminVerifyDisciple(uid);
    setActionLoading(false);
    if (res.success) {
      showNotice(`Verified email for ${name || 'disciple'} successfully!`);
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, emailVerified: true } : u))
      );
      if (selectedUser?.uid === uid) {
        setSelectedUser({ ...selectedUser, emailVerified: true });
      }
    } else {
      showNotice(res.error || 'Failed to verify disciple email.', 'error');
    }
  };

  const handleConfirmRoleChange = async () => {
    if (!actionConfirmUser) return;
    const { user, action } = actionConfirmUser;
    setActionLoading(true);

    try {
      if (action === 'promote') {
        const res = await promoteUserToAdmin(user.uid);
        if (res.success) {
          showNotice(`Promoted ${user.displayName || user.email || 'user'} to Ministry Admin!`);
          // Update in local state
          setUsers((prev) =>
            prev.map((u) => (u.uid === user.uid ? { ...u, role: 'admin' } : u))
          );
          if (selectedUser?.uid === user.uid) {
            setSelectedUser({ ...selectedUser, role: 'admin' });
          }
        } else {
          showNotice(res.error || 'Failed to promote user.', 'error');
        }
      } else {
        const res = await demoteUserFromAdmin(user.uid, user.email);
        if (res.success) {
          showNotice(`Demoted ${user.displayName || user.email || 'user'} to Disciple.`);
          setUsers((prev) =>
            prev.map((u) => (u.uid === user.uid ? { ...u, role: 'user' } : u))
          );
          if (selectedUser?.uid === user.uid) {
            setSelectedUser({ ...selectedUser, role: 'user' });
          }
        } else {
          showNotice(res.error || 'Failed to demote user.', 'error');
        }
      }
    } catch (err: any) {
      showNotice(err.message || 'Operation failed', 'error');
    } finally {
      setActionLoading(false);
      setActionConfirmUser(null);
    }
  };

  // Filtered and sorted users
  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        // Role and status filter
        if (roleFilter === 'admin' && u.role !== 'admin') return false;
        if (roleFilter === 'user' && u.role === 'admin') return false;
        if (roleFilter === 'verified' && !u.emailVerified) return false;
        if (roleFilter === 'unverified' && u.emailVerified) return false;

        // Search query
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          (u.displayName && u.displayName.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.uid && u.uid.toLowerCase().includes(q)) ||
          (u.churchAttending && u.churchAttending.toLowerCase().includes(q)) ||
          (u.spiritualGifts && u.spiritualGifts.toLowerCase().includes(q)) ||
          (u.bio && u.bio.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (sortBy === 'streak') {
          return (b.streakCount || 0) - (a.streakCount || 0);
        }
        if (sortBy === 'minutes') {
          return (b.totalMinutesRead || 0) - (a.totalMinutesRead || 0);
        }
        if (sortBy === 'name') {
          const nameA = (a.displayName || a.email || 'Guest').toLowerCase();
          const nameB = (b.displayName || b.email || 'Guest').toLowerCase();
          return nameA.localeCompare(nameB);
        }
        // recent
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
  }, [users, roleFilter, searchQuery, sortBy]);

  // Aggregate metrics
  const totalUsersCount = users.length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const totalCumulativeMinutes = users.reduce((acc, u) => acc + (u.totalMinutesRead || 0), 0);
  const totalCompletedDevotionals = users.reduce((acc, u) => acc + (u.completedDevotionalsCount || 0), 0);

  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * USERS_PER_PAGE;
    const list = filteredUsers.slice(start, start + USERS_PER_PAGE);
    const seen = new Set<string>();
    return list.filter((u) => {
      if (!u || !u.uid || seen.has(u.uid)) return false;
      seen.add(u.uid);
      return true;
    });
  }, [filteredUsers, currentPage]);

  return (
    <div className="space-y-6">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Registered Disciples
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#5E72E4]/10 text-[#5E72E4] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold font-display-scripture text-neutral-900 dark:text-white tabular-nums">
              {totalUsersCount}
            </span>
            <p className="text-[11px] text-neutral-500 mt-0.5">Firestore cloud profiles</p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Ministry Overseers
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold font-display-scripture text-purple-600 dark:text-purple-400 tabular-nums">
              {adminCount}
            </span>
            <p className="text-[11px] text-neutral-500 mt-0.5">Admin authorization level</p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Total Reading Time
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold font-display-scripture text-neutral-900 dark:text-white tabular-nums">
              {totalCumulativeMinutes}
            </span>
            <p className="text-[11px] text-neutral-500 mt-0.5">Minutes in the Word</p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Devotions Read
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold font-display-scripture text-neutral-900 dark:text-white tabular-nums">
              {totalCompletedDevotionals}
            </span>
            <p className="text-[11px] text-neutral-500 mt-0.5">Completed reflections</p>
          </div>
        </div>
      </div>

      {/* Action Notice */}
      {actionNotice && (
        <div
          className={`p-4 rounded-xl border text-xs font-bold flex items-center gap-2.5 animate-fadeIn ${
            actionNotice.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
          }`}
        >
          {actionNotice.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{actionNotice.message}</span>
        </div>
      )}

      {/* Control Bar: Search, Filters & Refresh */}
      <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, church, spiritual gifts, or bio..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-[#5E72E4]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Dropdown & Refresh */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-neutral-500 dark:text-neutral-400 text-[11px] font-semibold">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-none"
              >
                <option value="streak">Highest Streak</option>
                <option value="minutes">Most Reading Time</option>
                <option value="recent">Recently Joined</option>
                <option value="name">Alphabetical</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => loadUsers(true)}
              disabled={refreshing || loading}
              className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
              title="Refresh users from Firestore"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#5E72E4]' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-neutral-100 dark:border-neutral-800">
          <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mr-1">
            Filter:
          </span>
          {[
            { id: 'all', label: `All Disciples (${users.length})` },
            { id: 'admin', label: `Admins (${adminCount})` },
            { id: 'user', label: `Disciples (${users.length - adminCount})` },
            { id: 'verified', label: `Verified (${users.filter((u) => u.emailVerified).length})` },
            { id: 'unverified', label: `Unverified (${users.filter((u) => !u.emailVerified).length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setRoleFilter(tab.id as any)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                roleFilter === tab.id
                  ? 'bg-[#5E72E4] text-white shadow-sm'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users List / Grid */}
      {loading ? (
        <div className="py-16 text-center text-neutral-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#5E72E4] mb-3" />
          <p className="text-sm font-semibold">Loading registered disciples from Firestore...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="py-16 text-center text-neutral-400 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white/40 dark:bg-neutral-900/40">
          <Users className="w-10 h-10 stroke-1 mx-auto mb-2 text-neutral-400" />
          <p className="font-bold text-sm text-neutral-800 dark:text-neutral-200">
            No disciples found matching query
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            Try adjusting your search criteria or filter tags.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedUsers.map((user, idx) => {
            const isAdmin = user.role === 'admin';
            const isSelf = user.uid === currentUser?.uid;
            const isPrimaryBootstrap =
              user.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
            const effectivePhoto = isSelf && currentUser?.photoUrl ? currentUser.photoUrl : user.photoUrl;
            const effectiveName = isSelf && currentUser?.displayName ? currentUser.displayName : (user.displayName || 'Anonymous Disciple');

            return (
              <div
                key={`user-${user.uid || 'u'}-${idx}`}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isAdmin
                    ? 'bg-white dark:bg-neutral-900 border-[#5E72E4]/30 shadow-[0_4px_16px_rgba(94,114,228,0.06)]'
                    : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-sm'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Avatar + Identity */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                    {/* User Avatar */}
                    {effectivePhoto ? (
                      <img
                        src={effectivePhoto}
                        alt={effectiveName}
                        className="w-12 h-12 rounded-xl object-cover border border-neutral-200 dark:border-neutral-700 shadow-sm shrink-0"
                      />
                    ) : (
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-base text-white shrink-0 ${
                          isAdmin ? 'bg-[#5E72E4]' : 'bg-neutral-600 dark:bg-neutral-700'
                        }`}
                      >
                        {effectiveName ? effectiveName.charAt(0).toUpperCase() : 'D'}
                      </div>
                    )}

                    {/* Names & Badges */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <span className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                          {effectiveName}
                        </span>

                        {/* Admin Badge vs Disciple Badge */}
                        {isAdmin ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#5E72E4]/10 text-[#5E72E4] border border-[#5E72E4]/25 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>{isPrimaryBootstrap ? 'Primary Overseer' : 'Ministry Admin'}</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                            Disciple
                          </span>
                        )}

                        {isSelf && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            You
                          </span>
                        )}
                      </div>

                      {/* Email & UID */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                        {user.email ? (
                          <div className="flex items-center gap-1.5">
                            <span className="flex items-center gap-1 text-neutral-700 dark:text-neutral-300">
                              <Mail className="w-3 h-3 text-neutral-400" />
                              <span>{user.email}</span>
                            </span>
                            {user.emailVerified ? (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold flex items-center gap-0.5">
                                <CheckCircle className="w-2.5 h-2.5" />
                                Verified
                              </span>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-semibold">
                                  Unverified
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleVerifyDisciple(user.uid, user.displayName);
                                  }}
                                  disabled={actionLoading}
                                  className="px-1.5 py-0.5 rounded text-[9px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/30 transition-colors"
                                  title="Overseer one-click verify"
                                >
                                  Verify
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 text-[11px]">
                            Guest Session (No email)
                          </span>
                        )}
                        <span className="text-[10px] text-neutral-400">
                          UID: {user.uid.slice(0, 10)}...
                        </span>
                      </div>

                      {/* Church or Bio snippet */}
                      {(user.churchAttending || user.bio) && (
                        <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 line-clamp-1">
                          {user.churchAttending && (
                            <span className="font-semibold text-[#5E72E4] mr-2">
                              ⛪ {user.churchAttending}
                            </span>
                          )}
                          {user.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Middle Column: Spiritual Journey Stats */}
                  <div className="flex items-center gap-3 sm:gap-6 py-2 px-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800 self-start sm:self-auto shrink-0">
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-[#FB6340] fill-[#FB6340]" />
                      <div>
                        <span className="text-xs font-extrabold text-neutral-900 dark:text-white tabular-nums">
                          {user.streakCount ?? 0}d
                        </span>
                        <span className="text-[10px] text-neutral-400 block -mt-0.5">Streak</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <div>
                        <span className="text-xs font-extrabold text-neutral-900 dark:text-white tabular-nums">
                          {user.totalMinutesRead || 0}m
                        </span>
                        <span className="text-[10px] text-neutral-400 block -mt-0.5">Meditation</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-emerald-500" />
                      <div>
                        <span className="text-xs font-extrabold text-neutral-900 dark:text-white tabular-nums">
                          {user.completedDevotionalsCount || 0}
                        </span>
                        <span className="text-[10px] text-neutral-400 block -mt-0.5">Read</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Actions (Promote / Demote / Inspect) */}
                  <div className="flex items-center justify-end gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-neutral-100 dark:border-neutral-800">
                    {/* View Details Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedUser(user)}
                      className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 transition-colors shadow-sm"
                      title="Inspect full disciple record"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>

                    {/* Promote or Demote Action */}
                    {isAdmin ? (
                      <button
                        type="button"
                        disabled={isPrimaryBootstrap || isSelf}
                        onClick={() =>
                          setActionConfirmUser({
                            user,
                            action: 'demote',
                          })
                        }
                        title={
                          isPrimaryBootstrap
                            ? 'Primary overseer cannot be demoted'
                            : isSelf
                            ? 'You cannot demote yourself'
                            : 'Demote from admin to regular disciple'
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                          isPrimaryBootstrap || isSelf
                            ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                            : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/25'
                        }`}
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Revoke Admin</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setActionConfirmUser({
                            user,
                            action: 'promote',
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-[#5E72E4] hover:bg-[#485ec9] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                        title="Promote disciple to Ministry Admin"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Promote to Admin</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredUsers.length > USERS_PER_PAGE && (
            <div className="pt-3">
              <PaginationPageDefault
                page={currentPage}
                total={totalUserPages}
                onPageChange={(p) => {
                  setCurrentPage(p);
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* CONFIRMATION DIALOG MODAL */}
      {actionConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  actionConfirmUser.action === 'promote'
                    ? 'bg-[#5E72E4]/15 text-[#5E72E4]'
                    : 'bg-rose-500/15 text-rose-500'
                }`}
              >
                {actionConfirmUser.action === 'promote' ? (
                  <ShieldCheck className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  {actionConfirmUser.action === 'promote'
                    ? 'Promote Disciple to Admin'
                    : 'Revoke Admin Privileges'}
                </h3>
                <p className="text-xs text-neutral-500">
                  {actionConfirmUser.user.displayName || actionConfirmUser.user.email || 'This user'}
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {actionConfirmUser.action === 'promote' ? (
                <>
                  Are you sure you want to promote{' '}
                  <strong className="text-neutral-900 dark:text-white">
                    {actionConfirmUser.user.displayName || actionConfirmUser.user.email}
                  </strong>{' '}
                  to a <strong>Ministry Overseer (Admin)</strong>? They will gain full permissions to
                  create and publish devotionals, broadcast notifications, and access the ministry console.
                </>
              ) : (
                <>
                  Are you sure you want to revoke Overseer privileges from{' '}
                  <strong className="text-neutral-900 dark:text-white">
                    {actionConfirmUser.user.displayName || actionConfirmUser.user.email}
                  </strong>
                  ? They will become a standard disciple and lose access to the admin console.
                </>
              )}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setActionConfirmUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmRoleChange}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-sm ${
                  actionConfirmUser.action === 'promote'
                    ? 'bg-[#5E72E4] hover:bg-[#485ec9]'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {actionLoading
                  ? 'Saving changes...'
                  : actionConfirmUser.action === 'promote'
                  ? 'Confirm Promotion'
                  : 'Revoke Privileges'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED USER INSPECTOR DRAWER / MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                {(selectedUser.uid === currentUser?.uid && currentUser?.photoUrl ? currentUser.photoUrl : selectedUser.photoUrl) ? (
                  <img
                    src={selectedUser.uid === currentUser?.uid && currentUser?.photoUrl ? currentUser.photoUrl : (selectedUser.photoUrl || '')}
                    alt={selectedUser.uid === currentUser?.uid && currentUser?.displayName ? currentUser.displayName : (selectedUser.displayName || 'User')}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-[#5E72E4]"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-[#5E72E4] text-white flex items-center justify-center font-extrabold text-2xl">
                    {(selectedUser.uid === currentUser?.uid && currentUser?.displayName
                      ? currentUser.displayName
                      : (selectedUser.displayName || 'D')
                    ).charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                      {selectedUser.uid === currentUser?.uid && currentUser?.displayName
                        ? currentUser.displayName
                        : (selectedUser.displayName || 'Anonymous Disciple')}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        selectedUser.role === 'admin'
                          ? 'bg-[#5E72E4]/10 text-[#5E72E4]'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      {selectedUser.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-neutral-500 font-mono">
                      {selectedUser.email || 'No email attached (Guest session)'}
                    </p>
                    {selectedUser.email && (
                      selectedUser.emailVerified ? (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Verified Email
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-semibold">
                          Unverified Email
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800 text-center">
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase">Active Streak</span>
                <p className="text-base font-extrabold text-[#FB6340] mt-0.5">
                  🔥 {selectedUser.streakCount ?? 0} Days
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase">Meditation Time</span>
                <p className="text-base font-extrabold text-amber-500 mt-0.5">
                  ⏱ {selectedUser.totalMinutesRead || 0} mins
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase">Devotions Read</span>
                <p className="text-base font-extrabold text-emerald-500 mt-0.5">
                  📖 {selectedUser.completedDevotionalsCount || 0}
                </p>
              </div>
            </div>

            {/* Disciple Profile Details */}
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-neutral-900 dark:text-white uppercase tracking-wider text-[11px]">
                Disciple Profile & Background
              </h4>

              {selectedUser.bio && (
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/60">
                  <span className="font-bold text-[#5E72E4] block mb-1">Spiritual Bio & Life Verse</span>
                  <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                    {selectedUser.bio}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-1">
                  <span className="text-neutral-400 text-[10px] font-bold uppercase flex items-center gap-1">
                    <Church className="w-3.5 h-3.5 text-[#5E72E4]" />
                    <span>Church Fellowship</span>
                  </span>
                  <p className="text-neutral-800 dark:text-neutral-200 font-semibold">
                    {selectedUser.churchAttending || 'Not provided'}
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-1">
                  <span className="text-neutral-400 text-[10px] font-bold uppercase flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Contact Phone</span>
                  </span>
                  <p className="text-neutral-800 dark:text-neutral-200 font-semibold">
                    {selectedUser.contact || 'Not provided'}
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-1">
                  <span className="text-neutral-400 text-[10px] font-bold uppercase flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>Location / Address</span>
                  </span>
                  <p className="text-neutral-800 dark:text-neutral-200 font-semibold">
                    {selectedUser.address || 'Not provided'}
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-1">
                  <span className="text-neutral-400 text-[10px] font-bold uppercase flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Spiritual Gifts & Ministry Call</span>
                  </span>
                  <p className="text-neutral-800 dark:text-neutral-200 font-semibold">
                    {selectedUser.spiritualGifts || 'Not provided'}
                  </p>
                </div>
              </div>

              {/* Technical / Cloud Sync Info */}
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-2 text-[11px] text-neutral-500">
                <div className="flex items-center justify-between">
                  <span>Firestore UID:</span>
                  <span className="font-mono text-neutral-700 dark:text-neutral-300 font-semibold">
                    {selectedUser.uid}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Daily Devotional Reminder:</span>
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                    {selectedUser.notificationsEnabled
                      ? `Active at ${selectedUser.reminderTime || '07:00'}`
                      : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Profile Created:</span>
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                    {selectedUser.createdAt
                      ? new Date(selectedUser.createdAt).toLocaleDateString()
                      : 'Initial App Deployment'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last Word Reflection:</span>
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                    {selectedUser.lastReadAt
                      ? new Date(selectedUser.lastReadAt).toLocaleDateString()
                      : 'Recently active'}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                {!selectedUser.emailVerified && selectedUser.email && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleVerifyDisciple(selectedUser.uid, selectedUser.displayName)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Verify Email Status</span>
                  </button>
                )}

                {selectedUser.role === 'admin' ? (
                  <button
                    type="button"
                    disabled={
                      selectedUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() ||
                      selectedUser.uid === currentUser?.uid
                    }
                    onClick={() => {
                      setActionConfirmUser({ user: selectedUser, action: 'demote' });
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-50 transition-colors"
                  >
                    Revoke Overseer Access
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setActionConfirmUser({ user: selectedUser, action: 'promote' });
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#5E72E4] hover:bg-[#485ec9] transition-colors"
                  >
                    Promote to Overseer (Admin)
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
