import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { DictionaryEntry } from '../models/types.js';
import './dialect-badge.js';

@customElement('result-card')
export class ResultCard extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .card {
      background: #faf7ef;
      border: 1px solid #d3c7b5;
      border-radius: 8px;
      padding: 16px 20px;
      transition: box-shadow 0.15s;
    }
    .card:hover {
      box-shadow: 0 2px 10px rgba(50, 30, 10, 0.08);
    }
    .header {
      display: flex;
      align-items: baseline;
      gap: 8px;
      flex-wrap: wrap;
    }
    .japanese {
      font-size: 18px;
      font-weight: 700;
      color: #1c1814;
    }
    .reading {
      font-size: 13px;
      color: #9e8e7e;
    }
    .pos {
      font-size: 11px;
      color: #9e8e7e;
      background: #ebe4d8;
      padding: 1px 6px;
      border-radius: 3px;
    }
    .ainu {
      margin-top: 8px;
    }
    .ainu-latin {
      font-size: 22px;
      font-weight: 700;
      color: #1d3557;
      letter-spacing: 0.01em;
    }
    .ainu-kana {
      font-size: 14px;
      color: #6b5f50;
      margin-left: 8px;
    }
    .definition {
      margin-top: 6px;
      font-size: 14px;
      color: #4a3f34;
    }
    .example {
      margin-top: 8px;
      padding: 8px 12px;
      background: #ebe4d8;
      border-radius: 6px;
      font-size: 13px;
      line-height: 1.6;
    }
    .example-ainu {
      color: #1d3557;
      font-weight: 500;
    }
    .example-ja {
      color: #6b5f50;
    }
    .meta {
      margin-top: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .notes {
      font-size: 12px;
      color: #9e8e7e;
      font-style: italic;
    }
  `;

  @property({ attribute: false }) entry!: DictionaryEntry;

  protected updated() {
    if (this.entry) {
      this.style.viewTransitionName = `entry-${this.entry.id}`;
    }
  }

  render() {
    const e = this.entry;
    return html`
      <div class="card">
        <div class="header">
          <span class="japanese">${e.japanese}</span>
          <span class="reading">${e.reading}</span>
          ${e.pos ? html`<span class="pos">${e.pos}</span>` : null}
        </div>
        <div class="ainu">
          <span class="ainu-latin">${e.ainu_latin}</span>
          <span class="ainu-kana">${e.ainu_kana}</span>
        </div>
        ${e.definition ? html`<div class="definition">${e.definition}</div>` : null}
        ${e.example_ainu ? html`
          <div class="example">
            <div class="example-ainu">${e.example_ainu}</div>
            ${e.example_ja ? html`<div class="example-ja">${e.example_ja}</div>` : null}
          </div>
        ` : null}
        <div class="meta">
          ${e.dialect ? html`<dialect-badge .dialect=${e.dialect}></dialect-badge>` : null}
          ${e.notes ? html`<span class="notes">${e.notes}</span>` : null}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'result-card': ResultCard;
  }
}
