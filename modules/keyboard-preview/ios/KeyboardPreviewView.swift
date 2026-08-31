import ExpoModulesCore
import SwiftUI

// Bridges the real SwiftUI KeyboardView into React Native.
//
// Expo's own Modules API docs (as of writing) don't yet have first-class
// SwiftUI view support - the documented approach is exactly this: a
// UIHostingController whose .view gets added as a plain subview. We don't
// do full UIViewController containment (addChild/didMove) here since this
// view has no navigation or appearance-transition needs of its own, just
// rendering - that's the accepted shape for this use case, not a shortcut
// specific to this project.
class KeyboardPreviewView: ExpoView {
    private let hostingController = UIHostingController(
        rootView: KeyboardPreviewContent(theme: .fallback)
    )

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        hostingController.view.backgroundColor = .clear
        addSubview(hostingController.view)
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        hostingController.view.frame = bounds
    }

    /// Called from KeyboardPreviewModule's "themeJSON" prop setter whenever
    /// the RN side pushes a new theme (e.g. the person drags a color field
    /// or flips a corner-radius preset in ThemeEditorScreen).
    func setThemeJSON(_ json: String) {
        guard
            let data = json.data(using: .utf8),
            let theme = try? JSONDecoder().decode(KeyboardThemeModel.self, from: data)
        else { return }
        hostingController.rootView = KeyboardPreviewContent(theme: theme)
    }
}
