export interface SettingsValueTypes {
    'user.pref.ui.copy_pref': number;
    'user.pref.ui.copy_optimize': boolean;
    'user.pref.ui.dialogue.show_synopsis': boolean;
    'user.pref.state.scroll_pos_restore': boolean;
    'user.pref.ui.cgview.allow_render': boolean;
}

export type SettingsKey = keyof SettingsValueTypes;

export const SETTINGS_DEFAULTS: { [K in SettingsKey]: SettingsValueTypes[K] } = {
    'user.pref.ui.copy_pref': 1,
    'user.pref.ui.copy_optimize': true,
    'user.pref.ui.dialogue.show_synopsis': true,
    'user.pref.state.scroll_pos_restore': true,
    'user.pref.ui.cgview.allow_render': true,
};
