"use strict";
const MODULE_ID = "audio-preview";

class AudioPreview {
  static PLAY_STATE = {
    INIT: 0,
    PLAYING: 1,
    WAITING: 2,
    LOADING: 3,
  };

  constructor() {
    this._state = AudioPreview.PLAY_STATE.WAITING;
    this.selectedTrack = undefined;
    this.selectedSound = undefined;
  }

  _canPlayback() {
    return this.selectedTrack
      ? Object.keys(CONST.AUDIO_FILE_EXTENSIONS).includes(
          this.selectedTrack.split(".").pop().toLowerCase()
        )
      : false;
  }

//   async _onPick(args) {
//     const li = args[0].currentTarget;
//     this.selectedTrack = li.dataset.path;
//     console.log(this.selectedSound);
//     if (this.selectedSound) {
//       this.selectedSound.stop();
//       this.selectedSound = undefined;
//       this.state = AudioPreview.PLAY_STATE.WAITING;
//     }
//     this._applyState();
//   }

  get state() {
    return this._state;
  }

  set state(value) {
    const stateApplied = this._applyState(value);
    if (stateApplied) {
      this._state = value;
    }
  }

  _applyState(value) {
    if (value === undefined) value = this.state;

    switch (value) {
      case AudioPreview.PLAY_STATE.WAITING:
        this._playButton
          .find("i")
          .removeClass(["fa-spinner", "fa-spin", "fa-stop"])
          .addClass(["fa-play"]);
        //this._playButton.prop("disabled", !this._canPlayback());
        return true;

      case AudioPreview.PLAY_STATE.PLAYING:
        this._playButton
          .find("i")
          .removeClass(["fa-spinner", "fa-spin", "fa-play"])
          .addClass(["fa-stop"]);
        //this._playButton.prop("disabled", false);
        return true;

      case AudioPreview.PLAY_STATE.LOADING:
        this._playButton
          .find("i")
          .removeClass(["fa-play", "fa-stop"])
          .addClass(["fa-spinner", "fa-spin"]);
        //this._playButton.prop("disabled", true);
        return true;

      default:
        return false;
    }
  }

  async _onClick() {
    this.selectedTrack = this._selectedInput.value;

    if (this.state === AudioPreview.PLAY_STATE.PLAYING) {
      this.selectedSound.stop();
      this.selectedSound = undefined;
      this.state = AudioPreview.PLAY_STATE.WAITING;
      return;
    }

    this.state = AudioPreview.PLAY_STATE.LOADING;
    try {
      this.selectedSound = await foundry.audio.AudioHelper.play(
        {
          src: this.selectedTrack,
          volume: game.settings.get(MODULE_ID, "AudioPreview.Volume"),
          loop: game.settings.get(MODULE_ID, "AudioPreview.LoopMode"),
        },
        false
      );
      this.selectedSound.addEventListener("end", () => this.state = AudioPreview.PLAY_STATE.WAITING);
      this.state = AudioPreview.PLAY_STATE.PLAYING;
    } catch (exception) {
      ui.notifications.warn("Invalid sound file");
      this.state = AudioPreview.PLAY_STATE.WAITING;
    }
  }

  async _activateListeners(button) {
    button.on("click", async (event) => {
      event.preventDefault();
      await this._onClick();
    });
  }

  async _onRenderFilePicker(app, html, data) {
    const template = $(
      await renderTemplate(
        "modules/audio-preview/module/templates/preview-button.hbs"
      )
    );
    html.find("div.form-group.selected-file").append(template);
    const playButton = html.find("button.audio-preview-button");
    
    await this._activateListeners(playButton);    
    this._playButton = playButton;
    this._applyState();

    this._selectedInput = html.find("input[name='file']")[0];
  }

  async _onSubmit() {
    if (this.selectedSound) {
      this.selectedSound.stop();
      this.selectedSound = undefined;
    }
  }
}

Hooks.once("init", async () => {
  game.soundPreview = new AudioPreview();

  /*
    libWrapper.register(MODULE_ID, "FilePicker.prototype._onPick", async function (wrapper, ...args) {
        await game.soundPreview._onPick(args);
        return await wrapper(...args);        
    });
    */

  libWrapper.register(
    MODULE_ID,
    "FilePicker.prototype._onSubmit",
    async function (wrapper, ...args) {
      await game.soundPreview._onSubmit();
      return await wrapper(...args);
    }
  );

  Hooks.on("renderFilePicker", async (app, html, data) => {
    await game.soundPreview._onRenderFilePicker(app, html, data);
  });
});

Hooks.once("ready", async () => {
  game.settings.register(MODULE_ID, "AudioPreview.Volume", {
    name: game.i18n.localize("AudioPreview.Settings.Volume.Title"),
    hint: game.i18n.localize("AudioPreview.Settings.Volume.Description"),
    scope: "world",
    config: true,
    default: 0.5,
    type: Number,
    range: {
      min: 0,
      max: 1,
      step: 0.05,
    },
  });

  game.settings.register(MODULE_ID, "AudioPreview.LoopMode", {
    name: game.i18n.localize("AudioPreview.Settings.LoopMode.Title"),
    hint: game.i18n.localize("AudioPreview.Settings.LoopMode.Description"),
    scope: "world",
    config: true,
    default: false,
    type: Boolean,
  });
});
