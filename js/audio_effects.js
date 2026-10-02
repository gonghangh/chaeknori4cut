// 책놀이네컷 (Chaeknori 4-Cuts) Forest Audio Engine
// Web Audio API & Web Speech Synthesis 기반 숲속 감성 사운드 시스템
class ChaeknoriAudioEngine {
    constructor() {
        this.ctx = null;
        this.voiceEnabled = true;
        this.muted = false;
        this.forestBgmActive = false;
        this.bgmTimer = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // 싱그럽고 맑은 숲속 실로폰 멜로디 (도-미-솔-라-높은도)
    playForestMelody() {
        if (this.muted) return;
        this.init();
        const notes = [523.25, 659.25, 783.99, 880.00, 1046.50]; // C5, E5, G5, A5, C6
        const now = this.ctx.currentTime;

        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.15);

            gain.gain.setValueAtTime(0, now + idx * 0.15);
            gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.15 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.15 + 1.2);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + idx * 0.15);
            osc.stop(now + idx * 0.15 + 1.3);
        });
    }

    // 숲속 새 지저귐 효과음 (Bird Chirp)
    playBirdChirp() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;

        const chirps = [
            { fStart: 2800, fEnd: 3600, tStart: 0, dur: 0.08 },
            { fStart: 3700, fEnd: 2900, tStart: 0.09, dur: 0.09 },
            { fStart: 3100, fEnd: 4200, tStart: 0.22, dur: 0.12 }
        ];

        chirps.forEach(c => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(c.fStart, now + c.tStart);
            osc.frequency.exponentialRampToValueAtTime(c.fEnd, now + c.tStart + c.dur);

            gain.gain.setValueAtTime(0, now + c.tStart);
            gain.gain.linearRampToValueAtTime(0.07, now + c.tStart + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + c.tStart + c.dur);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + c.tStart);
            osc.stop(now + c.tStart + c.dur + 0.05);
        });
    }

    // 귀여운 책냥이 야옹 소리 (Cat Meow)
    playCatMeow() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.18);
        osc.frequency.exponentialRampToValueAtTime(550, now + 0.45);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.08);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.52);
    }

    // 책장 넘기는 소리 (Page Flip)
    playPageFlip() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const dur = 0.2;
        const bufferSize = Math.floor(this.ctx.sampleRate * dur);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * (i / bufferSize));
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, now);
        filter.Q.setValueAtTime(2.0, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        source.start(now);
    }

    // 카운트다운 비프음 (3, 2, 1) & 한국어 음성 안내
    playCountdownBeep(count) {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // 1초 전 마지막 카운트는 더 높은 상큼한 톤
        const freq = count === 1 ? 932.33 : 622.25; 
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.22);

        // 음성 카운트다운 ("셋", "둘", "하나")
        if (this.voiceEnabled && window.speechSynthesis) {
            try {
                window.speechSynthesis.cancel();
                const text = count === 1 ? "하나" : count === 2 ? "둘" : count === 3 ? "셋" : String(count);
                const utter = new SpeechSynthesisUtterance(text);
                utter.rate = 1.35;
                utter.pitch = 1.15;
                utter.lang = 'ko-KR';
                window.speechSynthesis.speak(utter);
            } catch (e) {
                // Speech synthesis fallback
            }
        }
    }

    // 카메라 셔터음 (기계식 찰칵 사운드)
    playShutter() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;

        const bufferSize = Math.floor(this.ctx.sampleRate * 0.15);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.025));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1200, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);

        // Shutter snap secondary click
        setTimeout(() => {
            if (this.muted) return;
            const clickNow = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const clickGain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(700, clickNow);
            osc.frequency.exponentialRampToValueAtTime(150, clickNow + 0.05);

            clickGain.gain.setValueAtTime(0.25, clickNow);
            clickGain.gain.exponentialRampToValueAtTime(0.001, clickNow + 0.05);

            osc.connect(clickGain);
            clickGain.connect(this.ctx.destination);

            osc.start(clickNow);
            osc.stop(clickNow + 0.06);
        }, 80);
    }

    // 버튼 클릭 경쾌한 톡 소리
    playClick() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.06);
    }

    // 숲속 앰비언스 (주기적인 부드러운 산새 & 바람소리)
    startForestAmbience() {
        if (this.forestBgmActive) return;
        this.forestBgmActive = true;
        this.init();
        this.playBirdChirp();

        this.bgmTimer = setInterval(() => {
            if (!this.forestBgmActive || this.muted) return;
            if (Math.random() > 0.4) {
                this.playBirdChirp();
            }
        }, 8000);
    }

    stopForestAmbience() {
        this.forestBgmActive = false;
        if (this.bgmTimer) {
            clearInterval(this.bgmTimer);
            this.bgmTimer = null;
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.muted) {
            this.stopForestAmbience();
        }
        return this.muted;
    }
}

window.chaeknoriAudio = new ChaeknoriAudioEngine();
