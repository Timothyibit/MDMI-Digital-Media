// MDMI Discipleship Ministry Theme Tokens

export const mdmiTheme = {
  COLORS: {
    DEFAULT: '#172B4D',
    PRIMARY: '#5E72E4',
    BRAND_GREEN: '#84CC16',
    SECONDARY: '#F7FAFC',
    LABEL: '#FE2472',
    INFO: '#11CDEF',
    ERROR: '#F5365C',
    SUCCESS: '#2DCE89',
    WARNING: '#FB6340',
    MUTED: '#ADB5BD',
    INPUT: '#DCDCDC',
    INPUT_SUCCESS: '#7BDEB2',
    INPUT_ERROR: '#FCB3A4',
    ACTIVE: '#5E72E4',
    BUTTON_COLOR: '#5E72E4',
    PLACEHOLDER: '#9FA5AA',
    SWITCH_ON: '#5E72E4',
    SWITCH_OFF: '#D4D9DD',
    GRADIENT_START: '#5E72E4',
    GRADIENT_END: '#84CC16',
    PRICE_COLOR: '#EAD5FB',
    BORDER_COLOR: '#E7E7E7',
    BLOCK: '#E7E7E7',
    ICON: '#172B4D',
    HEADER: '#525F7F',
    BORDER: '#CAD1D7',
    WHITE: '#FFFFFF',
    BLACK: '#000000',
    TEXT: '#525F7F',
  },
  SIZES: {
    BASE: 16,
    FONT: 16,
    OPACITY: 0.8,
  },
} as const;

export const argonTheme = mdmiTheme; // Backwards-compatible alias for existing imports
export default mdmiTheme;
