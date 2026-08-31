import SwiftUI
import KeyboardKit

// The real KeyboardView, rendered outside of an actual keyboard extension.
//
// KeyboardInputViewController normally hands out `state`/`services` that
// KeyboardView is built from (see KeyboardViewController.swift). Outside of
// a live extension, KeyboardKit's own docs cover exactly this case: `
// Keyboard.State` and `Keyboard.Services` are plain, side-effect-free types
// you can construct directly (this is the same mechanism their own SwiftUI
// Previews use), so this isn't a workaround - it's the supported way to
// preview a KeyboardView inside a regular app screen.
//
// Because of that, nothing about the button grid, spacing, or corner radii
// is re-derived here. It's the same KeyboardView, the same
// ThemedKeyboardStyleService, computing the same geometry KeyboardKit
// itself owns - which is the whole point versus the old hand-rolled RN
// mockup.
struct KeyboardPreviewContent: View {
    let theme: KeyboardThemeModel

    var body: some View {
        let state = Keyboard.State()
        let services = Keyboard.Services(state: state)
        services.styleService = ThemedKeyboardStyleService(
            theme: theme,
            keyboardContext: state.keyboardContext
        )

        return KeyboardView(
            state: state,
            services: services,
            buttonContent: { $0.view },
            buttonView: { $0.view },
            collapsedView: { $0.view },
            emojiKeyboard: { $0.view },
            toolbar: { $0.view }
        )
        .background(Color(UIColor(hex: theme.colors.background)))
    }
}
