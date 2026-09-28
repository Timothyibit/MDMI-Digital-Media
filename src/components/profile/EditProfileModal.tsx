"use client";

import React, { useState, useEffect, useId } from 'react';
import {
  ImagePlus,
  X,
  Sparkles,
  Church,
  Phone,
  MapPin,
  Check,
  User,
  Globe,
  Upload,
  Camera,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useImageUpload } from '@/components/ui/dialog-utils/use-image-upload';
import { useCharacterLimit } from '@/components/ui/dialog-utils/use-character-limit';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_BANNERS = [
  'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80',
];

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const id = useId();
  const { user, updateUserProfile } = useAuthStore();

  const [displayName, setDisplayName] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [website, setWebsite] = useState('');
  const [churchAttending, setChurchAttending] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [spiritualGifts, setSpiritualGifts] = useState('');
  const [saving, setSaving] = useState(false);

  const maxBioLength = 240;
  const {
    value: bioValue,
    setValue: setBioValue,
    characterCount,
    handleChange: handleBioChange,
    maxLength: bioLimit,
  } = useCharacterLimit({
    maxLength: maxBioLength,
    initialValue: '',
  });

  // Sync state when modal opens
  useEffect(() => {
    if (user && isOpen) {
      setDisplayName(user.displayName || '');
      setPhotoUrl(user.photoUrl || null);
      setBannerUrl(user.bannerUrl || null);
      setBioValue(user.bio || '');
      setWebsite(user.website || '');
      setChurchAttending(user.churchAttending || '');
      setContact(user.contact || '');
      setAddress(user.address || '');
      setSpiritualGifts(user.spiritualGifts || '');
    }
  }, [user, isOpen, setBioValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updateUserProfile({
      displayName: displayName.trim() || 'Devoted Disciple',
      photoUrl: photoUrl || null,
      bannerUrl: bannerUrl || null,
      bio: bioValue.trim(),
      website: website.trim(),
      churchAttending: churchAttending.trim(),
      contact: contact.trim(),
      address: address.trim(),
      spiritualGifts: spiritualGifts.trim(),
    });
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex flex-col gap-0 overflow-y-visible p-0 sm:max-w-lg [&>button:last-child]:top-3.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-2xl">
        <DialogHeader className="contents space-y-0 text-left">
          <DialogTitle className="border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <User className="w-4 h-4 text-[#5E72E4]" />
            <span>Edit Disciple Profile</span>
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">
          Upload profile photo and banner from your device, and update your spiritual details.
        </DialogDescription>

        <div className="overflow-y-auto max-h-[72vh] divide-y divide-neutral-100 dark:divide-neutral-800">
          {/* Header Banner Upload from Device */}
          <ProfileBannerUpload
            currentImage={bannerUrl}
            onImageChanged={setBannerUrl}
            defaultImage={PRESET_BANNERS[0]}
          />

          {/* Avatar Upload from Device (Overlapping) */}
          <ProfileAvatarUpload
            currentImage={photoUrl}
            onImageChanged={setPhotoUrl}
            fallbackInitial={displayName ? displayName.charAt(0).toUpperCase() : 'D'}
          />

          {/* Form Fields */}
          <div className="px-6 pb-6 pt-4">
            <form id="edit-profile-form" onSubmit={handleSubmit} className="space-y-4">
              {/* Preset Selectors */}
              <div className="space-y-2 pb-2">
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span className="font-semibold">Quick Avatar Presets:</span>
                  <span className="text-[10px]">Or upload your own above</span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPhotoUrl(url)}
                      className="w-8 h-8 rounded-full overflow-hidden border-2 hover:scale-110 transition-transform shrink-0 border-neutral-300 dark:border-neutral-700 hover:border-[#5E72E4]"
                      title="Select avatar preset"
                    >
                      <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor={`${id}-name`} className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Disciple / Display Name *
                </Label>
                <Input
                  id={`${id}-name`}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Sister Grace / Brother Timothy"
                  required
                  className="text-xs rounded-xl"
                />
              </div>

              {/* Website / Ministry Link */}
              <div className="space-y-1.5">
                <Label htmlFor={`${id}-website`} className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Website / Social Link
                </Label>
                <div className="flex rounded-xl shadow-xs">
                  <span className="inline-flex items-center rounded-s-xl border border-r-0 border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-3 text-xs text-neutral-500 font-mono">
                    https://
                  </span>
                  <Input
                    id={`${id}-website`}
                    className="-ms-px rounded-s-none text-xs rounded-e-xl"
                    placeholder="themastersdiscipleshipministries.org"
                    value={website.replace(/^https?:\/\//, '')}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
              </div>

              {/* Spiritual Biography */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`${id}-bio`} className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Spiritual Biography & Calling
                  </Label>
                  <span className="text-[11px] text-neutral-400 tabular-nums">
                    {bioLimit - characterCount} characters left
                  </span>
                </div>
                <Textarea
                  id={`${id}-bio`}
                  value={bioValue}
                  onChange={handleBioChange}
                  placeholder="Share a brief testimony, favorite verse, or discipleship focus..."
                  maxLength={maxBioLength}
                  className="text-xs min-h-[75px] rounded-xl resize-none"
                />
              </div>

              {/* Church Assembly & Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor={`${id}-church`} className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                    <Church className="w-3 h-3 text-[#5E72E4]" />
                    <span>Church / Assembly</span>
                  </Label>
                  <Input
                    id={`${id}-church`}
                    value={churchAttending}
                    onChange={(e) => setChurchAttending(e.target.value)}
                    placeholder="Home fellowship"
                    className="text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`${id}-gifts`} className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Spiritual Gifts</span>
                  </Label>
                  <Input
                    id={`${id}-gifts`}
                    value={spiritualGifts}
                    onChange={(e) => setSpiritualGifts(e.target.value)}
                    placeholder="e.g. Teaching, Intercession"
                    className="text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor={`${id}-contact`} className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-500" />
                    <span>Phone / WhatsApp</span>
                  </Label>
                  <Input
                    id={`${id}-contact`}
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`${id}-address`} className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-rose-500" />
                    <span>City, Country</span>
                  </Label>
                  <Input
                    id={`${id}-address`}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. London, UK"
                    className="text-xs rounded-xl"
                  />
                </div>
              </div>
            </form>
          </div>
        </div>

        <DialogFooter className="border-t border-neutral-200 dark:border-neutral-800 px-6 py-3.5 bg-neutral-50 dark:bg-neutral-900/90 rounded-b-2xl flex items-center justify-between sm:justify-end gap-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="text-xs rounded-xl cursor-pointer">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            form="edit-profile-form"
            disabled={saving}
            className="bg-[#5E72E4] hover:bg-[#4d61ce] text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save Profile Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Profile Banner with Device Upload
function ProfileBannerUpload({
  currentImage,
  onImageChanged,
  defaultImage,
}: {
  currentImage: string | null;
  onImageChanged: (url: string | null) => void;
  defaultImage: string;
}) {
  const {
    fileInputRef,
    handleThumbnailClick,
    handleFileChange,
    isProcessing,
  } = useImageUpload({
    initialImage: currentImage,
    onImageSelected: (dataUrl) => onImageChanged(dataUrl),
    maxDimension: 1200,
  });

  const displayImage = currentImage || defaultImage;

  return (
    <div className="h-32 sm:h-36 relative group">
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-neutral-200 dark:bg-neutral-800">
        <img
          className="h-full w-full object-cover transition-opacity duration-300"
          src={displayImage}
          alt="Profile background banner"
        />
        <div className="absolute inset-0 bg-black/30 opacity-70 group-hover:opacity-90 transition-opacity" />

        <div className="absolute inset-0 flex items-center justify-center gap-2">
          <button
            type="button"
            className="z-10 flex items-center gap-1.5 px-3 py-1.5 cursor-pointer rounded-full bg-black/60 hover:bg-black/80 text-white text-xs font-semibold shadow-md transition-all backdrop-blur-xs"
            onClick={handleThumbnailClick}
            aria-label="Upload banner image from device"
            title="Upload banner photo from device"
          >
            <ImagePlus size={14} strokeWidth={2} />
            <span>{isProcessing ? 'Processing...' : 'Upload Banner'}</span>
          </button>
          {currentImage && (
            <button
              type="button"
              className="z-10 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 hover:bg-rose-600 text-white shadow-md transition-all"
              onClick={() => onImageChanged(null)}
              aria-label="Remove custom banner"
              title="Reset to default banner"
            >
              <X size={14} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
        aria-label="Upload banner file"
      />
    </div>
  );
}

// Profile Avatar with Device Upload
function ProfileAvatarUpload({
  currentImage,
  onImageChanged,
  fallbackInitial,
}: {
  currentImage: string | null;
  onImageChanged: (url: string | null) => void;
  fallbackInitial: string;
}) {
  const {
    fileInputRef,
    handleThumbnailClick,
    handleFileChange,
    isProcessing,
  } = useImageUpload({
    initialImage: currentImage,
    onImageSelected: (dataUrl) => onImageChanged(dataUrl),
    maxDimension: 600,
  });

  return (
    <div className="-mt-12 px-6 flex items-end justify-between">
      <div className="relative flex size-24 items-center justify-center overflow-hidden rounded-2xl border-4 border-white dark:border-neutral-900 bg-neutral-100 dark:bg-neutral-800 shadow-lg shadow-black/20 group">
        {currentImage ? (
          <img
            src={currentImage}
            className="h-full w-full object-cover"
            alt="Profile avatar"
          />
        ) : (
          <div className="w-full h-full bg-[#5E72E4] flex items-center justify-center text-white font-extrabold text-3xl">
            {fallbackInitial}
          </div>
        )}

        <button
          type="button"
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-white cursor-pointer"
          onClick={handleThumbnailClick}
          aria-label="Upload profile photo from device"
          title="Upload avatar photo from device"
        >
          <Camera size={20} strokeWidth={2} />
          <span className="text-[9px] font-bold mt-1">Change</span>
        </button>

        <button
          type="button"
          className="absolute bottom-1 right-1 flex size-7 cursor-pointer items-center justify-center rounded-full bg-[#5E72E4] text-white shadow-sm hover:scale-105 transition-transform"
          onClick={handleThumbnailClick}
          aria-label="Change photo"
        >
          <ImagePlus size={14} strokeWidth={2} />
        </button>
      </div>

      <div className="mb-2">
        <button
          type="button"
          onClick={handleThumbnailClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-750 text-xs font-semibold text-neutral-700 dark:text-neutral-200 transition-colors shadow-2xs cursor-pointer"
        >
          <Upload size={13} className="text-[#5E72E4]" />
          <span>{isProcessing ? 'Processing...' : 'Upload Device Photo'}</span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
          aria-label="Upload profile picture"
        />
      </div>
    </div>
  );
}

export default EditProfileModal;
