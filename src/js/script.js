const CONFIG = {
    START_DATE: '2024-07-21T00:00:00',
    EMOJIS: [
        '❤️', '🩷', '🧡', '💛', '💚', '💙', '🩵', '💜', '🤎', '🖤', '🩶', '🤍',
        '❤️‍🔥', '💕', '💞', '💓', '💗', '💖', '💘', '💝'
    ],
    MAX_EMOJIS: 15,
    EMOJI_INTERVAL: 300,
    CAROUSEL_INTERVAL: 4000,
    VERTICAL_CAROUSEL_INTERVAL: 4000,
    HORIZONTAL_CAROUSEL_INTERVAL: 4000,
    ANIMATION_DURATION: 600,
    COUNTER_UPDATE_INTERVAL: 1000
};

const DOMElements = {
    carousel: {
        verticalTrack: null,
        verticalContainer: null,
        horizontalTrack: null,
        horizontalContainer: null
    },
    counter: {
        years: null,
        months: null,
        days: null,
        hours: null,
        minutes: null,
        seconds: null
    },
    music: {
        audio: null,
        control: null,
        icon: null
    },
    modals: {
        map: null,
        proposal: null,
        mapContainer: null,
        skyContainer: null,
        hojeSempre: null
    },
    buttons: {
        openMap: null,
        closeMap: null,
        toggleMapSky: null,
        openProposal: null,
        closeProposal: null,
        openHojeSempre: null,
        closeHojeSempre: null
    },
    effects: {
        emojiRain: null
    }
};

const AppState = {
    currentVerticalIndex: 0,
    totalVerticalItems: 0,
    verticalImages: [],
    verticalIntervalId: null,
    
    currentHorizontalIndex: 0,
    totalHorizontalItems: 0,
    horizontalImages: [],
    horizontalIntervalId: null,
    
    musicPlaying: false,
    counterAnimationFrameId: null,
    emojiIntervalId: null,
    lastCounterValues: {
        years: 0, months: 0, days: 0,
        hours: 0, minutes: 0, seconds: 0
    }
};

const DOMManager = {
    init() {
        DOMElements.carousel.verticalTrack = document.querySelector('.vertical-carousel-track');
        DOMElements.carousel.verticalContainer = document.querySelector('.carousel-vertical-container');
        DOMElements.carousel.horizontalTrack = document.querySelector('.horizontal-carousel-track');
        DOMElements.carousel.horizontalContainer = document.querySelector('.carousel-horizontal-container');

        DOMElements.counter.years = document.getElementById('years');
        DOMElements.counter.months = document.getElementById('months');
        DOMElements.counter.days = document.getElementById('days');
        DOMElements.counter.hours = document.getElementById('hours');
        DOMElements.counter.minutes = document.getElementById('minutes');
        DOMElements.counter.seconds = document.getElementById('seconds');

        DOMElements.music.audio = document.getElementById('backgroundMusic');
        DOMElements.music.control = document.getElementById('musicControl');
        DOMElements.music.icon = document.getElementById('musicIcon');

        DOMElements.modals.map = document.getElementById('mapModal');
        DOMElements.modals.proposal = document.getElementById('proposalModal');
        DOMElements.modals.mapContainer = document.getElementById('mapContainer');
        DOMElements.modals.skyContainer = document.getElementById('skyMapContainer');
        DOMElements.modals.hojeSempre = document.getElementById('hojeSempreModal');

        DOMElements.buttons.openMap = document.getElementById('openMapModal');
        DOMElements.buttons.closeMap = document.getElementById('closeMapModal');
        DOMElements.buttons.toggleMapSky = document.getElementById('toggleMapSky');
        DOMElements.buttons.openProposal = document.getElementById('openProposalModal');
        DOMElements.buttons.closeProposal = document.getElementById('closeProposalModal');
        DOMElements.buttons.openHojeSempre = document.getElementById('openHojeSempreModal');
        DOMElements.buttons.closeHojeSempre = document.getElementById('closeHojeSempreModal');

        DOMElements.effects.emojiRain = document.getElementById('emoji-rain');

        return this.validateElements();
    },

    validateElements() {
        const critical = [
            'carousel.verticalTrack', 'carousel.verticalContainer',
            'carousel.horizontalTrack', 'carousel.horizontalContainer',
            'counter.years', 'counter.months', 'counter.days',
            'counter.hours', 'counter.minutes', 'counter.seconds',
            'effects.emojiRain'
        ];

        const missing = critical.filter(path => {
            const [obj, prop] = path.split('.');
            return !DOMElements[obj][prop];
        });

        if (missing.length > 0) {
            console.error('Elementos DOM críticos não encontrados:', missing);
            return false;
        }

        return true;
    }
};

const CarouselManager = {
    async init() {
        try {
            const [verticalImages, horizontalImages] = await Promise.all([
                this.loadImages('src/data/vertical-images.json'),
                this.loadImages('src/data/horizontal-images.json')
            ]);

            if (verticalImages.length === 0 && horizontalImages.length === 0) {
                throw new Error('Nenhuma imagem encontrada');
            }

            if (verticalImages.length > 0) {
                AppState.verticalImages = Utils.shuffleArray(verticalImages);
                AppState.totalVerticalItems = verticalImages.length;
                this.createCarouselItems('vertical');
                this.startAutoPlay('vertical');
            }

            if (horizontalImages.length > 0) {
                AppState.horizontalImages = Utils.shuffleArray(horizontalImages);
                AppState.totalHorizontalItems = horizontalImages.length;
                this.createCarouselItems('horizontal');
                this.startAutoPlay('horizontal');
            }

        } catch (error) {
            console.error('Erro ao inicializar carrosséis:', error);
            this.showError('vertical');
            this.showError('horizontal');
        }
    },

    async loadImages(jsonPath) {
        try {
            const response = await fetch(jsonPath, { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.warn(`Erro ao carregar ${jsonPath}:`, error);
            return [];
        }
    },

    createCarouselItems(type) {
        const track = type === 'vertical' 
            ? DOMElements.carousel.verticalTrack 
            : DOMElements.carousel.horizontalTrack;
        
        const images = type === 'vertical' 
            ? AppState.verticalImages 
            : AppState.horizontalImages;

        if (!track || images.length === 0) return;

        track.innerHTML = '';

        images.forEach((src, index) => {
            const imgSrc = src.startsWith('/') ? src.slice(1) : src;
            const div = document.createElement('div');
            div.className = `carousel-item ${index === 0 ? 'active' : ''}`;

            div.innerHTML = `
                <img 
                    src="${imgSrc}" 
                    alt="Nosso momento especial ${type} ${index + 1}" 
                    loading="${index === 0 ? 'eager' : 'lazy'}" 
                    referrerpolicy="no-referrer" 
                    draggable="false"
                >
            `;

            track.appendChild(div);
        });

        if (type === 'vertical') {
            AppState.currentVerticalIndex = 0;
        } else {
            AppState.currentHorizontalIndex = 0;
        }
    },

    showRandomImage(type) {
        const totalItems = type === 'vertical' 
            ? AppState.totalVerticalItems 
            : AppState.totalHorizontalItems;
        
        const currentIndex = type === 'vertical' 
            ? AppState.currentVerticalIndex 
            : AppState.currentHorizontalIndex;

        if (totalItems <= 1) return;

        let nextIndex;
        do {
            nextIndex = Math.floor(Math.random() * totalItems);
        } while (nextIndex === currentIndex);

        this.transitionToImage(type, nextIndex);
    },

    transitionToImage(type, nextIndex) {
        const track = type === 'vertical' 
            ? DOMElements.carousel.verticalTrack 
            : DOMElements.carousel.horizontalTrack;
        
        const currentIndex = type === 'vertical' 
            ? AppState.currentVerticalIndex 
            : AppState.currentHorizontalIndex;

        const items = track?.children;
        if (!items || nextIndex >= items.length) return;

        const currentItem = items[currentIndex];
        const nextItem = items[nextIndex];

        if (currentItem) {
            currentItem.classList.remove('active');
            currentItem.classList.add('exit');
            setTimeout(() => {
                currentItem.classList.remove('exit');
            }, CONFIG.ANIMATION_DURATION);
        }

        if (nextItem) {
            nextItem.classList.add('active');
            
            if (type === 'vertical') {
                AppState.currentVerticalIndex = nextIndex;
            } else {
                AppState.currentHorizontalIndex = nextIndex;
            }
        }
    },

    startAutoPlay(type) {
        this.stopAutoPlay(type);
        
        const interval = type === 'vertical' 
            ? CONFIG.VERTICAL_CAROUSEL_INTERVAL 
            : CONFIG.HORIZONTAL_CAROUSEL_INTERVAL;

        const intervalId = setInterval(() => {
            this.showRandomImage(type);
        }, interval);

        if (type === 'vertical') {
            AppState.verticalIntervalId = intervalId;
        } else {
            AppState.horizontalIntervalId = intervalId;
        }
    },

    stopAutoPlay(type) {
        if (type === 'vertical' && AppState.verticalIntervalId) {
            clearInterval(AppState.verticalIntervalId);
            AppState.verticalIntervalId = null;
        } else if (type === 'horizontal' && AppState.horizontalIntervalId) {
            clearInterval(AppState.horizontalIntervalId);
            AppState.horizontalIntervalId = null;
        }
    },

    showError(type) {
        const track = type === 'vertical' 
            ? DOMElements.carousel.verticalTrack 
            : DOMElements.carousel.horizontalTrack;
        
        if (track) {
            track.innerHTML = `<div class="carousel-item active"><p class="error-message">Erro ao carregar as imagens ${type}s.</p></div>`;
        }
    }
};

const App = {
    async init() {
        try {
            console.log('Inicializando aplicação...');

            if (!DOMManager.init()) {
                throw new Error('Falha na inicialização dos elementos DOM');
            }

            await CarouselManager.init();
            CounterManager.init();
            MusicManager.init();
            ModalManager.init();
            EffectsManager.init();

            this.setupGlobalListeners();
            this.showMainContent();

            console.log('Aplicação inicializada com sucesso');

        } catch (error) {
            console.error('Erro na inicialização:', error);
            this.handleInitError(error);
        }
    },

    setupGlobalListeners() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                EffectsManager.stopEmojiRain();
                CarouselManager.stopAutoPlay('vertical');
                CarouselManager.stopAutoPlay('horizontal');
            } else {
                EffectsManager.startEmojiRain();
                CarouselManager.startAutoPlay('vertical');
                CarouselManager.startAutoPlay('horizontal');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (!DOMElements.modals.map?.classList.contains('hidden')) {
                    ModalManager.closeMapModal();
                }
                if (!DOMElements.modals.proposal?.classList.contains('hidden')) {
                    ModalManager.closeProposalModal();
                }
            }
        });
    },

    showMainContent() {
        const mainContent = document.getElementById('mainContent');
        const musicControl = DOMElements.music.control;

        if (mainContent) {
            mainContent.classList.remove('hidden');
            mainContent.classList.add('fade-in');
        }

        if (musicControl) {
            musicControl.classList.remove('hidden');
        }
    },

    handleInitError(error) {
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="error-message">
                    <h2>Oops! Algo deu errado</h2>
                    <p>Houve um problema ao carregar a página. Por favor, tente recarregar.</p>
                    <button onclick="location.reload()" class="button">Recarregar Página</button>
                </div>
            `;
            mainContent.classList.remove('hidden');
        }
    },

    cleanup() {
        CounterManager.stop();
        EffectsManager.stopEmojiRain();
        CarouselManager.stopAutoPlay('vertical');
        CarouselManager.stopAutoPlay('horizontal');
    }
};

const Utils = {
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    throttle(func, delay) {
        let timeoutId;
        let lastExecTime = 0;
        return function (...args) {
            const currentTime = Date.now();

            if (currentTime - lastExecTime > delay) {
                func.apply(this, args);
                lastExecTime = currentTime;
            } else {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    func.apply(this, args);
                    lastExecTime = Date.now();
                }, delay - (currentTime - lastExecTime));
            }
        };
    },

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    },

    animateValueChange(element, newValue, currentValue) {
        if (!element || String(currentValue) === String(newValue)) return;

        element.classList.add('animate-change');
        element.textContent = newValue;

        setTimeout(() => {
            element.classList.remove('animate-change');
        }, CONFIG.ANIMATION_DURATION);
    }
};

const CounterManager = {
    init() {
        this.updateCounter();
    },

    updateCounter() {
        if (typeof dateFns === 'undefined') {
            console.error('date-fns não carregado');
            return;
        }

        const start = new Date(CONFIG.START_DATE);
        const now = new Date();

        const values = this.calculateTimeDifference(start, now);

        Object.entries(values).forEach(([unit, value]) => {
            const element = DOMElements.counter[unit];
            const lastValue = AppState.lastCounterValues[unit];

            if (element) {
                Utils.animateValueChange(element, value, lastValue);
                AppState.lastCounterValues[unit] = value;
            }
        });

        AppState.counterAnimationFrameId = requestAnimationFrame(() => {
            setTimeout(() => this.updateCounter(), CONFIG.COUNTER_UPDATE_INTERVAL);
        });
    },

    calculateTimeDifference(start, end) {
        const {
            differenceInYears, differenceInMonths, differenceInDays,
            differenceInHours, differenceInMinutes, differenceInSeconds,
            addYears, addMonths, addDays, addHours, addMinutes
        } = dateFns;

        let temp = new Date(start);

        const years = differenceInYears(end, temp);
        temp = addYears(temp, years);

        const months = differenceInMonths(end, temp);
        temp = addMonths(temp, months);

        const days = differenceInDays(end, temp);
        temp = addDays(temp, days);

        const hours = differenceInHours(end, temp);
        temp = addHours(temp, hours);

        const minutes = differenceInMinutes(end, temp);
        temp = addMinutes(temp, minutes);

        const seconds = differenceInSeconds(end, temp);

        return { years, months, days, hours, minutes, seconds };
    },

    stop() {
        if (AppState.counterAnimationFrameId) {
            cancelAnimationFrame(AppState.counterAnimationFrameId);
            AppState.counterAnimationFrameId = null;
        }
    }
};

const MusicManager = {
    init() {
        const { control, icon, audio } = DOMElements.music;

        if (!control || !icon || !audio) {
            console.error('Elementos de música não encontrados');
            return;
        }

        this.updateUI(false);

        control.addEventListener('click', () => this.toggle());

        audio.addEventListener('play', () => {
            AppState.musicPlaying = true;
            this.updateUI(true);
        });

        audio.addEventListener('pause', () => {
            AppState.musicPlaying = false;
            this.updateUI(false);
        });

        audio.addEventListener('error', (e) => {
            console.error('Erro no áudio:', e);
        });
    },

    async toggle() {
        const audio = DOMElements.music.audio;
        if (!audio) return;

        try {
            if (audio.paused) {
                await audio.play();
            } else {
                audio.pause();
            }
        } catch (error) {
            console.error('Erro ao controlar música:', error);
        }
    },

    updateUI(isPlaying) {
        const { control, icon } = DOMElements.music;
        if (!control || !icon) return;

        icon.classList.add('fade-out');

        setTimeout(() => {
            if (isPlaying) {
                icon.src = 'assets/icons/pause.svg';
                icon.alt = 'Pausar';
                control.setAttribute('aria-label', 'Pausar música');
                control.setAttribute('title', 'Pausar música');
            } else {
                icon.src = 'assets/icons/play.svg';
                icon.alt = 'Reproduzir';
                control.setAttribute('aria-label', 'Reproduzir música');
                control.setAttribute('title', 'Reproduzir música');
            }

            icon.classList.remove('fade-out');
            icon.style.opacity = '1';
            icon.classList.add('fade-in');

            setTimeout(() => {
                icon.classList.remove('fade-in');
                icon.style.opacity = '';
            }, CONFIG.ANIMATION_DURATION / 3);
        }, CONFIG.ANIMATION_DURATION / 5);
    }
};

const ModalManager = {
    init() {
        this.initMapModal();
        this.initProposalModal();
        this.initHojeSempreModal();
    },
    initHojeSempreModal() {
        const { openHojeSempre, closeHojeSempre } = DOMElements.buttons;
        const { hojeSempre } = DOMElements.modals;

        if (!openHojeSempre || !closeHojeSempre || !hojeSempre) return;

        openHojeSempre.addEventListener('click', () => this.openHojeSempreModal());
        closeHojeSempre.addEventListener('click', () => this.closeHojeSempreModal());
        hojeSempre.addEventListener('click', (e) => {
            if (e.target === hojeSempre) this.closeHojeSempreModal();
        });
    },

    openHojeSempreModal() {
        const { hojeSempre } = DOMElements.modals;
        if (!hojeSempre) return;
        hojeSempre.classList.remove('hidden');
        requestAnimationFrame(() => {
            hojeSempre.querySelector('.custom-modal-content')?.focus();
        });
    },

    closeHojeSempreModal() {
        const { hojeSempre } = DOMElements.modals;
        if (!hojeSempre) return;
        hojeSempre.classList.add('hidden');
    },

    initMapModal() {
        const { openMap, closeMap, toggleMapSky } = DOMElements.buttons;
        const { map } = DOMElements.modals;

        if (!openMap || !closeMap || !map) return;

        openMap.addEventListener('click', () => this.openMapModal());
        closeMap.addEventListener('click', () => this.closeMapModal());
        map.addEventListener('click', (e) => {
            if (e.target === map) this.closeMapModal();
        });

    },

    initProposalModal() {
        const { openProposal, closeProposal } = DOMElements.buttons;
        const { proposal } = DOMElements.modals;

        if (!openProposal || !closeProposal || !proposal) return;

        openProposal.addEventListener('click', () => this.openProposalModal());
        closeProposal.addEventListener('click', () => this.closeProposalModal());
        proposal.addEventListener('click', (e) => {
            if (e.target === proposal) this.closeProposalModal();
        });
    },

    openMapModal() {
        const { map } = DOMElements.modals;
        const { toggleMapSky } = DOMElements.buttons;

        if (!map) return;

        map.classList.remove('hidden');
        this.resetMapModal();

        if (toggleMapSky) {
            const newToggle = toggleMapSky.cloneNode(true);
            toggleMapSky.parentNode.replaceChild(newToggle, toggleMapSky);
            DOMElements.buttons.toggleMapSky = newToggle;

            newToggle.addEventListener('click', () => this.toggleMapView());
        }

        requestAnimationFrame(() => {
            map.style.opacity = '1';
        });
    },

    closeMapModal() {
        const { map } = DOMElements.modals;
        if (!map) return;

        map.classList.add('hidden');
        this.resetMapModal();
    },

    resetMapModal() {
        const { mapContainer, skyContainer } = DOMElements.modals;
        const { toggleMapSky } = DOMElements.buttons;

        if (skyContainer) skyContainer.classList.add('hidden');
        if (mapContainer) mapContainer.classList.remove('hidden');
        if (toggleMapSky) toggleMapSky.textContent = 'Mapa do Céu';
    },

    toggleMapView() {
        const { mapContainer, skyContainer } = DOMElements.modals;
        const { toggleMapSky } = DOMElements.buttons;
        const modalContent = DOMElements.modals.map?.querySelector('.custom-modal-content');

        if (!mapContainer || !skyContainer || !toggleMapSky || !modalContent) return;

        const isSkyVisible = !skyContainer.classList.contains('hidden');

        const currentHeight = modalContent.offsetHeight;

        skyContainer.classList.add('hidden');
        mapContainer.classList.add('hidden');

        if (isSkyVisible) {
            mapContainer.classList.remove('hidden');
        } else {
            skyContainer.classList.remove('hidden');
        }

        const targetHeight = modalContent.offsetHeight;

        if (isSkyVisible) {
            mapContainer.classList.add('hidden');
            skyContainer.classList.remove('hidden');
        } else {
            skyContainer.classList.add('hidden');
            mapContainer.classList.remove('hidden');
        }

        if (currentHeight !== targetHeight) {
            modalContent.style.height = `${currentHeight}px`;

            setTimeout(() => {
                modalContent.style.height = `${targetHeight}px`;

                setTimeout(() => {
                    modalContent.style.height = '';
                }, CONFIG.TRANSITION_DURATION);
            }, 10);
        }

        if (isSkyVisible) {
            skyContainer.classList.add('hidden');
            mapContainer.classList.remove('hidden');
            toggleMapSky.textContent = 'Mapa do Céu';
        } else {
            skyContainer.classList.remove('hidden');
            mapContainer.classList.add('hidden');
            toggleMapSky.textContent = 'Google Maps';
        }
    },

    openProposalModal() {
        const { proposal } = DOMElements.modals;
        if (!proposal) return;

        proposal.classList.remove('hidden');

        requestAnimationFrame(() => {
            proposal.style.opacity = '1';
        });
    },

    closeProposalModal() {
        const { proposal } = DOMElements.modals;
        if (!proposal) return;

        proposal.classList.add('hidden');
    }
};

const EffectsManager = {
    init() {
        this.startEmojiRain();
    },

    startEmojiRain() {
        this.stopEmojiRain();
        AppState.emojiIntervalId = setInterval(() => {
            this.createEmoji();
        }, CONFIG.EMOJI_INTERVAL);
    },

    stopEmojiRain() {
        if (AppState.emojiIntervalId) {
            clearInterval(AppState.emojiIntervalId);
            AppState.emojiIntervalId = null;
        }
    },

    createEmoji: Utils.throttle(function () {
        const emojiRain = DOMElements.effects.emojiRain;
        if (!emojiRain) return;

        const currentEmojis = emojiRain.querySelectorAll('.emoji');
        if (currentEmojis.length >= CONFIG.MAX_EMOJIS) return;

        const emoji = document.createElement('span');
        emoji.classList.add('emoji');
        emoji.textContent = CONFIG.EMOJIS[Math.floor(Math.random() * CONFIG.EMOJIS.length)];

        emoji.style.left = `${Math.random() * window.innerWidth}px`;
        emoji.style.animationDuration = `${2 + Math.random() * 2}s`;

        emojiRain.appendChild(emoji);

        emoji.addEventListener('animationend', () => {
            if (emoji.parentNode) {
                emoji.parentNode.removeChild(emoji);
            }
        }, { once: true });
    }, 100)
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}

window.addEventListener('beforeunload', () => App.cleanup());
