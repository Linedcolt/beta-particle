import UIKit
import SwiftUI
import KeyboardKit

// MARK: - Theme model
//
// This is a deliberate duplicate of the same types in
// targets/keyboard/KeyboardViewController.swift, not a shared import.
//
// This module compiles as its own local Expo module (its own CocoaPods
// target), and the keyboard extension is a separate Xcode target entirely -
// there's no clean way to share one Swift file between a Pod and an app
// extension target without introducing a second, fragile cross-tooling
// dependency (Pod <-> local Swift Package) on top of the SPM setup that
// scripts/add_swift_packages.rb already has to fight to get working. Given
// how much CI grief the Swift/Xcode side of this project has already
// caused, duplicating ~60 lines here is the lower-risk trade.
//
// If you change the theme shape: update this file, KeyboardViewController.
// swift, AND src/theme/types.ts. Same three-way discipline this project
// already has between the TS side and the extension - just one more place
// now.
struct ThemeColors: Codable {
    var background: String
    var keyBackground: String
    var keyBackgroundPressed: String
    var keyText: String
    var specialKeyBackground: String
    var accent: String
}

struct ThemeLayout: Codable {
    var keyCornerRadius: Double
    var keyboardHeight: String // "compact" | "regular" | "tall"
}

struct KeyboardThemeModel: Codable {
    var id: String
    var name: String
    var colors: ThemeColors
    var layout: ThemeLayout
    var hapticsEnabled: Bool
    var soundEnabled: Bool

    static let fallback = KeyboardThemeModel(
        id: "default",
        name: "iOS Default",
        colors: .init(
            background: "#D1D3D9",
            keyBackground: "#FFFFFF",
            keyBackgroundPressed: "#B0B3B9",
            keyText: "#000000",
            specialKeyBackground: "#ADB0B8",
            accent: "#007AFF"
        ),
        layout: .init(keyCornerRadius: 0.2, keyboardHeight: "regular"),
        hapticsEnabled: true,
        soundEnabled: true
    )
}

extension UIColor {
    convenience init(hex: String) {
        var s = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        s = s.replacingOccurrences(of: "#", with: "")
        var rgb: UInt64 = 0
        Scanner(string: s).scanHexInt64(&rgb)
        self.init(
            red: CGFloat((rgb & 0xFF0000) >> 16) / 255,
            green: CGFloat((rgb & 0x00FF00) >> 8) / 255,
            blue: CGFloat(rgb & 0x0000FF) / 255,
            alpha: 1
        )
    }
}

// MARK: - Same style override as the extension
//
// Byte-for-byte the same buttonStyle(for:isPressed:) logic as
// ThemedKeyboardStyleService in KeyboardViewController.swift. This is the
// piece that actually matters for "does the preview match reality" - if
// this ever drifts from the extension's version, the preview will again
// quietly lie about what the real keyboard looks like, which is the exact
// problem this whole module exists to fix. Diff the two on every change.
class ThemedKeyboardStyleService: KeyboardStyle.StandardStyleService {
    let theme: KeyboardThemeModel

    init(theme: KeyboardThemeModel, keyboardContext: KeyboardContext) {
        self.theme = theme
        super.init(keyboardContext: keyboardContext)
    }

    override func buttonStyle(
        for action: KeyboardAction,
        isPressed: Bool
    ) -> Keyboard.ButtonStyle {
        var style = super.buttonStyle(for: action, isPressed: isPressed)

        let isSpecial: Bool = {
            switch action {
            case .character: return false
            default: return true
            }
        }()

        let backgroundHex = isSpecial
            ? theme.colors.specialKeyBackground
            : (isPressed ? theme.colors.keyBackgroundPressed : theme.colors.keyBackground)

        style.backgroundColor = Color(UIColor(hex: backgroundHex))
        style.foregroundColor = Color(UIColor(hex: theme.colors.keyText))
        style.cornerRadius = CGFloat(theme.layout.keyCornerRadius) * 20
        return style
    }
}
