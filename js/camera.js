// 책놀이네컷 (Chaeknori 4-Cuts) Camera & Photo Input Engine
// FHD 1080p 고화질 웹캠 스트리밍 및 모바일/파일 업로드 지원
class ChaeknoriCamera {
    constructor(videoElement) {
        this.video = videoElement;
        this.stream = null;
        this.currentDeviceId = null;
        this.isMirrored = true;
        this.devices = [];
        this.facingMode = 'user'; // 'user' (전면/웹캠) or 'environment' (후면)
    }

    async getDevices() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                return [];
            }
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.devices = devices.filter(d => d.kind === 'videoinput');
            return this.devices;
        } catch (err) {
            console.error('카메라 디바이스 목록 조회 실패:', err);
            return [];
        }
    }

    async startCamera(preferredDeviceId = null) {
        if (this.stream) {
            this.stopCamera();
        }

        const devices = await this.getDevices();
        let targetId = preferredDeviceId;

        if (!targetId && devices.length > 0) {
            // 외장 웹캠 또는 USB 카메라 우선 탐색
            const extCam = devices.find(d => 
                d.label.toLowerCase().includes('usb') || 
                d.label.toLowerCase().includes('webcam') ||
                d.label.toLowerCase().includes('c920') ||
                d.label.toLowerCase().includes('c7000')
            );
            targetId = extCam ? extCam.deviceId : devices[0].deviceId;
        }

        const constraints = {
            audio: false,
            video: {
                width: { ideal: 1920, min: 1280 },
                height: { ideal: 1080, min: 720 },
                frameRate: { ideal: 30 }
            }
        };

        if (targetId) {
            constraints.video.deviceId = { exact: targetId };
        } else {
            constraints.video.facingMode = this.facingMode;
        }

        try {
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.stream;
            await this.video.play();
            this.currentDeviceId = targetId;
            this.updateMirror();
            return { success: true, deviceId: targetId };
        } catch (err) {
            console.warn('FHD 고해상도 카메라 연결 실패, 기본 옵션으로 재시도:', err);
            try {
                this.stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: this.facingMode },
                    audio: false
                });
                this.video.srcObject = this.stream;
                await this.video.play();
                this.updateMirror();
                return { success: true, deviceId: null };
            } catch (fallbackErr) {
                console.error('카메라 권한 거부 또는 디바이스 없음:', fallbackErr);
                return { success: false, error: fallbackErr.name || fallbackErr.message };
            }
        }
    }

    switchCameraFacing() {
        this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
        this.isMirrored = (this.facingMode === 'user');
        return this.startCamera();
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
            if (this.video) {
                this.video.srcObject = null;
            }
        }
    }

    toggleMirror() {
        this.isMirrored = !this.isMirrored;
        this.updateMirror();
        return this.isMirrored;
    }

    updateMirror() {
        if (!this.video) return;
        this.video.style.transform = this.isMirrored ? 'scaleX(-1)' : 'scaleX(1)';
    }

    // 현재 카메라 비디오 프레임을 304:407 프레임 규격으로 정확히 센터 크롭하여 고해상도 캡처
    capturePhoto() {
        if (!this.video || !this.stream) {
            throw new Error('카메라 스트림이 준비되지 않았습니다.');
        }

        const vW = this.video.videoWidth || 1280;
        const vH = this.video.videoHeight || 720;

        // 책놀이네컷 슬롯 종횡비 (304 / 407 ≈ 0.7469)
        const targetAspect = 304 / 407;
        const videoAspect = vW / vH;

        let srcX = 0, srcY = 0, srcW = vW, srcH = vH;

        if (videoAspect > targetAspect) {
            // 비디오가 더 가로로 넓은 경우 (일반 웹캠 16:9 또는 4:3) -> 좌우를 자르고 세로 전체 사용
            srcH = vH;
            srcW = vH * targetAspect;
            srcX = (vW - srcW) / 2;
            srcY = 0;
        } else {
            // 비디오가 더 세로로 긴 경우 -> 상하를 자르고 가로 전체 사용
            srcW = vW;
            srcH = vW / targetAspect;
            srcX = 0;
            srcY = (vH - srcH) / 2;
        }

        const outW = Math.round(srcW);
        const outH = Math.round(srcH);

        const canvas = document.createElement('canvas');
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext('2d');

        if (this.isMirrored) {
            ctx.translate(outW, 0);
            ctx.scale(-1, 1);
        }

        // 뷰파인더(object-fit: cover)와 100% 동일하게 잘라내어 캔버스에 그리기
        ctx.drawImage(this.video, srcX, srcY, srcW, srcH, 0, 0, outW, outH);
        return canvas.toDataURL('image/jpeg', 0.95);
    }

    // 파일 객체(File)를 DataURL로 읽어오는 헬퍼
    static readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            if (!file || !file.type.startsWith('image/')) {
                reject(new Error('이미지 파일만 업로드할 수 있습니다.'));
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
        });
    }
}

window.ChaeknoriCamera = ChaeknoriCamera;
