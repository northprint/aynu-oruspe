import { css } from 'lit';

export const sharedStyles = css`
  :host {
    /* Ainu-inspired color palette
     * bg/surface: warm cream of natural attus (elm bark cloth)
     * accent: deep indigo of traditional Ainu fabric dye
     * neutrals: birch bark and Hokkaido earth tones
     */
    --color-bg: #f2ece0;
    --color-surface: #faf7ef;
    --color-text: #1c1814;
    --color-text-secondary: #6b5f50;
    --color-border: #d3c7b5;
    --color-accent: #1d3557;
    --color-accent-light: #e6eef6;
    --radius: 8px;
    --shadow: 0 1px 4px rgba(50, 30, 10, 0.08);
    --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif;
  }
`;
