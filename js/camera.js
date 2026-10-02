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

    // 현재 카메라 비디오 프레임을 캔버스로 고해상도 캡처
    capturePhoto() {
        if (!this.video || !this.stream) {
            throw new Error('카메라 스트림이 준비되지 않았습니다.');
        }

        const vW = this.video.videoWidth || 1280;
        const vH = this.video.videoHeight || 720;

        const canvas = document.createElement('canvas');
        canvas.width = vW;
        canvas.height = vH;
        const ctx = canvas.getContext('2d');

        if (this.isMirrored) {
            ctx.translate(vW, 0);
            ctx.scale(-1, 1);
        }

        ctx.drawImage(this.video, 0, 0, vW, vH);
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
