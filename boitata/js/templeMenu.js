/* The title menu owns its ambient effects independently of the game world. */
(() => {
  'use strict';
  const B = Boitata;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const menu = B.TempleMenu = {
    root: null,
    transition: 0,
    open() {
      this.stop();
      B.S.phase = 'menu';
      B.Movement.clear();
      B.UI.close();
      document.body.classList.remove('arena-active');
      document.body.classList.add('temple-open');
      const root = this.root = document.createElement('section');
      root.className = 'temple-menu';
      root.setAttribute('aria-label', 'Menu principal de Legend.Exe');
      root.innerHTML = `
        <div class="temple-environment" aria-hidden="true">
        <div class="temple-art"></div>
        <div class="temple-mist temple-mist-far" aria-hidden="true"></div>
        <div class="temple-mist temple-mist-near" aria-hidden="true"></div>
        <div class="temple-particles" aria-hidden="true"></div>
        <div class="temple-vignette" aria-hidden="true"></div>
        <div class="temple-energy" aria-hidden="true"></div>
        </div>
        <div class="temple-topline"><span>Legend.Exe <span class="temple-dot">·</span> Protocolo de Captura</span></div>
        <div class="temple-content">
          <div class="temple-title-block">
            <div class="temple-sigil" aria-hidden="true">◇</div>
            <h1>Legend.Exe</h1>
            <p class="temple-subtitle">Protocolo de Captura</p>
          </div>
          <nav class="temple-actions" aria-label="Menu principal"></nav>
        </div>`;
      document.body.append(root);
      const actions = [
        ['JOGAR', () => this.play(), 'temple-play'],
        ['SELECIONAR SETOR', () => B.UI.selection()],
        ['CONFIGURAÇÕES', () => B.UI.settings()],
        ['HISTÓRIA', () => B.Story.start(), 'temple-story'],
        ['HISTÓRIA FINAL', () => B.Story.start({final:true}), 'temple-story temple-final-story']
      ];
      for (const [label, action, className] of actions) {
        const button = document.createElement('button');
        button.className = className || '';
        button.innerHTML = '<span class="temple-button-mark" aria-hidden="true">◇</span><span>' +
          label + '</span><span class="temple-button-line" aria-hidden="true"></span>';
        button.onclick = action;
        root.querySelector('.temple-actions').append(button);
      }
      for (let i = 0; i < 24; i++) {
        const particle = document.createElement('i');
        particle.style.cssText = '--x:' + ((i * 37) % 100) + '%;--delay:-' +
          (i % 13) + 's;--duration:' + (12 + i % 9) + 's;--drift:' + (i % 2 ? 45 : -35) + 'px';
        root.querySelector('.temple-particles').append(particle);
      }
      root.querySelector('.temple-play').focus({preventScroll: true});
    },
    creditsLockedStory() {
      B.UI.panel('HISTÓRIA FINAL BLOQUEADA', 'Ainda há mistérios na rede.',
        '<p>Conclua o jogo para desbloquear a História Final</p>',
        [['Voltar ao menu', () => this.open(), true]]);
    },
    play() {
      if (this.transition) return;
      this.root.classList.add('temple-departing');
      this.root.setAttribute('aria-busy', 'true');
      this.root.querySelectorAll('button').forEach(button => { button.disabled = true; });
      const last = B.S.save.last;
      this.transition = window.setTimeout(() => {
        this.transition = 0;
        B.CharacterSelection.show(() => B.Game.start(last));
      }, reducedMotion.matches ? 80 : 750);
    },
    credits() {
      B.S.phase = 'credits';
      B.UI.panel('LEGEND.EXE / PROTOCOLO DE CAPTURA', 'Créditos',
        '<p>Legend.Exe — Protocolo de Captura<br>Folclore brasileiro e educação digital.</p>' +
        '<p>Arte do templo criada com OpenAI ImageGen. Efeitos ambientais animados na interface.</p>' +
        '<p>Tipografia do menu: Cinzel Decorative, Marcellus e Outfit, distribuídas sob a SIL Open Font License. Licenças incluídas no projeto.</p>' +
        '<p>Áudio sintetizado pelo próprio jogo.</p>',
        [['Voltar ao menu', () => B.UI.menu(), true]]);
    },
    stop() {
      clearTimeout(this.transition);
      this.transition = 0;
      this.root?.remove();
      this.root = null;
      document.body.classList.remove('temple-open');
    }
  };
  const panel = B.UI.panel;
  B.UI.panel = function(...args) {
    menu.stop();
    return panel.apply(this, args);
  };
  const originalMenu = B.UI.menu;
  B.UI.menu = function(...args) {
    originalMenu.apply(this, args);
    menu.open();
  };
  const exitPreview = B.MapPreview.exit;
  B.MapPreview.exit = function(...args) {
    exitPreview.apply(this, args);
    if (B.S.phase === 'menu') B.UI.menu();
  };
  reducedMotion.addEventListener('change', () => {
    if (menu.root) menu.open();
  });
  window.addEventListener('pagehide', () => menu.stop());
})();
