// 책놀이네컷 (Chaeknori 4-Cuts) Canvas High-Resolution Rendering Engine
// 300 DPI Ultra High Quality Photo Booth Frame Renderer (1448 x 2048 px)
class ChaeknoriFrameRenderer {
    constructor() {
        // 책놀이네컷 원본 724 x 1024의 2배 초고화질 규격 (1448 x 2048 px, 300 DPI 인쇄급)
        this.width = 1448;
        this.height = 2048;

        // 프레임 테마 정의
        this.themes = {
            'chaeknori_classic': {
                name: '🤍 책놀이 오리지널',
                subtitle: '클래식 화이트 시그니처 에디션',
                maskSrc: 'frames/mask_chaeknori.png',
                thumbSrc: 'frames/frame_chaeknori.png',
                bgColor: '#ffffff',
                accentColor: '#1c1c1c'
            },
            'forest_green': {
                name: '🌱 싱그런 숲속 맑음',
                subtitle: '화사한 세이지 그린 & 나뭇잎',
                maskSrc: 'frames/mask_forest_green.png',
                thumbSrc: 'frames/frame_forest_green.png',
                bgColor: '#ecf6ee',
                accentColor: '#264d30'
            },
            'woodland': {
                name: '🪵 숲속의 서재',
                subtitle: '따스한 자작나무 원목 & 크림',
                maskSrc: 'frames/mask_woodland.png',
                thumbSrc: 'frames/frame_woodland.png',
                bgColor: '#fcf8f0',
                accentColor: '#6b4e37'
            },
            'mint_breeze': {
                name: '🍃 청량한 숲 바람',
                subtitle: '상쾌한 모닝 민트 브리즈',
                maskSrc: 'frames/mask_mint_breeze.png',
                thumbSrc: 'frames/frame_mint_breeze.png',
                bgColor: '#f0f9f5',
                accentColor: '#2c5f4e'
            }
        };

        // 724 x 1024 기준 4컷 슬롯 좌표
        this.baseW = 724;
        this.baseH = 1024;
        this.slots = [
            { id: 1, x: 44, y: 61, w: 304, h: 407 },   // Cut 1 (상단 좌)
            { id: 2, x: 377, y: 132, w: 303, h: 406 }, // Cut 2 (상단 우 - 책냥이 오버레이)
            { id: 3, x: 44, y: 492, w: 304, h: 406 },  // Cut 3 (하단 좌 - 사과책 오버레이)
            { id: 4, x: 377, y: 564, w: 303, h: 406 }  // Cut 4 (하단 우)
        ];

        // 이미지 캐시
        this.imageCache = {};
    }

    // 이미지 로드 헬퍼 (캐시 적용)
    loadImage(src) {
        if (!src) return Promise.resolve(null);
        if (this.imageCache[src]) {
            return Promise.resolve(this.imageCache[src]);
        }
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                this.imageCache[src] = img;
                resolve(img);
            };
            img.onerror = () => {
                console.warn('이미지 로드 실패:', src);
                resolve(null);
            };
            img.src = src;
        });
    }

    // 4컷 사진 및 필터 적용
    async loadAndFilterPhotos(photoDataUrls, filterName) {
        const promises = photoDataUrls.map(async (dataUrl) => {
            if (!dataUrl) return null;
            const img = await this.loadImage(dataUrl);
            if (!img) return null;

            // 필터가 'normal'이면 그대로 반환
            if (!filterName || filterName === 'normal') {
                return img;
            }

            // 필터 효과를 캔버스에 적용하여 반환
            const fCanvas = document.createElement('canvas');
            fCanvas.width = img.width;
            fCanvas.height = img.height;
            const fCtx = fCanvas.getContext('2d');

            fCtx.save();
            switch (filterName) {
                case 'bloom': // 화사한 숲속 햇살 뽀샤시
                    fCtx.filter = 'brightness(1.12) contrast(1.05) saturate(1.15)';
                    break;
                case 'mono': // 클래식 흑백
                    fCtx.filter = 'grayscale(1) contrast(1.18) brightness(1.02)';
                    break;
                case 'sepia': // 빈티지 서재
                    fCtx.filter = 'sepia(0.65) contrast(1.08) brightness(0.98)';
                    break;
                case 'forest': // 싱그러운 숲 (초록빛 생기 & 감성 톤업)
                    fCtx.filter = 'contrast(1.12) saturate(1.22) hue-rotate(-8deg)';
                    break;
                case 'warm': // 따뜻한 햇살 티타임
                    fCtx.filter = 'sepia(0.25) saturate(1.2) brightness(1.06)';
                    break;
                case 'cool': // 청량한 호숫가
                    fCtx.filter = 'saturate(1.05) hue-rotate(15deg) brightness(1.04)';
                    break;
                case 'film': // 감성 필름 그레인
                    fCtx.filter = 'contrast(1.2) brightness(1.05) saturate(0.9)';
                    break;
                default:
                    fCtx.filter = 'none';
            }

            fCtx.drawImage(img, 0, 0);
            fCtx.restore();

            return fCanvas;
        });

        return Promise.all(promises);
    }

    // 4컷 사진과 옵션을 받아 최종 인쇄/다운로드용 Canvas 생성
    async render(photos, options = {}) {
        const {
            theme = 'chaeknori_classic',
            filter = 'normal',
            customText = '',
            showDate = true,
            dateText = null,
            stickers = [],
            customMaskUrl = null
        } = options;

        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        const ctx = canvas.getContext('2d');

        // 테마 설정
        const themeConfig = this.themes[theme] || this.themes['chaeknori_classic'];
        const maskUrl = customMaskUrl || themeConfig.maskSrc;

        // 배경색 채우기
        ctx.fillStyle = themeConfig.bgColor || '#ffffff';
        ctx.fillRect(0, 0, this.width, this.height);

        // 사진 로드 및 필터 적용
        const filteredPhotos = await this.loadAndFilterPhotos(photos, filter);

        // 724x1024 -> 1448x2048 스케일 팩터 (2.0)
        const scale = this.width / this.baseW;

        // 1. 4개 슬롯에 사진 렌더링 (Center Crop)
        for (let i = 0; i < this.slots.length; i++) {
            const slot = this.slots[i];
            const img = filteredPhotos[i];

            const sx = slot.x * scale;
            const sy = slot.y * scale;
            const sw = slot.w * scale;
            const sh = slot.h * scale;

            if (img) {
                ctx.save();
                // 슬롯 영역으로 정밀 클리핑
                ctx.beginPath();
                ctx.rect(sx - 1, sy - 1, sw + 2, sh + 2);
                ctx.clip();

                // Center-crop 사진 계산
                const imgAspect = img.width / img.height;
                const slotAspect = sw / sh;
                let dx, dy, dw, dh;

                if (imgAspect > slotAspect) {
                    dh = img.height;
                    dw = img.height * slotAspect;
                    dx = (img.width - dw) / 2;
                    dy = 0;
                } else {
                    dw = img.width;
                    dh = img.width / slotAspect;
                    dx = 0;
                    dy = (img.height - dh) / 2;
                }

                ctx.drawImage(img, dx, dy, dw, dh, sx, sy, sw, sh);
                ctx.restore();
            } else {
                // 빈 슬롯 안내 가이드
                ctx.save();
                ctx.fillStyle = '#f3f4f6';
                ctx.fillRect(sx, sy, sw, sh);
                ctx.fillStyle = '#9ca3af';
                ctx.font = `bold ${24 * scale}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`CUT ${i + 1}`, sx + sw / 2, sy + sh / 2);
                ctx.restore();
            }
        }

        // 2. 프레임 마스크 오버레이 합성 (고양이 & 사과 일러스트가 사진 위에 자연스럽게 덮임)
        const maskImg = await this.loadImage(maskUrl);
        if (maskImg) {
            ctx.drawImage(maskImg, 0, 0, this.width, this.height);
        }

        // 3. 커스텀 스티커 렌더링
        if (stickers && stickers.length > 0) {
            for (const st of stickers) {
                await this.drawSingleSticker(ctx, st, scale);
            }
        }

        // 4. 추가 커스텀 텍스트 렌더링 (옵션)
        if (customText && customText.trim()) {
            ctx.save();
            ctx.fillStyle = themeConfig.accentColor || '#1c1c1c';
            ctx.font = `bold ${18 * scale}px 'Pretendard', 'Noto Sans KR', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // 우측 하단 슬롯 아래 여백 또는 지정 위치
            ctx.fillText(customText, this.width / 2, this.height - 28 * scale);
            ctx.restore();
        }

        // 5. 날짜 표기 (옵션)
        if (showDate) {
            const dateStr = dateText || new Date().toISOString().slice(0, 10).replace(/-/g, '.');
            ctx.save();
            ctx.fillStyle = themeConfig.accentColor || '#1c1c1c';
            ctx.font = `bold ${11 * scale}px 'Pretendard', monospace`;
            ctx.textAlign = 'right';
            ctx.fillText(dateStr, this.width - 45 * scale, 35 * scale);
            ctx.restore();
        }

        return canvas;
    }

    // 단일 스티커 그리기
    async drawSingleSticker(ctx, st, scale) {
        ctx.save();
        const sx = st.x * scale;
        const sy = st.y * scale;
        const sSize = (st.size || 60) * scale;
        const rot = (st.rotation || 0) * Math.PI / 180;

        ctx.translate(sx, sy);
        ctx.rotate(rot);

        if (st.type === 'emoji' || st.emoji) {
            ctx.font = `${sSize}px 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(st.emoji, 0, 0);
        } else if (st.imgSrc) {
            const sImg = await this.loadImage(st.imgSrc);
            if (sImg) {
                ctx.drawImage(sImg, -sSize / 2, -sSize / 2, sSize, sSize);
            }
        } else if (st.type === 'text') {
            ctx.font = `bold ${sSize * 0.4}px 'Pretendard', sans-serif`;
            ctx.fillStyle = st.color || '#2d6a4f';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(st.text, 0, 0);
        }
        ctx.restore();
    }

    // A4 4장 모아찍기 (2x2) 인쇄용 초고화질 Canvas 생성 (A4 300 DPI: 2480 x 3508 px)
    async renderA4Sheet(rendered4CutCanvas) {
        const a4W = 2480;
        const a4H = 3508;
        const a4Canvas = document.createElement('canvas');
        a4Canvas.width = a4W;
        a4Canvas.height = a4H;
        const ctx = a4Canvas.getContext('2d');

        // 깔끔한 화이트 A4 배경
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, a4W, a4H);

        // 2x2 배치 크기 및 마진 계산
        // A4의 반(Half): W = 1240, H = 1754
        // 여백을 준 각 셀 크기:
        const cellW = a4W / 2;
        const cellH = a4H / 2;

        const cutAspect = this.width / this.height; // 1448 / 2048 = 0.707
        const targetCutH = cellH * 0.92;
        const targetCutW = targetCutH * cutAspect;

        const positions = [
            { x: cellW * 0.5, y: cellH * 0.5 },
            { x: cellW * 1.5, y: cellH * 0.5 },
            { x: cellW * 0.5, y: cellH * 1.5 },
            { x: cellW * 1.5, y: cellH * 1.5 }
        ];

        // 4장 배치
        positions.forEach((pos, idx) => {
            const drawX = pos.x - targetCutW / 2;
            const drawY = pos.y - targetCutH / 2;

            // 은은한 외곽선 (인쇄 후 가위 재단 보조)
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 2;
            ctx.strokeRect(drawX, drawY, targetCutW, targetCutH);

            ctx.drawImage(rendered4CutCanvas, drawX, drawY, targetCutW, targetCutH);
        });

        // 중앙 십자 절취선 가이드 (Dotted Cut Lines)
        ctx.save();
        ctx.strokeStyle = '#9ca3af';
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 10]);

        // 세로 가이드선
        ctx.beginPath();
        ctx.moveTo(cellW, 60);
        ctx.lineTo(cellW, a4H - 60);
        ctx.stroke();

        // 가로 가이드선
        ctx.beginPath();
        ctx.moveTo(60, cellH);
        ctx.lineTo(a4W - 60, cellH);
        ctx.stroke();

        // 중앙 가위 아이콘 및 안내 문구
        ctx.fillStyle = '#6b7280';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.setLineDash([]);
        ctx.fillText('✂ 점선을 따라 자르면 친구 4명과 함께 나눠가질 수 있어요! 🌿 책놀이네컷', cellW, cellH - 20);

        ctx.restore();

        return a4Canvas;
    }
}

window.ChaeknoriFrameRenderer = ChaeknoriFrameRenderer;
