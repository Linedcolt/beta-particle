import SwiftUI
import UIKit

// Bridges the real SwiftUI KeyboardView into React Native.
//
// This used to subclass ExpoView (ExpoModulesCore). It's now a plain UIView
// so it can be registered through a plain RCTViewManager instead - see
// KeyboardPreviewManager.swift for why. The UIHostingController wrapping
// approach itself is unchanged: Expo's own Modules API docs don't have
// first-class SwiftUI view support either, so a UIHostingController whose
// .view gets added as a plain subview was already the right shape, not a
// shortcut specific to this project.
class KeyboardPreviewView: UIView {
    private let hostingController = UIHostingController(
        rootView: KeyboardPreviewContent(theme: .fallback)
    )

    override init(frame: CGRect) {
        super.init(frame: frame)
        hostingController.view.backgroundColor = .clear
        addSubview(hostingController.view)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        hostingController.view.frame = bounds
    }

    /// Set via RCT_EXPORT_VIEW_PROPERTY(themeJSON, NSString) in
    /// KeyboardPreviewManager.m, using the React Native property-setter
    /// convention (an `@objc dynamic` property named to match the JS prop).
    /// Called whenever the RN side pushes a new theme (e.g. the person
    /// drags a color field or flips a corner-radius preset in
    /// ThemeEditorScreen.tsx).
    @objc dynamic var themeJSON: NSString = "" {
        didSet {
            guard
                let data = (themeJSON as String).data(using: .utf8),
                let theme = try? JSONDecoder().decode(KeyboardThemeModel.self, from: data)
            else { return }
            hostingController.rootView = KeyboardPreviewContent(theme: theme)
        }
    }
}
