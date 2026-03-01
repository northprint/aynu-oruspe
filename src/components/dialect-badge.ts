import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

// Ainu-inspired natural palette: each dialect color drawn from Hokkaido landscapes
const DIALECT_COLORS: Record<string, string> = {
  '沙流': '#1d3557', // 深藍 — traditional Ainu attus fabric indigo (Saru River)
  '千歳': '#2d5c3e', // 深緑 — Hokkaido old-growth forest (Chitose)
  '静内': '#7c5020', // 黄褐 — Shizunai horse-country ochre earth
  '幌別': '#4a2e6e', // 紫紺 — Horobetsu mountain twilight purple
  '十勝': '#7c2820', // 鉄錆 — Tokachi volcanic soil rust-red
  '釧路': '#1a5568', // 深青 — Kushiro wetland & Pacific ocean teal
  '樺太': '#6e2048', // 深紅紫 — Sakhalin dark pine-rose
};

@customElement('dialect-badge')
export class DialectBadge extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
    }
    span {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.02em;
    }
  `;

  @property() dialect = '';

  render() {
    if (!this.dialect) return null;
    const color = DIALECT_COLORS[this.dialect] ?? '#6b7280';
    return html`
      <span style="color:${color};background:${color}14;border:1px solid ${color}30">
        ${this.dialect}
      </span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'dialect-badge': DialectBadge;
  }
}
