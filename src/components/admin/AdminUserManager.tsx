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
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, BOOTSTRAP_ADMIN_EMAIL, computeAccurateUserMinutes } from '../../store/useAuthStore';
import { UserProfile } from '../../types';
import { Badge, Button } from '../common';
import MotionButton from '@/components/ui/motion-button';
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
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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
          return computeAccurateUserMinutes(b) - computeAccurateUserMinutes(a);
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
  const totalCumulativeMinutes = users.reduce((acc, u) => acc + computeAccurateUserMinutes(u), 0);
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
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 w-full">
        <div className="p-3 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 truncate">
              Registered Disciples
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#5E72E4]/10 text-[#5E72E4] flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <span className="text-xl sm:text-3xl font-extrabold font-display-scripture text-neutral-900 dark:text-white tabular-nums">
              {totalUsersCount}
            </span>
            <p className="text-[10px] sm:text-[11px] text-neutral-500 mt-0.5 truncate">Registered members</p>
          </div>
        </div>

        <div className="p-3 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 truncate">
              Overseers
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <span className="text-xl sm:text-3xl font-extrabold font-display-scripture text-purple-600 dark:text-purple-400 tabular-nums">
              {adminCount}
            </span>
            <p className="text-[10px] sm:text-[11px] text-neutral-500 mt-0.5 truncate">Admin level</p>
          </div>
        </div>

        <div className="p-3 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 truncate">
              Reading Time
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <span className="text-xl sm:text-3xl font-extrabold font-display-scripture text-neutral-900 dark:text-white tabular-nums">
              {totalCumulativeMinutes}
            </span>
            <p className="text-[10px] sm:text-[11px] text-neutral-500 mt-0.5 truncate">Minutes in Word</p>
          </div>
        </div>

        <div className="p-3 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 truncate">
              Devotions Read
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <span className="text-xl sm:text-3xl font-extrabold font-display-scripture text-neutral-900 dark:text-white tabular-nums">
              {totalCompletedDevotionals}
            </span>
            <p className="text-[10px] sm:text-[11px] text-neutral-500 mt-0.5 truncate">Reflections</p>
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

      {/* Control Bar: Search & Hidden Filter Box (react-native-search-component style) */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          {/* Search bar */}
          <div className="flex-1 relative flex items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-3.5 py-2 shadow-xs transition-all">
            <Search className="w-4 h-4 text-neutral-400 shrink-0 mr-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, church, spiritual gifts, or bio..."
              className="flex-1 bg-transparent text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none border-none min-w-0"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="w-5 h-5 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 flex items-center justify-center cursor-pointer transition-colors mr-1"
              >
                <X className="w-3 h-3" />
              </button>
            )}

            {/* Filter Toggle Button */}
            <div className="flex items-center pl-2 border-l border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isFilterOpen
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-xs'
                    : roleFilter !== 'all' || sortBy !== 'streak'
                    ? 'bg-[#84CC16]/15 border border-[#84CC16]/50 text-[#4D7C0F] dark:text-[#84CC16]'
                    : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
                {(roleFilter !== 'all' ? 1 : 0) + (sortBy !== 'streak' ? 1 : 0) > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#DC2626] text-white text-[10px] font-black flex items-center justify-center">
                    {(roleFilter !== 'all' ? 1 : 0) + (sortBy !== 'streak' ? 1 : 0)}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Refresh Button */}
          <MotionButton
            size="sm"
            variant="secondary"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#84CC16]' : ''}`} />}
            label="Refresh"
            onClick={() => loadUsers(true)}
            disabled={refreshing || loading}
          />
        </div>

        {/* Hidden Filter Box */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-lg space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-[#84CC16]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-white">
                      Disciple Directory Filters
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(roleFilter !== 'all' || sortBy !== 'streak') && (
                      <button
                        type="button"
                        onClick={() => {
                          setRoleFilter('all');
                          setSortBy('streak');
                        }}
                        className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset Filters</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsFilterOpen(false)}
                      className="w-6 h-6 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-500 flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                    Disciple Status & Roles:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
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
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          roleFilter === tab.id
                            ? 'bg-[#84CC16] text-white shadow-xs'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort dropdown */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                    Sort Sequence:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'streak', label: 'Highest Streak' },
                      { id: 'minutes', label: 'Most Reading Time' },
                      { id: 'recent', label: 'Recently Joined' },
                      { id: 'name', label: 'Alphabetical' },
                    ].map((sortOption) => (
                      <button
                        key={sortOption.id}
                        type="button"
                        onClick={() => setSortBy(sortOption.id as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          sortBy === sortOption.id
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-black border-transparent shadow-xs'
                            : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        {sortOption.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800">
                  <span className="text-[11px] text-neutral-400">
                    Showing {filteredUsers.length} of {users.length} members
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen(false)}
                    className="px-3 py-1 bg-neutral-900 text-white dark:bg-white dark:text-black rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Users List / Grid */}
      {loading ? (
        <div className="py-16 text-center text-neutral-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#5E72E4] mb-3" />
          <p className="text-sm font-semibold">Loading disciples...</p>
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
                className={`p-3.5 sm:p-5 rounded-2xl border transition-all w-full max-w-full overflow-hidden ${
                  isAdmin
                    ? 'bg-white dark:bg-neutral-900 border-[#5E72E4]/30 shadow-[0_4px_16px_rgba(94,114,228,0.06)]'
                    : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-sm'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full min-w-0">
                  {/* Left Column: Avatar + Identity */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1 w-full">
                    {/* User Avatar */}
                    {effectivePhoto ? (
                      <img
                        src={effectivePhoto}
                        alt={effectiveName}
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover border border-neutral-200 dark:border-neutral-700 shadow-sm shrink-0"
                      />
                    ) : (
                      <div
                        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-extrabold text-base text-white shrink-0 ${
                          isAdmin ? 'bg-[#5E72E4]' : 'bg-neutral-600 dark:bg-neutral-700'
                        }`}
                      >
                        {effectiveName ? effectiveName.charAt(0).toUpperCase() : 'D'}
                      </div>
                    )}

                    {/* Names & Badges */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-0.5">
                        <span className="font-bold text-sm text-neutral-900 dark:text-white truncate max-w-full">
                          {effectiveName}
                        </span>

                        {/* Admin Badge vs Disciple Badge */}
                        {isAdmin ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#5E72E4]/10 text-[#5E72E4] border border-[#5E72E4]/25 flex items-center gap-1 shrink-0">
                            <ShieldCheck className="w-3 h-3" />
                            <span>{isPrimaryBootstrap ? 'Primary Overseer' : 'Ministry Admin'}</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 shrink-0">
                            Disciple
                          </span>
                        )}

                        {isSelf && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                            You
                          </span>
                        )}
                      </div>

                      {/* Email & UID */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400 font-mono min-w-0">
                        {user.email ? (
                          <div className="flex items-center gap-1.5 min-w-0 max-w-full">
                            <span className="flex items-center gap-1 text-neutral-700 dark:text-neutral-300 min-w-0">
                              <Mail className="w-3 h-3 text-neutral-400 shrink-0" />
                              <span className="truncate max-w-[160px] sm:max-w-xs">{user.email}</span>
                            </span>
                            {user.emailVerified ? (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold flex items-center gap-0.5 shrink-0">
                                <CheckCircle className="w-2.5 h-2.5" />
                                Verified
                              </span>
                            ) : (
                              <div className="flex items-center gap-1.5 shrink-0">
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
                          <span className="text-amber-600 dark:text-amber-400 text-[11px] truncate">
                            Guest Session (No email)
                          </span>
                        )}
                        <span className="text-[10px] text-neutral-400 shrink-0">
                          UID: {user.uid.slice(0, 10)}...
                        </span>
                      </div>

                      {/* Church or Bio snippet */}
                      {(user.churchAttending || user.bio) && (
                        <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 line-clamp-1 break-words">
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
                  <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-6 py-2 px-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800 w-full sm:w-auto shrink-0">
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-[#FB6340] fill-[#FB6340] shrink-0" />
                      <div>
                        <span className="text-xs font-extrabold text-neutral-900 dark:text-white tabular-nums">
                          {user.streakCount ?? 0}d
                        </span>
                        <span className="text-[10px] text-neutral-400 block -mt-0.5">Streak</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <span className="text-xs font-extrabold text-neutral-900 dark:text-white tabular-nums">
                          {computeAccurateUserMinutes(user)}m
                        </span>
                        <span className="text-[10px] text-neutral-400 block -mt-0.5">Meditation</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div>
                        <span className="text-xs font-extrabold text-neutral-900 dark:text-white tabular-nums">
                          {user.completedDevotionalsCount || 0}
                        </span>
                        <span className="text-[10px] text-neutral-400 block -mt-0.5">Read</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Actions (Promote / Demote / Inspect) */}
                  <div className="flex items-center justify-start sm:justify-end gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-neutral-100 dark:border-neutral-800 w-full sm:w-auto flex-wrap">
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

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex-wrap">
              <MotionButton
                variant="secondary"
                size="sm"
                icon={<X className="w-3.5 h-3.5" />}
                label="Cancel"
                onClick={() => setActionConfirmUser(null)}
                disabled={actionLoading}
              />

              <MotionButton
                variant={actionConfirmUser.action === 'promote' ? 'ministry-green' : 'danger'}
                size="sm"
                icon={<ShieldCheck className="w-3.5 h-3.5 text-white" />}
                label={
                  actionLoading
                    ? 'Saving changes...'
                    : actionConfirmUser.action === 'promote'
                    ? 'Confirm Promotion'
                    : 'Revoke Privileges'
                }
                onClick={handleConfirmRoleChange}
                disabled={actionLoading}
              />
            </div>
          </div>
        </div>
      )}

      {/* DETAILED USER INSPECTOR DRAWER / MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-2.5 min-w-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {(selectedUser.uid === currentUser?.uid && currentUser?.photoUrl ? currentUser.photoUrl : selectedUser.photoUrl) ? (
                  <img
                    src={selectedUser.uid === currentUser?.uid && currentUser?.photoUrl ? currentUser.photoUrl : (selectedUser.photoUrl || '')}
                    alt={selectedUser.uid === currentUser?.uid && currentUser?.displayName ? currentUser.displayName : (selectedUser.displayName || 'User')}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-[#5E72E4] shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#5E72E4] text-white flex items-center justify-center font-extrabold text-xl sm:text-2xl shrink-0">
                    {(selectedUser.uid === currentUser?.uid && currentUser?.displayName
                      ? currentUser.displayName
                      : (selectedUser.displayName || 'D')
                    ).charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white truncate max-w-full">
                      {selectedUser.uid === currentUser?.uid && currentUser?.displayName
                        ? currentUser.displayName
                        : (selectedUser.displayName || 'Anonymous Disciple')}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shrink-0 ${
                        selectedUser.role === 'admin'
                          ? 'bg-[#5E72E4]/10 text-[#5E72E4]'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      {selectedUser.role}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5 min-w-0">
                    <p className="text-xs text-neutral-500 font-mono break-all truncate max-w-full">
                      {selectedUser.email || 'No email attached (Guest session)'}
                    </p>
                    {selectedUser.email && (
                      selectedUser.emailVerified ? (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1 shrink-0">
                          <CheckCircle className="w-3 h-3" />
                          Verified
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-semibold shrink-0">
                          Unverified
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
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
                  ⏱ {computeAccurateUserMinutes(selectedUser)} mins
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
                  <span>Account ID:</span>
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
