import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { DictionaryEntry, SentenceWord } from '../models/types.js';
import { getDB } from '../db/duckdb-init.js';
import { searchDictionaryFuzzy, lookupLemmas, type SearchDirection } from '../db/dictionary-queries.js';
import { tokenize, getTokenizer } from '../morpho/tokenizer.js';
import type { SearchMode } from './search-input.js';
import './search-input.js';
import './result-list.js';
import './sentence-result.js';

@customElement('app-shell')
export class AppShell extends LitElement {
  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      background: #f2ece0;
    }
    .container {
      max-width: 640px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    header {
      text-align: center;
      margin-bottom: 32px;
    }
    h1 {
      font-size: 28px;
      font-weight: 800;
      color: #1c1814;
      margin: 0 0 6px;
      letter-spacing: -0.02em;
    }
    .title-divider {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 6px;
    }
    .title-ornament {
      width: 32px;
      height: 1px;
      background: linear-gradient(to right, transparent, #1d3557);
      opacity: 0.4;
    }
    .title-ornament.right {
      background: linear-gradient(to left, transparent, #1d3557);
    }
    .title-diamond {
      width: 5px;
      height: 5px;
      background: #1d3557;
      transform: rotate(45deg);
      opacity: 0.5;
    }
    .subtitle {
      font-size: 13px;
      color: #9e8e7e;
      letter-spacing: 0.04em;
    }
    .loading {
      text-align: center;
      padding: 60px 20px;
      color: #9e8e7e;
      font-size: 14px;
    }
    .spinner {
      display: inline-block;
      width: 24px;
      height: 24px;
      border: 2px solid #d3c7b5;
      border-top-color: #1d3557;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
      margin-bottom: 12px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .error {
      text-align: center;
      padding: 20px;
      color: #7c2820;
      font-size: 14px;
    }
    .search-area {
      margin-bottom: 24px;
    }
    footer {
      text-align: center;
      margin-top: 48px;
      padding: 16px 0;
    }
    .credits-btn {
      background: none;
      border: none;
      font-size: 12px;
      color: #b0a090;
      cursor: pointer;
      font-family: inherit;
      padding: 4px 8px;
    }
    .credits-btn:hover {
      color: #6b5f50;
    }
    #credits-popover {
      border: 1px solid #d3c7b5;
      border-radius: 12px;
      padding: 24px 28px;
      max-width: 480px;
      box-shadow: 0 8px 30px rgba(50, 30, 10, 0.12);
      font-size: 13px;
      color: #4a3f34;
      line-height: 1.7;
      background: #faf7ef;
    }
    #credits-popover::backdrop {
      background: rgba(28, 24, 20, 0.3);
    }
    #credits-popover h3 {
      font-size: 15px;
      font-weight: 700;
      color: #1c1814;
      margin: 0 0 12px;
    }
    .source-item {
      margin-bottom: 10px;
    }
    .source-name {
      font-weight: 600;
      color: #1c1814;
    }
    .source-license {
      display: inline-block;
      font-size: 10px;
      font-weight: 600;
      padding: 1px 6px;
      border-radius: 4px;
      background: #ebe4d8;
      color: #6b5f50;
      margin-left: 4px;
    }
    .source-desc {
      color: #9e8e7e;
      font-size: 12px;
    }
    .source-desc a {
      color: #1d3557;
      text-decoration: none;
    }
    .source-desc a:hover {
      text-decoration: underline;
    }
    .close-btn {
      display: block;
      margin: 16px auto 0;
      padding: 6px 20px;
      border: 1px solid #d3c7b5;
      border-radius: 6px;
      background: #faf7ef;
      font-size: 13px;
      font-family: inherit;
      color: #6b5f50;
      cursor: pointer;
    }
    .close-btn:hover {
      background: #ebe4d8;
    }
    .results-area {
    }
  `;

  @state() private _loading = true;
  @state() private _error: string | null = null;
  @state() private _results: DictionaryEntry[] = [];
  @state() private _hasSearched = false;
  @state() private _direction: SearchDirection = 'ja-to-ainu';
  @state() private _mode: SearchMode = 'word';
  @state() private _sentenceWords: SentenceWord[] = [];

  async connectedCallback() {
    super.connectedCallback();
    try {
      await Promise.all([getDB(), getTokenizer()]);
      this._loading = false;
    } catch (err) {
      this._error = `辞書の読み込みに失敗しました: ${err}`;
      this._loading = false;
    }
  }

  private async _transition(update: () => void) {
    const el = this.shadowRoot?.querySelector('.results-area') as HTMLElement | null;
    if (!el) { update(); return; }

    // Slide out to the left
    await el.animate(
      [
        { opacity: 1, transform: 'translateX(0)' },
        { opacity: 0, transform: 'translateX(-30px)' },
      ],
      { duration: 150, easing: 'ease-in', fill: 'forwards' },
    ).finished;

    update();
    await this.updateComplete;

    // Slide in from the right
    el.animate(
      [
        { opacity: 0, transform: 'translateX(30px)' },
        { opacity: 1, transform: 'translateX(0)' },
      ],
      { duration: 200, easing: 'ease-out', fill: 'forwards' },
    );
  }

  private _onModeChange(e: CustomEvent<SearchMode>) {
    this._transition(() => {
      this._mode = e.detail;
      this._results = [];
      this._sentenceWords = [];
      this._hasSearched = false;
    });
  }

  private async _onSearch(e: CustomEvent<{ query: string; direction: SearchDirection; mode: SearchMode }>) {
    const { query, direction, mode } = e.detail;
    this._direction = direction;
    this._mode = mode;

    if (!query.trim()) {
      this._results = [];
      this._sentenceWords = [];
      this._hasSearched = false;
      return;
    }

    try {
      if (mode === 'sentence') {
        const words = await this._buildSentenceWords(query.trim());
        this._transition(() => {
          this._hasSearched = true;
          this._sentenceWords = words;
          this._results = [];
        });
      } else {
        const results = await searchDictionaryFuzzy(query.trim(), this._direction);
        this._transition(() => {
          this._hasSearched = true;
          this._sentenceWords = [];
          this._results = results;
        });
      }
    } catch (err) {
      console.error('Search error:', err);
      this._results = [];
      this._sentenceWords = [];
    }
  }

  private async _buildSentenceWords(text: string): Promise<SentenceWord[]> {
    const tokens = await tokenize(text);
    const contentTokens = tokens.filter((t) => {
      if (['助詞', '助動詞', '記号', 'フィラー'].includes(t.pos)) return false;
      if (/^[\s\p{P}]+$/u.test(t.surface)) return false;
      return true;
    });

    const lemmas = [...new Set(contentTokens.map((t) => (t.base !== '*' ? t.base : t.surface)))];
    const entryMap = await lookupLemmas(lemmas);

    return contentTokens.map((t) => {
      const lemma = t.base !== '*' ? t.base : t.surface;
      return {
        surface: t.surface,
        base: lemma,
        reading: t.reading,
        pos: t.pos,
        entry: entryMap.get(lemma) ?? null,
      };
    });
  }

  render() {
    if (this._loading) {
      return html`
        <div class="container">
          <div class="loading">
            <div class="spinner"></div>
            <div>辞書を読み込んでいます...</div>
          </div>
        </div>
      `;
    }

    if (this._error) {
      return html`
        <div class="container">
          <div class="error">${this._error}</div>
        </div>
      `;
    }

    return html`
      <div class="container">
        <header>
          <h1>aynu oruspe</h1>
          <div class="title-divider">
            <div class="title-ornament"></div>
            <div class="title-diamond"></div>
            <div class="title-ornament right"></div>
          </div>
          <div class="subtitle">日本語 ⇄ アイヌ語辞書</div>
        </header>
        <div class="search-area">
          <search-input
            @search=${this._onSearch}
            @mode-change=${this._onModeChange}
          ></search-input>
        </div>
        <div class="results-area">
          ${this._mode === 'sentence'
            ? html`<sentence-result .words=${this._sentenceWords}></sentence-result>`
            : html`<result-list
                .results=${this._results}
                .hasSearched=${this._hasSearched}
              ></result-list>`
          }
        </div>

        <footer>
          <button class="credits-btn" popovertarget="credits-popover">出典・ライセンス</button>
        </footer>

        <div id="credits-popover" popover>
          <h3>辞書データの出典</h3>
          <div class="source-item">
            <span class="source-name">NorthEuraLex / Lexibank</span>
            <span class="source-license">CC-BY-4.0</span>
            <div class="source-desc">
              Johannes Dellert et al. — NorthEuraLex 0.9<br>
              <a href="http://northeuralex.org" target="_blank" rel="noopener">northeuralex.org</a>
            </div>
          </div>
          <div class="source-item">
            <span class="source-name">NINJAL アイヌ語口承文芸コーパス</span>
            <span class="source-license">CC-BY-SA-4.0</span>
            <div class="source-desc">
              国立国語研究所 (NINJAL)<br>
              <a href="https://ainu.ninjal.ac.jp/folklore/en/" target="_blank" rel="noopener">ainu.ninjal.ac.jp</a>
            </div>
          </div>
          <div class="source-item">
            <span class="source-name">An Ainu–English–Japanese Dictionary</span>
            <span class="source-license">Public Domain</span>
            <div class="source-desc">
              John Batchelor, 1905<br>
              <a href="https://archive.org/details/anainuenglishja00batcgoog" target="_blank" rel="noopener">Internet Archive</a>
            </div>
          </div>
          <button class="close-btn" popovertarget="credits-popover" popovertargetaction="hide">閉じる</button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-shell': AppShell;
  }
}
