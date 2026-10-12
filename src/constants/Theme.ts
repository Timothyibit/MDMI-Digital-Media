// MDMI Discipleship Ministry Theme Tokens (from official ministry logo: Discipleship Green & Cross Red)

export const mdmiTheme = {
  COLORS: {
    DEFAULT: '#172B4D',
    PRIMARY: '#65A30D',
    BRAND_GREEN: '#84CC16',
    CROSS_RED: '#DC2626',
    SECONDARY: '#F7FAFC',
    LABEL: '#DC2626',
    INFO: '#84CC16',
    ERROR: '#DC2626',
    SUCCESS: '#65A30D',
    WARNING: '#EA580C',
    MUTED: '#ADB5BD',
    INPUT: '#DCDCDC',
    INPUT_SUCCESS: '#84CC16',
    INPUT_ERROR: '#FCA5A5',
    ACTIVE: '#65A30D',
    BUTTON_COLOR: '#65A30D',
    PLACEHOLDER: '#9FA5AA',
    SWITCH_ON: '#84CC16',
    SWITCH_OFF: '#D4D9DD',
    GRADIENT_START: '#84CC16',
    GRADIENT_END: '#65A30D',
    PRICE_COLOR: '#DC2626',
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
