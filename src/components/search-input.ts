import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import './camera-ocr.js';

export type SearchDirection = 'ja-to-ainu' | 'ainu-to-ja';
export type SearchMode = 'word' | 'sentence';

@customElement('search-input')
export class SearchInput extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .modes {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-bottom: 10px;
    }
    .mode-btn {
      padding: 5px 12px;
      border: 1px solid #d3c7b5;
      border-radius: 6px;
      background: #faf7ef;
      font-size: 12px;
      font-family: inherit;
      color: #9e8e7e;
      cursor: pointer;
      transition: all 0.15s;
    }
    .mode-btn[aria-pressed="true"] {
      background: #1c1814;
      border-color: #1c1814;
      color: #f2ece0;
      font-weight: 600;
    }
    .direction {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 12px;
    }
    .dir-btn {
      padding: 6px 14px;
      border: 1px solid #d3c7b5;
      border-radius: 6px;
      background: #faf7ef;
      font-size: 13px;
      font-family: inherit;
      color: #6b5f50;
      cursor: pointer;
      transition: all 0.15s;
    }
    .dir-btn[aria-pressed="true"] {
      background: #1d3557;
      border-color: #1d3557;
      color: #f2ece0;
      font-weight: 600;
    }
    .wrapper {
      position: relative;
    }
    input, textarea {
      width: 100%;
      padding: 14px 16px 14px 44px;
      border: 1px solid #d3c7b5;
      border-radius: 10px;
      font-size: 16px;
      font-family: inherit;
      background: #faf7ef;
      color: #1c1814;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
      box-sizing: border-box;
    }
    textarea {
      resize: vertical;
      min-height: 80px;
      line-height: 1.5;
    }
    input:focus, textarea:focus {
      border-color: #1d3557;
      box-shadow: 0 0 0 3px rgba(29, 53, 87, 0.1);
    }
    input::placeholder, textarea::placeholder {
      color: #c0b0a0;
    }
    .icon {
      position: absolute;
      left: 14px;
      top: 16px;
      color: #c0b0a0;
      pointer-events: none;
      font-size: 18px;
    }
    .input-row {
      display: flex;
      gap: 8px;
      align-items: flex-start;
    }
    .input-row .wrapper {
      flex: 1;
    }
  `;

  @property() direction: SearchDirection = 'ja-to-ainu';
  @property() mode: SearchMode = 'word';
  @state() private _timer: ReturnType<typeof setTimeout> | null = null;
  @state() private _currentValue = '';
  private _isComposing = false;
  private _lastSearchedValue = '';

  private _onCompositionStart() {
    this._isComposing = true;
  }

  private _onCompositionEnd(e: CompositionEvent) {
    this._isComposing = false;
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    const value = target.value;
    this._currentValue = value;
    if (this._timer) clearTimeout(this._timer);
    this._timer = setTimeout(() => {
      this._emitSearch(value);
    }, this.mode === 'sentence' ? 500 : 300);
  }

  private _onInput(e: Event) {
    if (this._isComposing) return;
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    const value = target.value;
    this._currentValue = value;
    if (this._timer) clearTimeout(this._timer);
    this._timer = setTimeout(() => {
      this._emitSearch(value);
    }, this.mode === 'sentence' ? 500 : 300);
  }

  private _setDirection(dir: SearchDirection) {
    this.direction = dir;
    if (this._currentValue) {
      this._emitSearch(this._currentValue);
    }
  }

  private _setMode(mode: SearchMode) {
    this.mode = mode;
    this._currentValue = '';
    if (this._timer) clearTimeout(this._timer);
    this.dispatchEvent(
      new CustomEvent('mode-change', { detail: mode, bubbles: true, composed: true }),
    );
  }

  private _emitSearch(value: string) {
    if (value === this._lastSearchedValue) return;
    this._lastSearchedValue = value;
    this.dispatchEvent(
      new CustomEvent('search', {
        detail: { query: value, direction: this.direction, mode: this.mode },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _onOcrResult(e: CustomEvent<string>) {
    const text = e.detail;
    this._currentValue = text;
    this._emitSearch(text);
    this.requestUpdate();
  }

  private get _placeholder() {
    if (this.mode === 'sentence') {
      return '日本語の文を入力 (例: 水を飲みたい)';
    }
    return this.direction === 'ja-to-ainu'
      ? '日本語を入力 (例: 水、熊、食べる)'
      : 'Ainu word (e.g. wakka, ワッカ)';
  }

  render() {
    const isJa = this.direction === 'ja-to-ainu';
    const isWord = this.mode === 'word';

    return html`
      <div class="modes">
        <button class="mode-btn" aria-pressed=${isWord ? 'true' : 'false'}
          @click=${() => this._setMode('word')}>単語検索</button>
        <button class="mode-btn" aria-pressed=${!isWord ? 'true' : 'false'}
          @click=${() => this._setMode('sentence')}>文章変換</button>
      </div>

      ${isWord ? html`
        <div class="direction">
          <button class="dir-btn" aria-pressed=${isJa ? 'true' : 'false'}
            @click=${() => this._setDirection('ja-to-ainu')}
          >日本語 → アイヌ語</button>
          <button class="dir-btn" aria-pressed=${!isJa ? 'true' : 'false'}
            @click=${() => this._setDirection('ainu-to-ja')}
          >アイヌ語 → 日本語</button>
        </div>
      ` : null}

      <div class="input-row">
        <div class="wrapper">
          <span class="icon">&#x1F50D;</span>
          ${this.mode === 'sentence'
            ? html`<textarea
                placeholder=${this._placeholder}
                .value=${this._currentValue}
                @input=${this._onInput}
                @compositionstart=${this._onCompositionStart}
                @compositionend=${this._onCompositionEnd}
              ></textarea>`
            : html`<input
                type="text"
                placeholder=${this._placeholder}
                .value=${this._currentValue}
                @input=${this._onInput}
                @compositionstart=${this._onCompositionStart}
                @compositionend=${this._onCompositionEnd}
                autofocus
              />`
          }
        </div>
        <camera-ocr @ocr-result=${this._onOcrResult}></camera-ocr>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'search-input': SearchInput;
  }
}
