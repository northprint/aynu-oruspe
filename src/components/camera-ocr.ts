import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { createWorker, Worker as TesseractWorker } from 'tesseract.js';

type OcrState = 'idle' | 'camera' | 'processing';

@customElement('camera-ocr')
export class CameraOcr extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
    }

    .camera-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border: 1px solid #e5e5e5;
      border-radius: 10px;
      background: #fff;
      cursor: pointer;
      color: #888;
      font-size: 20px;
      transition: all 0.15s;
      flex-shrink: 0;
    }
    .camera-btn:hover {
      border-color: #2563eb;
      color: #2563eb;
    }

    .overlay {
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: #000;
      display: flex;
      flex-direction: column;
    }

    .camera-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: rgba(0, 0, 0, 0.8);
      color: #fff;
      z-index: 1;
    }
    .camera-header span {
      font-size: 15px;
      font-weight: 600;
    }
    .header-btn {
      background: none;
      border: none;
      color: #fff;
      font-size: 14px;
      font-family: inherit;
      cursor: pointer;
      padding: 6px 12px;
      border-radius: 6px;
    }
    .header-btn:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .camera-body {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;
    }

    video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    canvas {
      display: none;
    }

    .camera-controls {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
      background: rgba(0, 0, 0, 0.8);
      gap: 24px;
    }

    .shutter-btn {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      border: 4px solid #fff;
      background: transparent;
      cursor: pointer;
      position: relative;
      transition: all 0.15s;
    }
    .shutter-btn::after {
      content: '';
      position: absolute;
      inset: 4px;
      border-radius: 50%;
      background: #fff;
      transition: all 0.15s;
    }
    .shutter-btn:hover::after {
      background: #e5e5e5;
    }
    .shutter-btn:active::after {
      transform: scale(0.9);
    }

    .processing-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #fff;
      gap: 16px;
    }
    .processing-spinner {
      width: 36px;
      height: 36px;
      border: 3px solid rgba(255, 255, 255, 0.2);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .processing-text {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.8);
    }

    .file-btn {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.7);
      font-size: 13px;
      font-family: inherit;
      cursor: pointer;
      padding: 8px 12px;
      border-radius: 6px;
    }
    .file-btn:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.1);
    }

    input[type="file"] {
      display: none;
    }
  `;

  @state() private _state: OcrState = 'idle';
  @state() private _progress = '';

  private _stream: MediaStream | null = null;
  private _worker: TesseractWorker | null = null;
  private _workerReady: Promise<TesseractWorker> | null = null;

  private _getWorker(): Promise<TesseractWorker> {
    if (this._worker) return Promise.resolve(this._worker);
    if (this._workerReady) return this._workerReady;

    this._workerReady = createWorker('jpn+eng').then((w) => {
      this._worker = w;
      this._workerReady = null;
      return w;
    });
    return this._workerReady;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._stopCamera();
    this._worker?.terminate();
    this._worker = null;
  }

  private async _openCamera() {
    this._state = 'camera';
    await this.updateComplete;

    try {
      this._stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      const video = this.shadowRoot!.querySelector('video')!;
      video.srcObject = this._stream;
    } catch {
      this._state = 'idle';
      this._openFilePicker();
    }
  }

  private _stopCamera() {
    if (this._stream) {
      this._stream.getTracks().forEach((t) => t.stop());
      this._stream = null;
    }
  }

  private _close() {
    this._stopCamera();
    this._state = 'idle';
    this._progress = '';
  }

  private _capture() {
    const video = this.shadowRoot!.querySelector('video')!;
    const canvas = this.shadowRoot!.querySelector('canvas')!;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);

    this._stopCamera();
    this._preprocessAndOcr(canvas);
  }

  private _openFilePicker() {
    const input = this.shadowRoot!.querySelector<HTMLInputElement>('input[type="file"]');
    input?.click();
  }

  private _onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = '';

    const img = new Image();
    img.onload = () => {
      const canvas = this.shadowRoot!.querySelector('canvas')!;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(img.src);
      this._preprocessAndOcr(canvas);
    };
    img.src = URL.createObjectURL(file);
  }

  /** Grayscale + contrast enhancement for better OCR accuracy. */
  private _preprocessImage(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Convert to grayscale
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }

    // Simple adaptive thresholding: binarize to black/white
    // This dramatically improves OCR on photos of printed text
    const threshold = this._computeOtsuThreshold(data);
    for (let i = 0; i < data.length; i += 4) {
      const val = data[i] >= threshold ? 255 : 0;
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
    }

    ctx.putImageData(imageData, 0, 0);
  }

  /** Otsu's method for automatic threshold selection. */
  private _computeOtsuThreshold(data: Uint8ClampedArray): number {
    const histogram = new Array<number>(256).fill(0);
    let totalPixels = 0;
    for (let i = 0; i < data.length; i += 4) {
      histogram[data[i]]++;
      totalPixels++;
    }

    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * histogram[i];

    let sumB = 0;
    let wB = 0;
    let maxVariance = 0;
    let bestThreshold = 128;

    for (let t = 0; t < 256; t++) {
      wB += histogram[t];
      if (wB === 0) continue;
      const wF = totalPixels - wB;
      if (wF === 0) break;

      sumB += t * histogram[t];
      const mB = sumB / wB;
      const mF = (sum - sumB) / wF;
      const variance = wB * wF * (mB - mF) * (mB - mF);

      if (variance > maxVariance) {
        maxVariance = variance;
        bestThreshold = t;
      }
    }

    return bestThreshold;
  }

  private async _preprocessAndOcr(canvas: HTMLCanvasElement) {
    this._state = 'processing';
    this._progress = '画像を処理しています...';

    // Preprocess for better accuracy
    this._preprocessImage(canvas);

    this._progress = '文字を認識しています...';

    try {
      const worker = await this._getWorker();

      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), 'image/png'),
      );

      const { data } = await worker.recognize(blob);

      // Clean up: remove control chars, excessive whitespace, and common OCR noise
      const text = data.text
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')  // control chars
        .replace(/[|\\{}[\]<>~`^]/g, '')                       // common OCR noise symbols
        .replace(/\n{3,}/g, '\n\n')                            // excessive newlines
        .replace(/[ \t]{2,}/g, ' ')                            // excessive spaces
        .trim();

      if (text) {
        this.dispatchEvent(
          new CustomEvent('ocr-result', {
            detail: text,
            bubbles: true,
            composed: true,
          }),
        );
      }
    } catch (err) {
      console.error('OCR error:', err);
      // If worker is broken, discard it so next attempt creates a fresh one
      this._worker?.terminate();
      this._worker = null;
    } finally {
      this._close();
    }
  }

  render() {
    if (this._state === 'idle') {
      return html`
        <button class="camera-btn" @click=${this._openCamera} title="カメラで読み取り">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </button>
        <canvas></canvas>
        <input type="file" accept="image/*" @change=${this._onFileSelected} />
      `;
    }

    return html`
      <div class="overlay">
        <div class="camera-header">
          <button class="header-btn" @click=${this._close}>キャンセル</button>
          <span>テキスト読み取り</span>
          <button class="header-btn" @click=${this._openFilePicker}>写真を選択</button>
        </div>
        <div class="camera-body">
          ${this._state === 'camera'
            ? html`<video autoplay playsinline muted></video>`
            : null
          }
          ${this._state === 'processing'
            ? html`
              <div class="processing-overlay">
                <div class="processing-spinner"></div>
                <div class="processing-text">${this._progress}</div>
              </div>
            `
            : null
          }
        </div>
        ${this._state === 'camera'
          ? html`
            <div class="camera-controls">
              <button class="file-btn" @click=${this._openFilePicker}>ファイル</button>
              <button class="shutter-btn" @click=${this._capture} title="撮影"></button>
              <div style="width:60px"></div>
            </div>
          `
          : null
        }
      </div>
      <canvas></canvas>
      <input type="file" accept="image/*" @change=${this._onFileSelected} />
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'camera-ocr': CameraOcr;
  }
}
