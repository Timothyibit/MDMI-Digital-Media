import * as React from "react";
import { cn } from "@/lib/utils";
import { Play, X } from "lucide-react";

// Interface for component props
export interface VideoPlayerProps extends React.HTMLAttributes<HTMLDivElement> {
  thumbnailUrl?: string;
  videoUrl: string;
  title: string;
  description?: string;
  aspectRatio?: "16/9" | "4/3" | "1/1";
}

/** Helper to format standard YouTube, Vimeo, and video links into valid iframe embed URLs */
export function formatEmbedVideoUrl(url: string, autoplay = true): string {
  if (!url) return "";
  let cleanUrl = url.trim();

  // YouTube watch or shorts format: https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID
  const youtubeMatch = cleanUrl.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (youtubeMatch && youtubeMatch[1]) {
    const videoId = youtubeMatch[1];
    return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? "1" : "0"}&rel=0&modestbranding=1`;
  }

  // Already YouTube embed
  if (cleanUrl.includes("youtube.com/embed/")) {
    if (autoplay && !cleanUrl.includes("autoplay=")) {
      cleanUrl += cleanUrl.includes("?") ? "&autoplay=1" : "?autoplay=1";
    }
    return cleanUrl;
  }

  // Vimeo: https://vimeo.com/VIDEO_ID
  const vimeoMatch = cleanUrl.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=${autoplay ? "1" : "0"}`;
  }

  return cleanUrl;
}

/** Helper to extract high quality YouTube thumbnail if available */
export function getYouTubeThumbnail(url?: string | null): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
  }
  return null;
}

const DEFAULT_FALLBACK_THUMBNAIL =
  "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=1200&q=80";

const VideoPlayer = React.forwardRef<HTMLDivElement, VideoPlayerProps>(
  (
    {
      className,
      thumbnailUrl,
      videoUrl,
      title,
      description,
      aspectRatio = "16/9",
      ...props
    },
    ref
  ) => {
    // State to manage the visibility of the video modal
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    // Effect to handle the 'Escape' key press for closing the modal
    React.useEffect(() => {
      const handleEsc = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setIsModalOpen(false);
        }
      };
      window.addEventListener("keydown", handleEsc);
      return () => {
        window.removeEventListener("keydown", handleEsc);
      };
    }, []);

    // Prevent body scroll when modal is open
    React.useEffect(() => {
      if (isModalOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "auto";
      }
    }, [isModalOpen]);

    const resolvedThumbnail =
      thumbnailUrl ||
      getYouTubeThumbnail(videoUrl) ||
      DEFAULT_FALLBACK_THUMBNAIL;

    const formattedEmbedUrl = formatEmbedVideoUrl(videoUrl, true);

    return (
      <>
        <div
          ref={ref}
          className={cn(
            "group relative cursor-pointer overflow-hidden rounded-lg shadow-lg",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            className
          )}
          style={{ aspectRatio }}
          onClick={() => setIsModalOpen(true)}
          onKeyDown={(e) => e.key === "Enter" && setIsModalOpen(true)}
          tabIndex={0}
          aria-label={`Play video: ${title}`}
          {...props}
        >
          {/* Thumbnail Image */}
          <img
            src={resolvedThumbnail}
            alt={`Thumbnail for ${title}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />

          {/* Play Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-white/35 shadow-xl ring-2 ring-white/40">
              <Play className="h-8 w-8 fill-white text-white translate-x-0.5" />
            </div>
          </div>

          {/* Title and Description */}
          <div className="absolute bottom-0 left-0 p-5 sm:p-6 text-left max-w-full">
            <div className="inline-block px-2 py-0.5 mb-2 rounded bg-red-600/90 text-[10px] font-black uppercase tracking-wider text-white">
              Video Message
            </div>
            <h3 className="text-lg sm:text-2xl font-bold text-white drop-shadow-md line-clamp-2">
              {title}
            </h3>
            {description && (
              <p className="mt-1 text-xs sm:text-sm text-white/90 line-clamp-2 font-medium drop-shadow-sm">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Video Modal */}
        {isModalOpen && (
          <div
            className="fixed inset-0 z-50 flex animate-in fade-in-0 items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6"
            aria-modal="true"
            role="dialog"
            onClick={() => setIsModalOpen(false)}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 z-50 rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/25 cursor-pointer"
              aria-label="Close video player"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Video Iframe Container */}
            <div
              className="w-full max-w-4xl aspect-video p-1 sm:p-2 bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <iframe
                src={formattedEmbedUrl}
                title={title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full rounded-xl"
              ></iframe>
            </div>
          </div>
        )}
      </>
    );
  }
);
VideoPlayer.displayName = "VideoPlayer";

export { VideoPlayer };
