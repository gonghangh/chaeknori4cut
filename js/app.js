// 책놀이네컷 (Chaeknori 4-Cuts) Application Core Controller
document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // 1. App State
    // ----------------------------------------------------
    const state = {
        currentStep: 'home', // 'home' | 'shooting' | 'edit' | 'result'
        selectedTheme: 'chaeknori_classic',
        customMaskUrl: null,
        photos: [null, null, null, null],
        currentSlotIndex: 0,
        isCountingDown: false,
        timerSeconds: 5,
        activeFilter: 'normal',
        stickers: [], // { id, type, imgSrc, emoji, text, x, y, size, rotation, color }
        customText: '',
        showDate: true,
        printMode: 'a4', // 'a4' | '4x6'
        kioskMode: false,
        isAudioPlaying: false
    };

    // Helper Instances
    const audio = window.chaeknoriAudio;
    const camera = new ChaeknoriCamera(document.getElementById('cameraVideo'));
    const frameRenderer = new ChaeknoriFrameRenderer();

    // DOM Elements
    const elements = {
        // Steps
        homeStep: document.getElementById('homeStep'),
        shootingStep: document.getElementById('shootingStep'),
        editStep: document.getElementById('editStep'),
        resultStep: document.getElementById('resultStep'),

        // Nav
        navBrandBtn: document.getElementById('navBrandBtn'),
        btnAudioToggle: document.getElementById('btnAudioToggle'),
        audioIcon: document.getElementById('audioIcon'),
        btnKioskToggle: document.getElementById('btnKioskToggle'),
        btnFullscreen: document.getElementById('btnFullscreen'),

        // Home
        btnStartShoot: document.getElementById('btnStartShoot'),
        bulkUploadInput: document.getElementById('bulkUploadInput'),
        customFrameInput: document.getElementById('customFrameInput'),
        themeCardsContainer: document.getElementById('themeCardsContainer'),
        heroFrameImg: document.getElementById('heroFrameImg'),
        catMascotBadge: document.getElementById('catMascotBadge'),
        appleMascotImg: document.getElementById('appleMascotImg'),

        // Shooting
        cameraVideo: document.getElementById('cameraVideo'),
        shutterFlash: document.getElementById('shutterFlash'),
        countdownOverlay: document.getElementById('countdownOverlay'),
        countdownText: document.getElementById('countdownText'),
        currentCutBadge: document.getElementById('currentCutBadge'),
        btnToggleMirror: document.getElementById('btnToggleMirror'),
        btnSwitchCam: document.getElementById('btnSwitchCam'),
        btnShutterTrigger: document.getElementById('btnShutterTrigger'),
        btnTimerToggle: document.getElementById('btnTimerToggle'),
        timerSecLabel: document.getElementById('timerSecLabel'),
        slotsCountText: document.getElementById('slotsCountText'),
        slotItems: document.querySelectorAll('.slot-item'),
        btnGoEdit: document.getElementById('btnGoEdit'),
        btnRetakeAll: document.getElementById('btnRetakeAll'),
        shootingUploadInput: document.getElementById('shootingUploadInput'),

        // Edit
        interactiveWrap: document.getElementById('interactiveWrap'),
        editorCanvas: document.getElementById('editorCanvas'),
        stickerOverlayLayer: document.getElementById('stickerOverlayLayer'),
        filtersGrid: document.getElementById('filtersGrid'),
        stickersPalette: document.getElementById('stickersPalette'),
        btnClearStickers: document.getElementById('btnClearStickers'),
        phraseChips: document.getElementById('phraseChips'),
        inputCustomPhrase: document.getElementById('inputCustomPhrase'),
        chkShowDate: document.getElementById('chkShowDate'),
        btnBackToShooting: document.getElementById('btnBackToShooting'),
        btnCompleteEdit: document.getElementById('btnCompleteEdit'),

        // Result
        resultImg: document.getElementById('resultImg'),
        optA4Sheet: document.getElementById('optA4Sheet'),
        optSingleCard: document.getElementById('optSingleCard'),
        btnPrintNow: document.getElementById('btnPrintNow'),
        btnDownloadPng: document.getElementById('btnDownloadPng'),
        qrCanvas: document.getElementById('qrCanvas'),
        btnRestartAll: document.getElementById('btnRestartAll'),
        printContainer: document.getElementById('printContainer')
    };

    // ----------------------------------------------------
    // 2. Step Navigator
    // ----------------------------------------------------
    function goToStep(stepName) {
        state.currentStep = stepName;
        [elements.homeStep, elements.shootingStep, elements.editStep, elements.resultStep].forEach(el => {
            el.classList.remove('active');
        });

        if (stepName === 'home') {
            elements.homeStep.classList.add('active');
            camera.stopCamera();
        } else if (stepName === 'shooting') {
            elements.shootingStep.classList.add('active');
            camera.startCamera().then(res => {
                if (!res.success) {
                    alert('카메라를 열 수 없습니다. 대신 [파일 올리기]로 사진을 업로드해 보세요!');
                }
            });
            updateShootingSidebar();
        } else if (stepName === 'edit') {
            elements.editStep.classList.add('active');
            camera.stopCamera();
            renderEditorCanvas();
        } else if (stepName === 'result') {
            elements.resultStep.classList.add('active');
            renderFinalResult();
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ----------------------------------------------------
    // 3. Falling Leaves Ambient Animation
    // ----------------------------------------------------
    function initLeafParticles() {
        const canvas = document.getElementById('leafCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        });

        const leaves = [];
        const leafCount = 24;
        const colors = [
            'rgba(82, 183, 136, 0.45)',
            'rgba(116, 198, 157, 0.4)',
            'rgba(149, 213, 178, 0.35)',
            'rgba(245, 159, 0, 0.35)',   // 가을 단풍 노랑
            'rgba(217, 4, 41, 0.25)'    // 포인트 사과빛
        ];

        for (let i = 0; i < leafCount; i++) {
            leaves.push({
                x: Math.random() * width,
                y: Math.random() * height - height,
                size: 8 + Math.random() * 14,
                speedY: 0.8 + Math.random() * 1.5,
                speedX: (Math.random() - 0.5) * 1.2,
                rotation: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                sway: Math.random() * 10
            });
        }

        function drawLeaf(ctx, x, y, size, rotation, color) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation * Math.PI / 180);
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(0, -size);
            ctx.bezierCurveTo(size * 0.7, -size * 0.5, size * 0.7, size * 0.5, 0, size);
            ctx.bezierCurveTo(-size * 0.7, size * 0.5, -size * 0.7, -size * 0.5, 0, -size);
            ctx.fill();
            ctx.restore();
        }

        function animate() {
            ctx.clearRect(0, 0, width, height);
            leaves.forEach(l => {
                l.y += l.speedY;
                l.x += l.speedX + Math.sin(l.sway += 0.02) * 0.5;
                l.rotation += l.rotSpeed;

                if (l.y > height + 20) {
                    l.y = -20;
                    l.x = Math.random() * width;
                }
                drawLeaf(ctx, l.x, l.y, l.size, l.rotation, l.color);
            });
            requestAnimationFrame(animate);
        }

        animate();
    }

    // ----------------------------------------------------
    // 4. Audio & Mascots Interaction
    // ----------------------------------------------------
    function initMascotsAndAudio() {
        elements.btnAudioToggle.addEventListener('click', () => {
            state.isAudioPlaying = !state.isAudioPlaying;
            if (state.isAudioPlaying) {
                audio.startForestAmbience();
                elements.audioIcon.textContent = '🔊';
                elements.btnAudioToggle.classList.add('btn-forest');
                elements.btnAudioToggle.classList.remove('btn-soft');
            } else {
                audio.stopForestAmbience();
                elements.audioIcon.textContent = '🎵';
                elements.btnAudioToggle.classList.add('btn-soft');
                elements.btnAudioToggle.classList.remove('btn-forest');
            }
        });

        // 책냥이 클릭 시 야옹 소리
        elements.catMascotBadge.addEventListener('click', () => {
            audio.playCatMeow();
            elements.catMascotBadge.style.transform = 'scale(1.25) rotate(15deg)';
            setTimeout(() => {
                elements.catMascotBadge.style.transform = '';
            }, 300);
        });

        // 사과 마스코트 클릭 시
        elements.appleMascotImg.addEventListener('click', () => {
            audio.playClick();
            audio.playForestMelody();
            elements.appleMascotImg.style.transform = 'scale(1.15) rotate(-10deg)';
            setTimeout(() => {
                elements.appleMascotImg.style.transform = '';
            }, 300);
        });

        // 9:16 키오스크 모드
        elements.btnKioskToggle.addEventListener('click', () => {
            state.kioskMode = !state.kioskMode;
            document.body.classList.toggle('kiosk-mode', state.kioskMode);
            audio.playClick();
        });

        // 전체화면
        elements.btnFullscreen.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
            } else {
                document.exitFullscreen().catch(() => {});
            }
        });

        elements.navBrandBtn.addEventListener('click', () => {
            if (confirm('처음 화면으로 돌아갈까요? (진행 중인 사진은 초기화될 수 있습니다)')) {
                goToStep('home');
            }
        });
    }

    // ----------------------------------------------------
    // 5. Theme Selector Rendering
    // ----------------------------------------------------
    function renderThemes() {
        elements.themeCardsContainer.innerHTML = '';
        const themes = frameRenderer.themes;

        Object.keys(themes).forEach(key => {
            const t = themes[key];
            const card = document.createElement('div');
            card.className = `theme-card ${state.selectedTheme === key ? 'active' : ''}`;
            card.innerHTML = `
                <div class="thumb-wrap">
                    <img src="${t.thumbSrc}" alt="${t.name}">
                </div>
                <div class="theme-info">
                    <h4>${t.name}</h4>
                    <p>${t.subtitle}</p>
                </div>
            `;

            card.addEventListener('click', () => {
                audio.playClick();
                state.selectedTheme = key;
                state.customMaskUrl = null;
                document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                elements.heroFrameImg.src = t.thumbSrc;
            });

            elements.themeCardsContainer.appendChild(card);
        });

        // 커스텀 프레임 파일 업로드 핸들러
        elements.customFrameInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const dataUrl = await ChaeknoriCamera.readFileAsDataURL(file);
            state.selectedTheme = 'custom';
            state.customMaskUrl = dataUrl;
            elements.heroFrameImg.src = dataUrl;
            document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
            alert('🎨 커스텀 프레임이 성공적으로 로드되었습니다!');
        });
    }

    // ----------------------------------------------------
    // 6. Camera & Shooting Flow
    // ----------------------------------------------------
    function initShootingEngine() {
        elements.btnStartShoot.addEventListener('click', () => {
            audio.playForestMelody();
            goToStep('shooting');
        });

        // 다중 파일 직접 업로드 (홈화면 및 촬영 사이드바)
        [elements.bulkUploadInput, elements.shootingUploadInput].forEach(inp => {
            inp.addEventListener('change', async (e) => {
                const files = Array.from(e.target.files).slice(0, 4);
                if (files.length === 0) return;
                audio.playPageFlip();

                for (let i = 0; i < files.length; i++) {
                    const dataUrl = await ChaeknoriCamera.readFileAsDataURL(files[i]);
                    state.photos[i] = dataUrl;
                }
                updateShootingSidebar();
                alert(`📁 ${files.length}장의 사진이 로드되었습니다!`);
                if (state.photos.every(p => p !== null)) {
                    elements.btnGoEdit.disabled = false;
                }
                if (state.currentStep === 'home') {
                    goToStep('shooting');
                }
            });
        });

        // 카메라 설정 버튼들
        elements.btnToggleMirror.addEventListener('click', () => {
            audio.playClick();
            camera.toggleMirror();
        });

        elements.btnSwitchCam.addEventListener('click', () => {
            audio.playClick();
            camera.switchCameraFacing();
        });

        // 타이머 토글 (3초 -> 5초 -> 10초)
        elements.btnTimerToggle.addEventListener('click', () => {
            audio.playClick();
            if (state.timerSeconds === 3) state.timerSeconds = 5;
            else if (state.timerSeconds === 5) state.timerSeconds = 10;
            else state.timerSeconds = 3;
            elements.timerSecLabel.textContent = `${state.timerSeconds}초`;
        });

        // 메인 셔터 버튼
        elements.btnShutterTrigger.addEventListener('click', () => {
            triggerShootCountdown();
        });

        // 4컷 꾸미러 가기
        elements.btnGoEdit.addEventListener('click', () => {
            audio.playForestMelody();
            goToStep('edit');
        });

        // 전체 다시 찍기
        elements.btnRetakeAll.addEventListener('click', () => {
            if (confirm('모든 컷을 초기화하고 처음부터 다시 찍으시겠습니까?')) {
                audio.playClick();
                state.photos = [null, null, null, null];
                state.currentSlotIndex = 0;
                updateShootingSidebar();
            }
        });

        // 개별 슬롯 다시 찍기
        elements.slotItems.forEach((slotEl, idx) => {
            const retakeBtn = slotEl.querySelector('.btn-retake-slot');
            retakeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                audio.playClick();
                state.currentSlotIndex = idx;
                state.photos[idx] = null;
                updateShootingSidebar();
            });
        });
    }

    function triggerShootCountdown() {
        if (state.isCountingDown) return;
        state.isCountingDown = true;
        elements.btnShutterTrigger.style.pointerEvents = 'none';

        // 아직 비어있는 슬롯을 찾거나 현재 슬롯 사용
        if (state.photos[state.currentSlotIndex] !== null) {
            const nextEmpty = state.photos.findIndex(p => p === null);
            if (nextEmpty !== -1) {
                state.currentSlotIndex = nextEmpty;
            }
        }

        let remain = state.timerSeconds;
        elements.countdownOverlay.classList.add('show');
        elements.countdownText.textContent = remain;
        audio.playCountdownBeep(remain);

        const countTimer = setInterval(() => {
            remain--;
            if (remain > 0) {
                elements.countdownText.textContent = remain;
                audio.playCountdownBeep(remain);
            } else {
                clearInterval(countTimer);
                elements.countdownOverlay.classList.remove('show');
                executeCapture();
            }
        }, 1000);
    }

    function executeCapture() {
        // 셔터음 & 플래시
        audio.playShutter();
        elements.shutterFlash.classList.add('flash-anim');
        setTimeout(() => {
            elements.shutterFlash.classList.remove('flash-anim');
        }, 350);

        try {
            const capturedData = camera.capturePhoto();
            state.photos[state.currentSlotIndex] = capturedData;

            // 다음 슬롯 자동 지정
            if (state.currentSlotIndex < 3) {
                state.currentSlotIndex++;
            }

            updateShootingSidebar();

            // 4컷 모두 완료되었는지 확인
            const filledCount = state.photos.filter(p => p !== null).length;
            if (filledCount === 4) {
                audio.playForestMelody();
                elements.btnGoEdit.disabled = false;
                // 1초 뒤 안내
                setTimeout(() => {
                    if (confirm('🎉 4컷 촬영이 모두 완료되었습니다! 꾸미기 화면으로 이동할까요?')) {
                        goToStep('edit');
                    }
                }, 800);
            }
        } catch (err) {
            console.error('캡처 에러:', err);
            alert('사진 캡처 중 오류가 발생했습니다.');
        } finally {
            state.isCountingDown = false;
            elements.btnShutterTrigger.style.pointerEvents = 'all';
        }
    }

    function updateShootingSidebar() {
        const filledCount = state.photos.filter(p => p !== null).length;
        elements.slotsCountText.textContent = `${filledCount} / 4`;
        elements.btnGoEdit.disabled = (filledCount === 0);

        elements.slotItems.forEach((el, idx) => {
            const img = el.querySelector('img');
            const placeholder = el.querySelector('.slot-placeholder');

            if (state.photos[idx]) {
                img.src = state.photos[idx];
                img.style.display = 'block';
                placeholder.style.display = 'none';
                el.classList.add('filled');
            } else {
                img.style.display = 'none';
                placeholder.style.display = 'block';
                el.classList.remove('filled');
            }

            if (state.currentSlotIndex === idx) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });

        elements.currentCutBadge.textContent = `📸 ${state.currentSlotIndex + 1}번째 컷 준비 (총 4컷)`;
    }

    // ----------------------------------------------------
    // 7. Decoration & Editor Engine
    // ----------------------------------------------------
    function initEditorEngine() {
        // 탭 전환
        document.querySelectorAll('.editor-tabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                audio.playClick();
                document.querySelectorAll('.editor-tabs .tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

                btn.classList.add('active');
                const tab = btn.dataset.tab;
                if (tab === 'filters') document.getElementById('tabPanelFilters').classList.add('active');
                if (tab === 'stickers') document.getElementById('tabPanelStickers').classList.add('active');
                if (tab === 'texts') document.getElementById('tabPanelTexts').classList.add('active');
            });
        });

        // 필터 8종 렌더링
        const filterList = [
            { id: 'normal', name: '맑은 원본', color: '#ffffff' },
            { id: 'bloom', name: '햇살 뽀샤시', color: '#fff9db' },
            { id: 'forest', name: '싱그런 숲', color: '#d8f3dc' },
            { id: 'warm', name: '티타임', color: '#ffe8cc' },
            { id: 'cool', name: '청량 호수', color: '#e7f5ff' },
            { id: 'sepia', name: '빈티지 서재', color: '#f4ede4' },
            { id: 'mono', name: '클래식 흑백', color: '#adb5bd' },
            { id: 'film', name: '필름 감성', color: '#dee2e6' }
        ];

        elements.filtersGrid.innerHTML = '';
        filterList.forEach(f => {
            const btn = document.createElement('button');
            btn.className = `filter-btn ${state.activeFilter === f.id ? 'active' : ''}`;
            btn.innerHTML = `
                <div class="sample-color" style="background: ${f.color}; border: 1px solid #cbd5e1;"></div>
                <span>${f.name}</span>
            `;
            btn.addEventListener('click', () => {
                audio.playClick();
                state.activeFilter = f.id;
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderEditorCanvas();
            });
            elements.filtersGrid.appendChild(btn);
        });

        // 스티커 팔레트 렌더링
        const stickerList = [
            // 시그니처 캐릭터
            { type: 'img', imgSrc: 'assets/cat_character.png', label: '책냥이' },
            { type: 'img', imgSrc: 'assets/apple_reader.png', label: '사과아이' },
            // 숲속 자연
            { type: 'emoji', emoji: '🍃' },
            { type: 'emoji', emoji: '🌿' },
            { type: 'emoji', emoji: '🍀' },
            { type: 'emoji', emoji: '🌰' },
            { type: 'emoji', emoji: '🍄' },
            { type: 'emoji', emoji: '🍎' },
            // 독서 & 감성
            { type: 'emoji', emoji: '📚' },
            { type: 'emoji', emoji: '📖' },
            { type: 'emoji', emoji: '☕' },
            { type: 'emoji', emoji: '👓' },
            { type: 'emoji', emoji: '✨' },
            { type: 'emoji', emoji: '💚' },
            { type: 'emoji', emoji: '🌸' },
            { type: 'emoji', emoji: '⭐' }
        ];

        elements.stickersPalette.innerHTML = '';
        stickerList.forEach(st => {
            const itemBtn = document.createElement('div');
            itemBtn.className = 'sticker-item-btn';
            if (st.type === 'img') {
                itemBtn.innerHTML = `<img src="${st.imgSrc}" alt="${st.label}">`;
            } else {
                itemBtn.textContent = st.emoji;
            }

            itemBtn.addEventListener('click', () => {
                audio.playClick();
                addStickerToEditor(st);
            });
            elements.stickersPalette.appendChild(itemBtn);
        });

        // 스티커 모두 지우기
        elements.btnClearStickers.addEventListener('click', () => {
            if (confirm('추가한 모든 스티커를 지우시겠습니까?')) {
                audio.playClick();
                state.stickers = [];
                elements.stickerOverlayLayer.innerHTML = '';
            }
        });

        // 문구 칩 클릭
        elements.phraseChips.querySelectorAll('.phrase-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                audio.playClick();
                state.customText = chip.dataset.text;
                elements.inputCustomPhrase.value = state.customText;
                renderEditorCanvas();
            });
        });

        // 직접 텍스트 입력
        elements.inputCustomPhrase.addEventListener('input', (e) => {
            state.customText = e.target.value;
            renderEditorCanvas();
        });

        // 날짜 표기 토글
        elements.chkShowDate.addEventListener('change', (e) => {
            audio.playClick();
            state.showDate = e.target.checked;
            renderEditorCanvas();
        });

        // 이전 / 다음 버튼
        elements.btnBackToShooting.addEventListener('click', () => {
            audio.playClick();
            goToStep('shooting');
        });

        elements.btnCompleteEdit.addEventListener('click', () => {
            audio.playForestMelody();
            goToStep('result');
        });
    }

    // 스티커를 에디터 레이어에 추가 (인터랙티브 드래그 가능)
    function addStickerToEditor(stDef) {
        const wrapRect = elements.interactiveWrap.getBoundingClientRect();
        const newSticker = {
            id: 'stk_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            type: stDef.type,
            imgSrc: stDef.imgSrc || null,
            emoji: stDef.emoji || null,
            // 724 x 1024 좌표계 기준 중앙 (362, 512)
            x: 362,
            y: 512,
            size: stDef.type === 'img' ? 120 : 64,
            rotation: 0
        };

        state.stickers.push(newSticker);
        renderStickerDom(newSticker);
    }

    function renderStickerDom(stk) {
        const dom = document.createElement('div');
        dom.className = 'placed-sticker';
        dom.id = stk.id;

        const baseW = 724;
        const baseH = 1024;

        if (stk.type === 'img') {
            dom.innerHTML = `
                <img src="${stk.imgSrc}" style="width: 100%; height: 100%; object-fit: contain; pointer-events: none;">
                <button class="btn-del-stk" title="삭제">✕</button>
            `;
        } else {
            dom.innerHTML = `
                <div style="font-size: ${stk.size * 0.45}px; line-height: 1; pointer-events: none;">${stk.emoji}</div>
                <button class="btn-del-stk" title="삭제">✕</button>
            `;
        }

        // 스티커 위치/크기 업데이트 함수
        function updateStyle() {
            const wrapW = elements.interactiveWrap.clientWidth;
            const wrapH = elements.interactiveWrap.clientHeight;
            const scaleX = wrapW / baseW;
            const scaleY = wrapH / baseH;

            const curX = stk.x * scaleX;
            const curY = stk.y * scaleY;
            const curSize = stk.size * scaleX;

            dom.style.width = `${curSize}px`;
            dom.style.height = `${curSize}px`;
            dom.style.left = `${curX - curSize / 2}px`;
            dom.style.top = `${curY - curSize / 2}px`;
            dom.style.transform = `rotate(${stk.rotation}deg)`;
        }

        updateStyle();
        window.addEventListener('resize', updateStyle);

        // 삭제 버튼
        dom.querySelector('.btn-del-stk').addEventListener('click', (e) => {
            e.stopPropagation();
            audio.playClick();
            state.stickers = state.stickers.filter(s => s.id !== stk.id);
            dom.remove();
        });

        // 드래그 앤 드롭 구현 (Mouse & Touch)
        let isDragging = false;
        let startX, startY;
        let startStkX, startStkY;

        function onPointerDown(e) {
            isDragging = true;
            document.querySelectorAll('.placed-sticker').forEach(el => el.classList.remove('selected'));
            dom.classList.add('selected');

            const pX = e.touches ? e.touches[0].clientX : e.clientX;
            const pY = e.touches ? e.touches[0].clientY : e.clientY;
            startX = pX;
            startY = pY;
            startStkX = stk.x;
            startStkY = stk.y;

            window.addEventListener('pointermove', onPointerMove);
            window.addEventListener('pointerup', onPointerUp);
        }

        function onPointerMove(e) {
            if (!isDragging) return;
            const pX = e.touches ? e.touches[0].clientX : e.clientX;
            const pY = e.touches ? e.touches[0].clientY : e.clientY;

            const wrapW = elements.interactiveWrap.clientWidth;
            const scaleX = wrapW / baseW;

            const dx = (pX - startX) / scaleX;
            const dy = (pY - startY) / scaleX;

            stk.x = Math.max(30, Math.min(baseW - 30, startStkX + dx));
            stk.y = Math.max(30, Math.min(baseH - 30, startStkY + dy));
            updateStyle();
        }

        function onPointerUp() {
            isDragging = false;
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        }

        dom.addEventListener('pointerdown', onPointerDown);
        elements.stickerOverlayLayer.appendChild(dom);
    }

    // 에디터 캔버스 리렌더링
    async function renderEditorCanvas() {
        const rendered = await frameRenderer.render(state.photos, {
            theme: state.selectedTheme,
            filter: state.activeFilter,
            customText: state.customText,
            showDate: state.showDate,
            customMaskUrl: state.customMaskUrl
        });

        const canvas = elements.editorCanvas;
        canvas.width = rendered.width;
        canvas.height = rendered.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(rendered, 0, 0);
    }

    // ----------------------------------------------------
    // 8. Result & Print Engine
    // ----------------------------------------------------
    let currentRenderedCanvas = null;

    async function renderFinalResult() {
        // 스티커까지 모두 Canvas에 포함하여 초고화질(1448x2048) 최종 합성
        currentRenderedCanvas = await frameRenderer.render(state.photos, {
            theme: state.selectedTheme,
            filter: state.activeFilter,
            customText: state.customText,
            showDate: state.showDate,
            stickers: state.stickers,
            customMaskUrl: state.customMaskUrl
        });

        const dataUrl = currentRenderedCanvas.toDataURL('image/png');
        elements.resultImg.src = dataUrl;

        // 로컬 서버가 실행 중일 경우 photos/ 폴더에 자동 백업 저장
        try {
            fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mainImage: dataUrl })
            }).then(r => r.json()).then(res => {
                if (res && res.success) {
                    console.log('로컬 사진 보관 완료:', res.timestamp);
                }
            }).catch(() => {
                // 정적 웹 모드에서는 무시
            });
        } catch (e) {}

        // QR 코드 생성 (스마트폰 저장 편의)
        renderQrCode();
    }

    function renderQrCode() {
        const qrCanvas = elements.qrCanvas;
        const currentUrl = window.location.href;
        if (window.drawQRCodeToCanvas) {
            window.drawQRCodeToCanvas(currentUrl, qrCanvas, 130);
        }
    }

    function initResultEngine() {
        // 인쇄 옵션 토글 (A4 4장 모아찍기 vs 4x6 단독)
        elements.optA4Sheet.addEventListener('click', () => {
            audio.playClick();
            state.printMode = 'a4';
            elements.optA4Sheet.classList.add('active');
            elements.optSingleCard.classList.remove('active');
        });

        elements.optSingleCard.addEventListener('click', () => {
            audio.playClick();
            state.printMode = '4x6';
            elements.optSingleCard.classList.add('active');
            elements.optA4Sheet.classList.remove('active');
        });

        // 바로 인쇄하기
        elements.btnPrintNow.addEventListener('click', async () => {
            audio.playClick();
            if (!currentRenderedCanvas) return;

            elements.printContainer.innerHTML = '';
            document.body.classList.remove('print-mode-a4', 'print-mode-4x6');

            if (state.printMode === 'a4') {
                document.body.classList.add('print-mode-a4');
                const a4Canvas = await frameRenderer.renderA4Sheet(currentRenderedCanvas);
                const a4Img = document.createElement('img');
                a4Img.src = a4Canvas.toDataURL('image/png');
                elements.printContainer.appendChild(a4Img);
            } else {
                document.body.classList.add('print-mode-4x6');
                const singleImg = document.createElement('img');
                singleImg.src = currentRenderedCanvas.toDataURL('image/png');
                elements.printContainer.appendChild(singleImg);
            }

            setTimeout(() => {
                window.print();
            }, 300);
        });

        // 고화질 PNG 이미지 파일 다운로드
        elements.btnDownloadPng.addEventListener('click', () => {
            audio.playClick();
            if (!currentRenderedCanvas) return;
            const link = document.createElement('a');
            const now = new Date();
            const dateStr = now.getFullYear() +
                String(now.getMonth() + 1).padStart(2, '0') +
                String(now.getDate()).padStart(2, '0') + '_' +
                String(now.getHours()).padStart(2, '0') +
                String(now.getMinutes()).padStart(2, '0');
            link.download = `책놀이네컷_${dateStr}.png`;
            link.href = currentRenderedCanvas.toDataURL('image/png');
            link.click();
        });

        // 새 책놀이 시작하기
        elements.btnRestartAll.addEventListener('click', () => {
            if (confirm('새로운 책놀이네컷을 촬영하시겠습니까?')) {
                audio.playForestMelody();
                state.photos = [null, null, null, null];
                state.currentSlotIndex = 0;
                state.stickers = [];
                elements.stickerOverlayLayer.innerHTML = '';
                goToStep('home');
            }
        });
    }

    // ----------------------------------------------------
    // 9. Keyboard Shortcuts (Kiosk & Space to shoot)
    // ----------------------------------------------------
    window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;

        if (e.code === 'Space') {
            if (state.currentStep === 'shooting' && !state.isCountingDown) {
                e.preventDefault();
                triggerShootCountdown();
            }
        } else if (e.code === 'KeyR') {
            if (state.currentStep === 'shooting') {
                if (state.currentSlotIndex > 0) {
                    state.currentSlotIndex--;
                    state.photos[state.currentSlotIndex] = null;
                    updateShootingSidebar();
                }
            }
        }
    });

    // ----------------------------------------------------
    // 10. Bootstrap Everything
    // ----------------------------------------------------
    initLeafParticles();
    initMascotsAndAudio();
    renderThemes();
    initShootingEngine();
    initEditorEngine();
    initResultEngine();
});
