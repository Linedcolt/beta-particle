import UIKit
import KeyboardKit
import SwiftUI

// MARK: - Theme model
//
// Mirrors src/theme/types.ts field-for-field. If you add a field on the TS
// side, add it here too, in the same shape, or decoding will just ignore it
// (Codable silently drops unknown/missing keys with defaults below).
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

// MARK: - Reading the theme written by the RN app
//
// Must use the exact same App Group id as app.json and
// targets/keyboard/expo-target.config.js.
enum ThemeStore {
    static let appGroup = "group.com.Linedcolt.kbapp"
    static let themeKey = "activeTheme" // matches THEME_KEY in themeStorage.ts

    static func loadActiveTheme() -> KeyboardThemeModel {
        guard
            let defaults = UserDefaults(suiteName: appGroup),
            let json = defaults.string(forKey: themeKey),
            let data = json.data(using: .utf8)
        else {
            return .fallback
        }
        return (try? JSONDecoder().decode(KeyboardThemeModel.self, from: data)) ?? .fallback
    }

    // TEMPORARY DIAGNOSTIC — remove once theming is confirmed working.
    // Reports exactly where the read pipeline is failing, since a silent
    // `.fallback` gives no signal on *why* it fell back:
    //  - "no app group" -> UserDefaults(suiteName:) itself returned nil.
    //    This means the App Group entitlement isn't actually active for
    //    this signed/installed build (common after re-signing via
    //    AltStore/SideStore if the App Group wasn't included in the
    //    profile they generated).
    //  - "no stored value" -> the suite opened fine, but nothing has ever
    //    been written under this key from this exact installed app group
    //    (e.g. the main app and the keyboard ended up with two different
    //    app group containers, or nothing was saved yet).
    //  - "decode failed: <raw>" -> a string WAS found, but JSONDecoder
    //    couldn't turn it into KeyboardThemeModel. Shows the raw string so
    //    you can see whether it's malformed, truncated, or shaped
    //    differently than the Swift struct expects.
    //  - "ok: <name>" -> everything worked; shows the theme's `name` field.
    static func debugStatus() -> String {
        guard let defaults = UserDefaults(suiteName: appGroup) else {
            return "no app group"
        }
        guard let json = defaults.string(forKey: themeKey) else {
            return "no stored value"
        }
        guard let data = json.data(using: .utf8) else {
            return "decode failed: (bad utf8) \(json.prefix(80))"
        }
        do {
            let decoded = try JSONDecoder().decode(KeyboardThemeModel.self, from: data)
            return "ok: \(decoded.name)"
        } catch {
            return "decode failed: \(error) | raw: \(json.prefix(120))"
        }
    }
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

// MARK: - Custom styling driven by the shared theme
//
// KeyboardKit lets you swap in your own KeyboardStyleService to override
// per-key colors/fonts/shapes. We wrap the standard style service and patch
// in colors from our theme, so anything we *don't* override still falls
// back to KeyboardKit's faithful system-keyboard look.
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

// MARK: - Controller

class KeyboardViewController: KeyboardInputViewController {

    override func viewWillSetupKeyboardView() {
        let theme = ThemeStore.loadActiveTheme()

        // Swap in our theme-aware style service before the keyboard view
        // is built for this session.
        services.styleService = ThemedKeyboardStyleService(
            theme: theme,
            keyboardContext: state.keyboardContext
        )

        setupKeyboardView { [weak self] controller in
            guard let self else { return AnyView(EmptyView()) }
            return AnyView(
                VStack(spacing: 0) {
                    // TEMPORARY DIAGNOSTIC BANNER — remove once theming works.
                    // Tap into any text field with this build installed and
                    // read what this says; it tells us exactly which stage
                    // of the read pipeline is failing.
                    Text(ThemeStore.debugStatus())
                        .font(.system(size: 10, design: .monospaced))
                        .foregroundColor(.white)
                        .padding(4)
                        .frame(maxWidth: .infinity)
                        .background(Color.red)

                    KeyboardView(
                        state: self.state,
                        services: self.services,
                        buttonContent: { $0.view },
                        buttonView: { $0.view },
                        collapsedView: { $0.view },
                        emojiKeyboard: { $0.view },
                        toolbar: { $0.view }
                    )
                }
                .background(Color(UIColor(hex: theme.colors.background)))
            )
        }
    }
}