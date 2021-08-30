'use strict';
const MODULE_ID = "sound-preview";
const CONTROLS_TEMPLATE_PATH = `modules/${MODULE_ID}/module/templates/sound-controls.hbs`;

let selectedTrack = undefined;
let selectedSound = undefined;
let loopMode = false;


class AudioPreview {
    constructor() {
        this.selectedTrack = undefined;
        this.selectedSound = undefined;
        this.loopMode = false;
    }

    _canPlayback(){
        return ["wav", "mp3"].includes(this.selectedTrack.split('.').pop().toLowerCase())
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

    async _activateListeners(controls) {
        controls.find(".play-button").on('click', async (event) => {
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

                if (this.selectedTrack !== undefined && (this.selectedSound === undefined || this.selectedSound.src !== this.selectedTrack) ) {
                    this.selectedSound = new Sound(this.selectedTrack);
                    this.selectedSound.on('end', () => this._switchPlayStopIcon(event.currentTarget));
                }

                if (!this.selectedSound.loaded)
                    await this.selectedSound.load();

                this._switchPlayStopIcon(event.currentTarget);
                if (this.selectedSound.playing)
                    await this.selectedSound.stop();
                else
                   await this.selectedSound.play({volume: 100, loop: false});
            }
        });

        controls.find(".loop-button").on('click', async function(event) {
            this.loopMode = !this.loopMode;
            if (this.selectedSound)
                this.selectedSound.loop = loopMode;
        })
    }

    async _onRenderFilePicker(app, html, data) {
        const submitButton = html.find("footer.form-footer button[type='submit']");
        const controls = $(await this._renderControls());

        await this._activateListeners(controls);
        controls.insertBefore(submitButton);
        app.setPosition(app.left, app.top, app.width, app.height, app.scale);
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

