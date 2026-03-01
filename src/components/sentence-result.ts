import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { SentenceWord } from '../models/types.js';

@customElement('sentence-result')
export class SentenceResult extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .container {
      background: #faf7ef;
      border: 1px solid #d3c7b5;
      border-radius: 10px;
      padding: 20px;
    }
    .label {
      font-size: 11px;
      font-weight: 600;
      color: #9e8e7e;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }
    .ainu-line {
      font-size: 20px;
      font-weight: 700;
      color: #1d3557;
      line-height: 1.6;
      margin-bottom: 16px;
      word-spacing: 0.15em;
    }
    .ainu-word {
      cursor: default;
    }
    .ainu-word.found {
      border-bottom: 2px solid rgba(29, 53, 87, 0.25);
    }
    .ainu-word.not-found {
      color: #c0b0a0;
      border-bottom: 2px dashed #d3c7b5;
    }
    .word-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .word-chip {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      padding: 6px 10px;
      border-radius: 6px;
      background: #ebe4d8;
      border: 1px solid #d3c7b5;
      min-width: 48px;
      transition: background 0.15s;
    }
    .word-chip.found {
      background: #e6eef6;
      border-color: #b8cfe4;
    }
    .word-chip.not-found {
      opacity: 0.5;
    }
    .chip-ja {
      font-size: 14px;
      font-weight: 600;
      color: #1c1814;
    }
    .chip-arrow {
      font-size: 10px;
      color: #c0b0a0;
      margin: 2px 0;
    }
    .chip-ainu {
      font-size: 13px;
      font-weight: 600;
      color: #1d3557;
    }
    .chip-kana {
      font-size: 10px;
      color: #9e8e7e;
    }
    .chip-pos {
      font-size: 9px;
      color: #b0a090;
      margin-top: 2px;
    }
    .chip-miss {
      font-size: 11px;
      color: #c0b0a0;
    }
    .stats {
      margin-top: 12px;
      font-size: 12px;
      color: #9e8e7e;
    }
  `;

  @property({ attribute: false }) words: SentenceWord[] = [];

  render() {
    if (this.words.length === 0) return null;

    const foundWords = this.words.filter((w) => w.entry);
    const ainuSentence = this.words
      .map((w) => (w.entry ? w.entry.ainu_latin : '___'))
      .join(' ');

    return html`
      <div class="container">
        <div class="label">Ainu translation</div>
        <div class="ainu-line">
          ${this.words.map(
            (w) => html`<span class="ainu-word ${w.entry ? 'found' : 'not-found'}"
              >${w.entry ? w.entry.ainu_latin : `[${w.surface}]`}</span
            >${' '}`,
          )}
        </div>

        <div class="label">Word-by-word</div>
        <div class="word-grid">
          ${this.words.map((w) =>
            w.entry
              ? html`
                  <div class="word-chip found">
                    <span class="chip-ja">${w.surface}</span>
                    <span class="chip-arrow">&darr;</span>
                    <span class="chip-ainu">${w.entry.ainu_latin}</span>
                    <span class="chip-kana">${w.entry.ainu_kana}</span>
                    ${w.entry.pos ? html`<span class="chip-pos">${w.entry.pos}</span>` : null}
                  </div>
                `
              : html`
                  <div class="word-chip not-found">
                    <span class="chip-ja">${w.surface}</span>
                    <span class="chip-miss">?</span>
                  </div>
                `,
          )}
        </div>

        <div class="stats">
          ${foundWords.length} / ${this.words.length} 語が変換されました
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sentence-result': SentenceResult;
  }
}
