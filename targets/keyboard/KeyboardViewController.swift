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

// MARK: - KeyboardKit app definition
//
// NOTE: this is KeyboardKit's documented "KeyboardApp" setup pattern as of
// the 8.x/9.x line (see https://keyboardkit.com/getting-started). KeyboardKit
// ships frequent releases - if `KeyboardApp`, `keyboardAppValue`, or the
// style-service hook names below don't match what Xcode's autocomplete shows
// once this actually compiles, check the current "Getting started" +
// "Styling" guides on keyboardkit.com and adjust. This file cannot be
// compiled or type-checked outside of Xcode, so treat it as a strong
// starting draft, not a guarantee.
extension KeyboardApp {
    static var app: KeyboardApp {
        .init(
            name: "kbapp",
            // licenseKey is only required if you add KeyboardKit Pro later.
            // Leave unset to stay on the free, MIT-core feature set.
            appGroupId: ThemeStore.appGroup,
            locales: [.english]
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

    override func viewDidLoad() {
        keyboardAppValue = .app
        super.viewDidLoad()
    }

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
                SystemKeyboard(
                    state: self.state,
                    services: self.services
                )
                .background(Color(UIColor(hex: theme.colors.background)))
            )
        }
    }
}
