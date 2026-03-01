import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { DictionaryEntry } from '../models/types.js';
import './result-card.js';

@customElement('result-list')
export class ResultList extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .empty {
      text-align: center;
      padding: 40px 20px;
      color: #9e8e7e;
      font-size: 14px;
    }
    .count {
      font-size: 12px;
      color: #9e8e7e;
      margin-bottom: 8px;
    }
  `;

  @property({ attribute: false }) results: DictionaryEntry[] = [];
  @property({ type: Boolean }) hasSearched = false;

  render() {
    if (!this.hasSearched) return null;

    if (this.results.length === 0) {
      return html`<div class="empty">見つかりませんでした</div>`;
    }

    return html`
      <div class="count">${this.results.length}件の結果</div>
      <div class="list">
        ${this.results.map(
          (entry) => html`<result-card .entry=${entry}></result-card>`,
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'result-list': ResultList;
  }
}
