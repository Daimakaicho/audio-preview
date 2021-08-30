'use strict';
const MODULE_ID = "audio-preview";
const CONTROLS_TEMPLATE_PATH = `modules/${MODULE_ID}/module/templates/audio-controls.hbs`;
const SUPPORTED_AUDIO_FORMAT = ["wav", "mp3", "flac", "webm", "ogg"]

class AudioPreview {
    constructor() {
        this.selectedTrack = undefined;
        this.selectedSound = undefined;
        this.loopMode = false;
    }

    _canPlayback(){
        return SUPPORTED_AUDIO_FORMAT.includes(this.selectedTrack.split('.').pop().toLowerCase())
    }

    async _renderControls() {
        return renderTemplate(CONTROLS_TEMPLATE_PATH);
    }

    async loadControls() {
        await loadTemplates(CONTROLS_TEMPLATE_PATH);
    }

    async _onPick(args) {
        const li = args[0].currentTarget;
        this.selectedTrack = li.dataset.path;
    }

    _switchPlayStopIcon(button) {
        $(button).find("i").toggleClass(["fa-play", "fa-stop"]);
    }

    async _activateListeners(button) {
        button.on('click', async (event) => {
            event.preventDefault();
            if (!this._canPlayback()) {
                // not a sound file, do nothing
            } else {
                // Is already a sound playing ?
                if (this.selectedSound && this.selectedSound.playing) {
                    this.selectedSound.stop();
                    this._switchPlayStopIcon(event.currentTarget);
                    return;
                }

                this.selectedSound = await AudioHelper.play({src: this.selectedTrack, volume: 0.5}, false);
                this.selectedSound.on('end', () => this._switchPlayStopIcon(event.currentTarget));
                this._switchPlayStopIcon(event.currentTarget);
            }
        });
    }

    async _onRenderFilePicker(app, html, data) {
        //const playButtonHtml = await this._renderControls();

        const playButton = $("<button>") // $(playButtonHtml);
        playButton.append($("<i>").addClass([ "fas", (this.selectedSound && this.selectedSound.playing) ? "fa-stop" : "fa-play"]));
        $("footer.form-footer > .selected-file").append(playButton);
        await this._activateListeners(playButton);
        playButton.css({
            "max-width": "30px",
            "margin-left": "5px"
        });
    }

}

Hooks.once('init', async () => {
    game.soundPreview = new AudioPreview();

    libWrapper.register(MODULE_ID, "FilePicker.prototype._onPick", async function (wrapper, ...args) {
        await wrapper(...args);
        await game.soundPreview._onPick(args);
    });

    Hooks.on('renderFilePicker', async (app, html, data) => {
        await game.soundPreview._onRenderFilePicker(app, html, data);
    });
    //await game.soundPreview.loadControls();
})

