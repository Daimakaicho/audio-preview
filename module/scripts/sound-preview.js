'use strict';
const MODULE_ID = "sound-preview";
const CONTROLS_TEMPLATE_PATH = `modules/${MODULE_ID}/templates/sound-controls.hbs`;

let selectedTrack = undefined;
let selectedSound = undefined;
let loopMode = false;


class SoundPreview {
    async constructor() {
        this.selectedTrack = undefined;
        this.selectedSound = undefined;
        this.loopMode = false;
        await this._loadControls();
    }

    async _renderControls() {
        return renderTemplate(CONTROLS_TEMPLATE_PATH);
    }

    async _loadControls() {
        await loadTemplate(CONTROLS_TEMPLATE_PATH);
    }

    async _onPick(args) {
        const li = args[0].currentTarget;
        selectedTrack = li.dataset.path;
    }

    async _activateListeners(controls) {
        controls.find(".play-button").on('click', async function(event) {
            if (selectedTrack !== undefined && (selectedSound === undefined || selectedSound.src !== selectedTrack) )
                selectedSound = new Sound(selectedTrack);

            if (!selectedSound.loaded)
                selectedSound.load();

            if (selectedSound.playing)
                selectedSound.stop();
            else
                selectedSound.play({volume: 100, loop: true});
        });

        controls.find(".loop-button").on('click', async function(event) {
            loopMode = !loopMode;
            if (selectedSound)
                selectedSound.loop = loopMode;
        })
    }

    async _onRenderFilePicker(app, html, data) {
        const submitButton = html.find(".filepicker-body > footer > button[type='submit']");
        const controls = await this._renderControls();

        await this._activateListeners(controls);
        submitButton.parent().insertBefore(controls, submitButton);
    }

}

Hooks.once('init', async () => {
    game.soundPreview = await new SoundPreview();

    libWrapper.register(MODULE_ID, "FilePicker.prototype._onPick", async function (wrapper, ...args) {
        await wrapper(args);
        await game.soundPreview._onPick(args);
    });
    Hooks.on('renderFilePicker', game.soundPreview._onRenderFilePicker);
})

