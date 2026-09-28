import React, { useEffect, useState, useMemo } from 'react';
import {
  Mic,
  Volume2,
  VolumeX,
  Play,
  Square,
  Check,
  X,
  Sliders,
  Sparkles,
  Globe,
  Radio,
} from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { nativeSpeech } from '../../services/nativeSpeechService';

interface VoiceOption {
  voiceURI: string;
  name: string;
  displayName: string;
  lang: string;
  region: string;
  tag: string;
  isDefault?: boolean;
}

const PREVIEW_SCRIPTURE = 'The Lord bless you and keep you; the Lord make His face shine upon you and be gracious to you.';

export const VoiceSelectorModal: React.FC = () => {
  const {
    voiceSelectorOpen,
    closeVoiceSelector,
    audioState,
    setAudioVoice,
    setAudioPitch,
    setAudioPlaybackRate,
  } = useUIStore();

  const [rawVoices, setRawVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [previewingURI, setPreviewingURI] = useState<string | null>(null);
  const [filterLang, setFilterLang] = useState<'all' | 'us' | 'uk' | 'global'>('all');

  useEffect(() => {
    // Initial fetch
    const list = nativeSpeech.getVoices();
    setRawVoices(list);

    // Subscribe to voice changes (Chrome loads voices asynchronously)
    const unsubscribe = nativeSpeech.onVoicesChanged((voices) => {
      setRawVoices(voices);
    });

    return () => {
      unsubscribe();
      nativeSpeech.stopPreview();
    };
  }, []);

  // Format and curate voices
  const voicesList = useMemo<VoiceOption[]>(() => {
    if (rawVoices.length === 0) {
      // Fallback options for immediate UI display if synthesis is warming up
      return [
        {
          voiceURI: 'default-female',
          name: 'Natural Voice (Warm)',
          displayName: 'Grace (Warm & Gentle)',
          lang: 'en-US',
          region: 'US',
          tag: 'Calm & Warm',
          isDefault: true,
        },
        {
          voiceURI: 'default-male',
          name: 'Natural Voice (Deep)',
          displayName: 'David (Deep & Reverent)',
          lang: 'en-GB',
          region: 'UK',
          tag: 'Pastoral',
        },
      ];
    }

    // Filter to English or primary languages
    const enVoices = rawVoices.filter((v) => v.lang.startsWith('en'));
    const sourceVoices = enVoices.length > 0 ? enVoices : rawVoices;

    return sourceVoices.map((v) => {
      const lowerName = v.name.toLowerCase();
      let displayName = v.name.replace(/(Google|Microsoft|Apple)\s*/gi, '').trim();
      let region = 'Global';
      let tag = 'Clear & Expressive';

      if (v.lang.includes('US') || lowerName.includes('us')) {
        region = 'US';
      } else if (v.lang.includes('GB') || lowerName.includes('uk') || lowerName.includes('british')) {
        region = 'UK';
      } else if (v.lang.includes('AU') || lowerName.includes('australia')) {
        region = 'Australia';
      } else if (v.lang.includes('NG') || lowerName.includes('nigeria')) {
        region = 'Nigeria';
      } else if (v.lang.includes('IN') || lowerName.includes('india')) {
        region = 'India';
      }

      if (lowerName.includes('natural') || lowerName.includes('online')) {
        tag = 'Ultra Natural';
      } else if (lowerName.includes('samantha') || lowerName.includes('karen') || lowerName.includes('victoria')) {
        tag = 'Gentle & Reflective';
      } else if (lowerName.includes('daniel') || lowerName.includes('oliver') || lowerName.includes('arthur')) {
        tag = 'Reverent & Pastoral';
      } else if (lowerName.includes('serena') || lowerName.includes('fiona') || lowerName.includes('moira')) {
        tag = 'Warm Meditation';
      }

      return {
        voiceURI: v.voiceURI,
        name: v.name,
        displayName: displayName || v.name,
        lang: v.lang,
        region,
        tag,
        isDefault: v.default,
      };
    });
  }, [rawVoices]);

  const filteredVoices = useMemo(() => {
    if (filterLang === 'us') return voicesList.filter((v) => v.region === 'US');
    if (filterLang === 'uk') return voicesList.filter((v) => v.region === 'UK');
    if (filterLang === 'global') return voicesList.filter((v) => v.region !== 'US' && v.region !== 'UK');
    return voicesList;
  }, [voicesList, filterLang]);

  if (!voiceSelectorOpen) return null;

  const currentURI = audioState.selectedVoiceURI || nativeSpeech.getSelectedVoiceURI();
  const currentPitch = audioState.pitch || 1.0;
  const currentRate = audioState.playbackRate || 1.0;

  const handleSelectVoice = (v: VoiceOption) => {
    setAudioVoice(v.voiceURI, v.displayName);
  };

  const handleTogglePreview = (v: VoiceOption, e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewingURI === v.voiceURI) {
      nativeSpeech.stopPreview();
      setPreviewingURI(null);
    } else {
      setPreviewingURI(v.voiceURI);
      nativeSpeech.previewVoice(v.voiceURI, PREVIEW_SCRIPTURE);
      // Automatically clear after preview
      setTimeout(() => {
        setPreviewingURI((prev) => (prev === v.voiceURI ? null : prev));
      }, 5500);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setAudioPlaybackRate(speed);
  };

  const handlePitchChange = (pitch: number) => {
    setAudioPitch(pitch);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      {/* Backdrop tap to close */}
      <div
        className="absolute inset-0"
        onClick={() => {
          nativeSpeech.stopPreview();
          closeVoiceSelector();
        }}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg max-h-[90vh] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10 animate-slide-up">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/80 dark:bg-neutral-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5E72E4] to-[#825ee4] flex items-center justify-center text-white shadow-md shadow-[#5E72E4]/20">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                Narrator Voice & Tone
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-full bg-[#84CC16]/20 text-emerald-700 dark:text-[#84CC16]">
                  Live
                </span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Select your preferred voice for scripture audio
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              nativeSpeech.stopPreview();
              closeVoiceSelector();
            }}
            className="w-8 h-8 rounded-full bg-neutral-200/60 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-5 pt-3 pb-2 flex items-center gap-2 overflow-x-auto border-b border-neutral-100 dark:border-neutral-800/80">
          <button
            type="button"
            onClick={() => setFilterLang('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filterLang === 'all'
                ? 'bg-[#5E72E4] text-white shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            All Voices ({voicesList.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterLang('us')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filterLang === 'us'
                ? 'bg-[#5E72E4] text-white shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            US English
          </button>
          <button
            type="button"
            onClick={() => setFilterLang('uk')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filterLang === 'uk'
                ? 'bg-[#5E72E4] text-white shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            UK English
          </button>
          <button
            type="button"
            onClick={() => setFilterLang('global')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filterLang === 'global'
                ? 'bg-[#5E72E4] text-white shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            Global
          </button>
        </div>

        {/* Scrollable Voice List */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2 min-h-[160px] max-h-[300px]">
          {filteredVoices.map((v) => {
            const isSelected =
              currentURI === v.voiceURI ||
              (!currentURI && v.isDefault) ||
              (!currentURI && filteredVoices[0]?.voiceURI === v.voiceURI);
            const isPreviewing = previewingURI === v.voiceURI;

            return (
              <div
                key={v.voiceURI}
                onClick={() => handleSelectVoice(v)}
                className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#5E72E4] bg-[#5E72E4]/5 dark:bg-[#5E72E4]/15 shadow-sm'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-800/40'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0 pr-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-[#5E72E4] text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : <Radio className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-sm font-semibold truncate ${
                          isSelected
                            ? 'text-[#5E72E4] dark:text-[#825ee4]'
                            : 'text-neutral-900 dark:text-white'
                        }`}
                      >
                        {v.displayName}
                      </p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700/60">
                        {v.region}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                      {v.tag}
                    </p>
                  </div>
                </div>

                {/* Preview sample button */}
                <button
                  type="button"
                  onClick={(e) => handleTogglePreview(v, e)}
                  title={isPreviewing ? 'Stop Preview' : 'Listen to Voice Sample'}
                  className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold shrink-0 transition-all ${
                    isPreviewing
                      ? 'bg-rose-500 text-white shadow-xs animate-pulse'
                      : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200'
                  }`}
                >
                  {isPreviewing ? (
                    <>
                      <Square className="w-3 h-3 fill-current" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-current" />
                      <span>Sample</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Tone and Speed Adjustment Footer */}
        <div className="px-5 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/90 space-y-4">
          {/* Pacing Speed Presets */}
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#5E72E4]" />
                Narration Speed
              </span>
              <span className="font-bold text-[#5E72E4]">{currentRate}x</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[0.85, 1.0, 1.15, 1.25].map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => handleSpeedChange(speed)}
                  className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    currentRate === speed
                      ? 'bg-[#5E72E4] border-[#5E72E4] text-white shadow-xs'
                      : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  }`}
                >
                  {speed === 0.85
                    ? 'Gentle'
                    : speed === 1.0
                    ? '1.0x Normal'
                    : speed === 1.15
                    ? '1.15x'
                    : '1.25x Brisk'}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Tone Pitch */}
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#84CC16]" />
                Voice Pitch Tone
              </span>
              <span className="font-bold text-emerald-600 dark:text-[#84CC16]">
                {currentPitch < 1.0 ? 'Deep & Warm' : currentPitch > 1.0 ? 'High & Bright' : 'Balanced'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { pitch: 0.9, label: 'Deep / Warm' },
                { pitch: 1.0, label: 'Natural' },
                { pitch: 1.1, label: 'Bright / Gentle' },
              ].map(({ pitch, label }) => (
                <button
                  key={pitch}
                  type="button"
                  onClick={() => handlePitchChange(pitch)}
                  className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    Math.abs(currentPitch - pitch) < 0.05
                      ? 'bg-[#84CC16] border-[#84CC16] text-neutral-900 shadow-xs'
                      : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Done CTA */}
          <button
            type="button"
            onClick={() => {
              nativeSpeech.stopPreview();
              closeVoiceSelector();
            }}
            className="w-full py-2.5 rounded-xl bg-[#5E72E4] hover:bg-[#4b5ec9] text-white font-bold text-sm shadow-md shadow-[#5E72E4]/25 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            Apply Narrator Voice
          </button>
        </div>
      </div>
    </div>
  );
};
