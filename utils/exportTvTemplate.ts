import { MediaItem } from '../types';

export const deployDirectToGitHub = async (currentMedia: MediaItem[], githubToken: string) => {
    // 1. Generate formatted JSON
    const formattedPlaylist = currentMedia.map(item => ({
        title: item.title || "Maverick Broadcast",
        file: item.src,
        duration: 1800 
    }));

    const playlistJSON = JSON.stringify(formattedPlaylist, null, 2);

    // 2. Build the HTML string
    const staticHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>Librv Player – Responsive TV Player</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
    <style>
        /* ----- RESET ----- */
        * { margin: 0; padding: 0; box-sizing: border-box; user-select: none; }
        body {
            background: #0a0e1a;
            overflow-x: hidden;
            font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
            color: #eef2ff;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: flex-start;   /* allow content to flow from top */
        }

        /* ----- WEEBLY‑SAFE CENTERING WRAPPER ----- */
        .weebly-embed-wrapper {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100% !important;
            max-width: 1400px;          /* comfortable max width */
            margin: 0 auto;
            padding: 16px;
            min-height: 100vh;          /* fallback */
            min-height: 100dvh;
            flex-direction: column;
        }

        /* ----- MAIN APP CONTAINER (full width inside wrapper) ----- */
        .app-container {
            display: flex;
            flex-direction: column;
            width: 100%;
            max-width: 960px;           /* video player max size */
            background: rgba(10, 14, 26, 0.85);
            backdrop-filter: blur(4px);
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.7);
            border: 1px solid rgba(212, 175, 55, 0.15);
        }

        /* ----- TOP BAR (FIXED HEIGHT) ----- */
        .top-bar {
            flex-shrink: 0;
            height: 64px;
            background: rgba(8, 10, 26, 0.6);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(212, 175, 55, 0.25);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 24px;
            box-shadow: 0 2px 20px rgba(0,0,0,0.3);
        }
        .top-bar::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 1px;
            background: linear-gradient(90deg, transparent, #d4af37, #f59e0b, #d4af37, transparent);
        }
        .live-badge {
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(220, 38, 38, 0.15);
            padding: 6px 14px;
            border-radius: 40px;
            border-left: 2px solid #ef4444;
        }
        .live-dot {
            width: 10px;
            height: 10px;
            background: #ef4444;
            border-radius: 50%;
            animation: pulse 1.2s infinite;
            box-shadow: 0 0 6px #ef4444;
        }
        @keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.2); } 100% { opacity: 1; transform: scale(1); } }
        .live-text {
            font-weight: 800;
            font-size: clamp(0.65rem, 1.2vw, 0.9rem);
            letter-spacing: 1px;
            color: #ef4444;
            text-transform: uppercase;
        }
        .clock-section {
            font-family: 'JetBrains Mono', monospace;
            background: rgba(16, 20, 40, 0.8);
            padding: 6px 16px;
            border-radius: 32px;
            font-size: clamp(0.8rem, 1.4vw, 1.1rem);
            font-weight: 600;
            color: #f5c842;
            letter-spacing: 1px;
            border: 1px solid rgba(212, 175, 55, 0.3);
            backdrop-filter: blur(4px);
        }
        .progress-timer {
            font-size: clamp(0.65rem, 1vw, 0.85rem);
            background: rgba(16, 20, 40, 0.8);
            padding: 4px 12px;
            border-radius: 20px;
            color: #94a3b8;
            backdrop-filter: blur(4px);
        }

        /* ----- CINEMA DESKTOP (FILLS REMAINING SPACE) ----- */
        .cinema-desktop {
            flex: 1 1 auto;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
            background: radial-gradient(circle at 20% 30%, #121624, #080b14);
            min-height: 0;
            position: relative;
        }

        /* ----- HARDWARE BEZEL (ASPECT RATIO LOCKED) ----- */
        .bezel {
            width: 100%;
            max-height: 100%;
            aspect-ratio: 16 / 9;
            background: #11131f;
            border-radius: 20px;
            padding: 8px;
            box-shadow: 0 25px 40px -12px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05);
            border: 1px solid #2d3748;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .bezel::before {
            content: '';
            position: absolute;
            top: -1px;
            left: 10%;
            width: 80%;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent);
        }
        .video-container {
            position: relative;
            background: #000;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 0 0 2px #1e293b, 0 20px 35px -10px black;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        #video-player {
            width: 100%;
            height: 100%;
            object-fit: contain;
            background: black;
            display: block;
        }
        .video-overlay {
            position: absolute;
            bottom: 12px;
            left: 16px;
            right: 16px;
            display: flex;
            justify-content: space-between;
            pointer-events: none;
            background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
            padding: 16px 12px 8px;
            border-radius: 12px;
        }
        .now-playing-tag {
            background: rgba(0,0,0,0.6);
            backdrop-filter: blur(8px);
            padding: 4px 12px;
            border-radius: 40px;
            font-size: clamp(0.6rem, 1vw, 0.8rem);
            font-weight: 500;
            border-left: 3px solid #d4af37;
        }

        /* ----- HORIZONTAL GUIDE STRIP (FIXED HEIGHT, NO SHRINK) ----- */
        .guide-strip-wrapper {
            flex-shrink: 0;
            background: rgba(8, 10, 22, 0.9);
            backdrop-filter: blur(4px);
            border-top: 1px solid rgba(212, 175, 55, 0.15);
            padding: 12px 0 10px 0;
            height: 130px;
        }
        .guide-header {
            padding: 0 20px 8px 20px;
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            flex-wrap: wrap;
            gap: 8px;
        }
        .guide-header h3 {
            font-size: clamp(0.7rem, 1.2vw, 0.9rem);
            color: #d4af37;
            text-shadow: 0 0 10px rgba(212,175,55,0.2);
        }
        .low-power-toggle {
            background: #1e293b;
            border: none;
            color: #94a3b8;
            padding: 4px 12px;
            border-radius: 40px;
            font-size: clamp(0.55rem, 0.8vw, 0.7rem);
            cursor: pointer;
            transition: 0.2s;
            backdrop-filter: blur(4px);
        }
        .low-power-toggle.active {
            background: #d4af37;
            color: #0f0f1a;
            font-weight: bold;
        }
        .horizontal-scroll {
            overflow-x: auto;
            overflow-y: hidden;
            scroll-behavior: smooth;
            padding: 4px 20px;
            display: flex;
            gap: 10px;
            scrollbar-width: thin;
            height: calc(100% - 30px);
        }
        .horizontal-scroll::-webkit-scrollbar { height: 5px; }
        .horizontal-scroll::-webkit-scrollbar-track { background: #1e1f2c; border-radius: 8px; }
        .horizontal-scroll::-webkit-scrollbar-thumb { background: #d4af37; border-radius: 8px; }
        .guide-card {
            flex: 0 0 180px;
            background: rgba(21, 26, 39, 0.8);
            backdrop-filter: blur(4px);
            border-radius: 12px;
            transition: all 0.2s;
            cursor: pointer;
            border: 1px solid #2d3a5e;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        .guide-card.active {
            border: 2px solid #d4af37;
            background: rgba(30, 42, 58, 0.9);
            transform: scale(1.02);
            box-shadow: 0 8px 20px rgba(212,175,55,0.3);
        }
        .card-content {
            padding: 8px 12px;
        }
        .card-title {
            font-size: clamp(0.6rem, 0.9vw, 0.75rem);
            font-weight: 600;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: #f0f4ff;
        }
        .card-time {
            font-size: clamp(0.5rem, 0.7vw, 0.6rem);
            color: #94a3b8;
            margin-top: 4px;
        }

        /* ----- FULLSCREEN OVERLAY (XSS‑safe) ----- */
        #fullscreen-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, transparent 100%);
            padding: 20px 40px;
            z-index: 2000;
            display: none;
            pointer-events: none;
        }
        #tv-player-container:fullscreen #fullscreen-overlay {
            display: block;
        }
        #fullscreen-now, #fullscreen-next {
            font-size: clamp(0.8rem, 1.5vw, 1.2rem);
        }

        /* ----- RESPONSIVE FINE‑TUNE ----- */
        @media (max-width: 640px) {
            .top-bar { padding: 0 12px; height: 56px; }
            .bezel { padding: 4px; border-radius: 12px; }
            .guide-strip-wrapper { height: 110px; }
            .guide-card { flex: 0 0 140px; }
            .now-playing-tag { font-size: 0.6rem; padding: 2px 8px; }
            .clock-section { font-size: 0.7rem; padding: 4px 8px; }
        }
        @media (max-width: 480px) {
            .guide-card { flex: 0 0 120px; }
            .top-bar { height: 50px; }
        }
    </style>
</head>
<body>
    <!-- WEEBLY‑SAFE WRAPPER -->
    <div class="weebly-embed-wrapper">
        <div class="app-container">
            <!-- TOP BAR -->
            <div class="top-bar">
                <div class="live-badge">
                    <div class="live-dot"></div>
                    <span class="live-text">LIVE</span>
                </div>
                <div class="flex items-center gap-4">
                    <div class="progress-timer" id="progress-timer">00:00 / --:--</div>
                    <div class="clock-section" id="live-clock">--:--:--</div>
                </div>
            </div>

            <!-- CINEMA DESKTOP -->
            <div class="cinema-desktop">
                <div class="bezel">
                    <div class="video-container" id="tv-player-container">
                        <video id="video-player" autoplay muted playsinline controls preload="auto"></video>
                        <div id="fullscreen-overlay">
                            <div id="fullscreen-title">Now Playing</div>
                            <div id="fullscreen-info">
                                <div id="fullscreen-now">Loading...</div>
                                <div id="fullscreen-clock">--:--:--</div>
                                <div id="fullscreen-next">Next: --</div>
                            </div>
                        </div>
                        <div class="video-overlay">
                            <div class="now-playing-tag" id="now-playing-label">Now: <span id="current-show">---</span></div>
                            <div class="flex gap-2">
                                <button id="low-power-toggle-btn" class="low-power-toggle" title="Disable audio visualizer for low-end devices">⚡ Low-Power</button>
                                <button id="fullscreen-btn" class="low-power-toggle" style="background:#d4af37; color:#0a0e1a;">⛶ Full</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- GUIDE STRIP -->
            <div class="guide-strip-wrapper">
                <div class="guide-header">
                    <h3>📺 24h Schedule · Virtual Scroll</h3>
                    <span id="item-count-badge" class="text-xs text-gray-400"></span>
                </div>
                <div id="guide-strip" class="horizontal-scroll"></div>
            </div>
        </div>
    </div>

    <script>
        // =========================================================================
        // PLAYLIST DATA – AUTOMATICALLY INGESTED (EXACT CLONE OF SOURCE)
        // =========================================================================
        const playlist = ${playlistJSON};
        
        let fullSchedule = [];
        let hls = null;
        const videoPlayer = document.getElementById('video-player');
        let currentScheduleIndex = -1;
        let lowPowerMode = localStorage.getItem('librv_low_power') === 'true';
        let audioContext = null;
        let visualizerActive = false;
        let animationFrame = null;

        // ---------- helper: generate schedule (exact duration based) ----------
        function generate24hrSchedule() {
            let schedule = [];
            let currentSeconds = 0;
            const startOfDay = new Date();
            startOfDay.setHours(0,0,0,0);
            const MAX_SEC = 86400;
            let idx = 0;
            while (currentSeconds < MAX_SEC && idx < playlist.length * 20) {
                const item = playlist[idx % playlist.length];
                if (!item) break;
                const dur = item.duration || 1800;
                const startDate = new Date(startOfDay.getTime() + currentSeconds * 1000);
                const startFormatted = startDate.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
                schedule.push({
                    title: item.title,
                    startTime: startFormatted,
                    startSeconds: currentSeconds,
                    endSeconds: currentSeconds + dur,
                    file: item.file,
                    playlistIndex: idx % playlist.length,
                    duration: dur,
                    id: idx
                });
                currentSeconds += dur;
                idx++;
            }
            return schedule;
        }

        // ----- VIRTUAL SCROLLER for horizontal strip (only render visible + previous/next) -----
        let renderedCards = new Map();
        let activeCardId = null;
        let observer = null;
        let allItems = [];
        let container = document.getElementById('guide-strip');

        function createSkeletonCard(id) {
            const div = document.createElement('div');
            div.className = 'guide-card';
            div.dataset.id = id;
            div.innerHTML = \`<div class="card-skeleton" style="height:60px;"></div><div class="card-content"><div class="card-title">Loading...</div><div class="card-time">--:--</div></div>\`;
            return div;
        }

        function hydrateCard(item, idx) {
            const existing = renderedCards.get(idx);
            if (!existing) return;
            existing.classList.remove('card-skeleton');
            existing.innerHTML = \`
                <div class="card-content">
                    <div class="card-title">\${escapeHtml(item.title)}</div>
                    <div class="card-time">\${item.startTime}</div>
                </div>
            \`;
            existing.onclick = () => {
                loadStream(item.file, item.playlistIndex, idx);
            };
            if (activeCardId === idx) existing.classList.add('active');
            else existing.classList.remove('active');
        }

        function escapeHtml(str) { return str.replace(/[&<>]/g, function(m){if(m==='&') return '&amp;'; if(m==='<') return '&lt;'; if(m==='>') return '&gt;'; return m;}); }

        function renderVisibleItems() {
            if (!container) return;
            const scrollLeft = container.scrollLeft;
            const containerWidth = container.clientWidth;
            const itemWidth = 192; // 180px card + 12 gap
            const startIdx = Math.max(0, Math.floor(scrollLeft / itemWidth) - 2);
            const endIdx = Math.min(allItems.length, startIdx + Math.ceil(containerWidth / itemWidth) + 4);
            let neededIds = new Set();
            for (let i = startIdx; i < endIdx; i++) neededIds.add(i);
            if (currentScheduleIndex >= 0) {
                neededIds.add(currentScheduleIndex);
                neededIds.add(currentScheduleIndex-1);
                neededIds.add(currentScheduleIndex+1);
            }
            for (let [id, el] of renderedCards.entries()) {
                if (!neededIds.has(id) && id !== activeCardId && (currentScheduleIndex === undefined || Math.abs(id-currentScheduleIndex) > 2)) {
                    el.remove();
                    renderedCards.delete(id);
                }
            }
            for (let id of neededIds) {
                if (id < 0 || id >= allItems.length) continue;
                if (!renderedCards.has(id)) {
                    const skeleton = createSkeletonCard(id);
                    skeleton.dataset.id = id;
                    container.appendChild(skeleton);
                    renderedCards.set(id, skeleton);
                    setTimeout(() => hydrateCard(allItems[id], id), 20);
                } else {
                    const el = renderedCards.get(id);
                    if (el) {
                        if (activeCardId === id) el.classList.add('active');
                        else el.classList.remove('active');
                    }
                }
            }
            const children = Array.from(container.children);
            children.sort((a,b) => parseInt(a.dataset.id) - parseInt(b.dataset.id));
            children.forEach(child => container.appendChild(child));
        }

        function initVirtualScroller(schedule) {
            allItems = schedule;
            container.innerHTML = '';
            renderedCards.clear();
            const totalItems = allItems.length;
            const itemWidth = 192;
            container.style.minWidth = (totalItems * itemWidth) + 'px';
            renderVisibleItems();
            if (observer) observer.disconnect();
            observer = new IntersectionObserver(() => renderVisibleItems(), { root: container, threshold: 0.1 });
            observer.observe(container);
            container.addEventListener('scroll', () => requestAnimationFrame(renderVisibleItems));
            window.addEventListener('resize', () => renderVisibleItems());
            renderVisibleItems();
            document.getElementById('item-count-badge').innerText = \`\${totalItems} items · virtual scroll\`;
        }

        // ----- load media with optional subtitle support -----
        function loadStream(url, playlistIdx, scheduleIdx) {
            if (hls) { hls.destroy(); hls = null; }
            videoPlayer.pause();
            videoPlayer.removeAttribute('src');

            const vttUrl = url.replace(/\\.[^/.]+$/, '') + '.vtt';
            let track = videoPlayer.querySelector('track');
            if (!track) {
                track = document.createElement('track');
                track.kind = 'subtitles';
                track.label = 'English';
                track.srclang = 'en';
                videoPlayer.appendChild(track);
            }
            track.src = vttUrl;

            if (url.includes('.m3u8') && Hls.isSupported()) {
                hls = new Hls({ maxMaxBufferLength: 30 });
                hls.loadSource(url);
                hls.attachMedia(videoPlayer);
            } else {
                videoPlayer.src = url;
            }
            videoPlayer.play().catch(e => console.warn("autoplay blocked", e));
            currentScheduleIndex = scheduleIdx;
            activeCardId = scheduleIdx;
            updateNowPlayingUI();
            renderVisibleItems();
            if (!lowPowerMode && !audioContext && window.AudioContext) {
                initAudioVisualizer();
            } else if (lowPowerMode && audioContext) {
                disableAudioVisualizer();
            }
        }

        // ----- audio visualizer (toggle) -----
        function initAudioVisualizer() {
            if (lowPowerMode) return;
            if (audioContext) return;
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const source = audioContext.createMediaElementSource(videoPlayer);
                const analyser = audioContext.createAnalyser();
                source.connect(analyser);
                analyser.connect(audioContext.destination);
                visualizerActive = true;
                function draw() {
                    if (!visualizerActive) return;
                    animationFrame = requestAnimationFrame(draw);
                }
                draw();
            } catch(e) { console.warn("visualizer not supported", e); }
        }
        function disableAudioVisualizer() {
            if (audioContext) {
                audioContext.close();
                audioContext = null;
            }
            visualizerActive = false;
            if (animationFrame) cancelAnimationFrame(animationFrame);
        }

        // ----- UI updates (clock, now playing) -----
        function updateNowPlayingUI() {
            if (currentScheduleIndex >= 0 && allItems[currentScheduleIndex]) {
                const cur = allItems[currentScheduleIndex];
                document.getElementById('current-show').innerText = cur.title;
                document.getElementById('fullscreen-now').innerText = cur.title;
                const nextIdx = (currentScheduleIndex+1) % allItems.length;
                const nextTitle = allItems[nextIdx]?.title || 'End';
                document.getElementById('fullscreen-next').textContent = \`Next: \${nextTitle}\`;
            }
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'});
            document.getElementById('live-clock').innerText = timeStr;
            document.getElementById('fullscreen-clock').innerText = timeStr;
            if (videoPlayer.duration) {
                const current = formatTime(videoPlayer.currentTime);
                const total = formatTime(videoPlayer.duration);
                document.getElementById('progress-timer').innerText = \`\${current} / \${total}\`;
            }
            requestAnimationFrame(() => setTimeout(updateNowPlayingUI, 1000));
        }
        function formatTime(sec) { let m = Math.floor(sec/60); let s = Math.floor(sec%60); return \`\${m}:\${s<10?'0'+s:s}\`; }

        // auto-advance on ended
        videoPlayer.onended = () => {
            if (allItems.length) {
                let next = (currentScheduleIndex + 1) % allItems.length;
                const nxt = allItems[next];
                loadStream(nxt.file, nxt.playlistIndex, next);
            }
        };
        videoPlayer.ontimeupdate = () => { if(videoPlayer.duration) document.getElementById('progress-timer').innerText = \`\${formatTime(videoPlayer.currentTime)} / \${formatTime(videoPlayer.duration)}\`; };

        // low-power toggle
        const lowPowerBtn = document.getElementById('low-power-toggle-btn');
        lowPowerBtn.addEventListener('click', () => {
            lowPowerMode = !lowPowerMode;
            localStorage.setItem('librv_low_power', lowPowerMode);
            if (lowPowerMode) { disableAudioVisualizer(); lowPowerBtn.classList.add('active'); }
            else { initAudioVisualizer(); lowPowerBtn.classList.remove('active'); }
        });
        if (lowPowerMode) { lowPowerBtn.classList.add('active'); disableAudioVisualizer(); }
        else { initAudioVisualizer(); }

        // fullscreen toggle
        document.getElementById('fullscreen-btn').onclick = () => {
            const container = document.getElementById('tv-player-container');
            if (!document.fullscreenElement) container.requestFullscreen();
            else document.exitFullscreen();
        };

        // kickstart
        fullSchedule = generate24hrSchedule();
        initVirtualScroller(fullSchedule);
        if (fullSchedule.length) {
            loadStream(fullSchedule[0].file, fullSchedule[0].playlistIndex, 0);
        }
        updateNowPlayingUI();
    </script>
</body>
</html>`;

    // 3. Base64 Encode the HTML for the GitHub API safely
    const contentBase64 = btoa(unescape(encodeURIComponent(staticHTML)));

    // 4. Target the repository
    const repoOwner = "banamine";
    const repoName = "Maverick-Multi";
    const filePath = "index.html";
    const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;

    try {
        let fileSha;
        const getResponse = await fetch(apiUrl, {
            headers: { 
                'Authorization': `Bearer ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (getResponse.ok) {
            const fileData = await getResponse.json();
            fileSha = fileData.sha;
        }

        const putResponse = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${githubToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                message: "Automated 24/7 Channel Update via Maverick Player",
                content: contentBase64,
                sha: fileSha // Include the SHA to confirm the overwrite
            })
        });

        if (putResponse.ok) {
            alert("Successfully deployed to GitHub! Pages will update in ~60 seconds.");
        } else {
            const errorData = await putResponse.json();
            alert(`GitHub API Error: ${errorData.message}`);
        }
    } catch (error) {
        console.error("Deploy failed:", error);
        alert("Network error occurred during deployment.");
    }
};
