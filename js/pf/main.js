'use strict';
// =============================================================================
// Puppy Force — main.js
// Phaser 3 game initialization
// =============================================================================

// Show chapter title in UIScene after BattleScene starts
// (Wire this into BattleScene.create after UIScene launches)
const _origBattleCreate = BattleScene.prototype.create;
BattleScene.prototype.create = function() {
  _origBattleCreate.call(this);
  // Show chapter title card
  this.time.delayedCall(100, () => {
    const ui = this._getUI();
    if (ui) ui.showChapterTitle(this.chapterId);
  });
};

// =============================================================================
// Phaser Game Config
// =============================================================================

const config = {
  type: Phaser.AUTO,         // WebGL → Canvas fallback
  width:  GAME_W,
  height: GAME_H,
  backgroundColor: PAL.BG,
  parent: 'pf-container',

  scale: {
    mode:       Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  scene: [
    TitleScene,
    BattleScene,
    UIScene,
    VictoryScene,
    CutsceneScene,
    PrepScene,
  ],

  audio: {
    disableWebAudio: false,
  },

  // Disable default right-click menu
  disableContextMenu: true,

  // Mobile-friendly input
  input: {
    touch: true,
  },

  // Renderer tweaks for crisp pixel look
  render: {
    antialias: false,
    pixelArt:  false,
  },
};

// Boot the game
const PuppyForceGame = new Phaser.Game(config);

// Prevent iOS double-tap zoom
document.addEventListener('touchend', e => e.preventDefault(), { passive: false });
