import Foundation

// Mirrors src/theme/layoutTypes.ts field-for-field. Also duplicated at
// modules/keyboard-preview/ios/KeyboardLayoutConfig.swift for the same
// reason KeyboardThemeModel is duplicated there - see the big comment at
// the top of KeyboardPreviewManager.swift. If you add a field here, add it
// in both Swift copies and the TS side, in the same shape.
struct KeyActionSpec: Codable {
    var type: String // "character" | "backspace" | "shift"
    var value: String? // only present when type == "character"
}

struct KeyOverride: Codable {
    var row: Int
    var index: Int
    var action: KeyActionSpec?
    var widthWeight: Double?
}

struct KeyboardLayoutConfig: Codable {
    var overrides: [KeyOverride]

    static let empty = KeyboardLayoutConfig(overrides: [])
}
