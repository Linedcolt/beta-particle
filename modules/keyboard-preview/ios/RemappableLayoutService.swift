import KeyboardKit

// Wraps KeyboardKit's REAL standard layout service and only touches the
// specific key slots the person has overridden. Everything not explicitly
// overridden falls straight through to KeyboardKit's own logic, unmodified
// - locale-specific input sets, orientation, dictation replacement,
// numeric/symbolic/url/email row variants, all of it. That logic lives in
// KeyboardLayout+iPhoneLayoutService.swift and is genuinely deep; the goal
// here is to never need to re-derive any of it.
//
// SCOPE: only rows 0-2 (the three letter rows) are touched. Row 3 (space/
// return/globe/dictation/keyboard-switcher) is deliberately left alone -
// which keys appear there, and in what order, depends on locale,
// orientation, and keyboard type (see `bottomActions(for:)` in the file
// above). Correctly re-deriving "the Nth key in the bottom row" across all
// of that isn't worth the risk for a first pass at remapping. A future
// pass could add bottom-row support once there's a specific need for it.
//
// `StandardLayoutService`, which this subclasses, is marked deprecated in
// KeyboardKit 9.x in favor of a view-modifier-based API arriving in a
// future major version. It's still what `.standard()` resolves to today
// (see Keyboard+Services.swift) and this project is pinned to the 9.x line
// (scripts/add_swift_packages.rb), so it'll keep working - just worth
// knowing this'll need revisiting on a future KeyboardKit major upgrade.
class RemappableLayoutService: KeyboardLayout.StandardLayoutService {
    var layoutConfig: KeyboardLayoutConfig

    init(layoutConfig: KeyboardLayoutConfig) {
        self.layoutConfig = layoutConfig
    }

    override func keyboardLayout(for context: KeyboardContext) -> KeyboardLayout {
        var layout = super.keyboardLayout(for: context)
        guard context.keyboardType == .alphabetic else { return layout }
        guard !layoutConfig.overrides.isEmpty else { return layout }

        for rowIndex in 0...2 {
            guard rowIndex < layout.itemRows.count else { continue }
            var row = layout.itemRows[rowIndex]

            // Real, tappable keys only - skip KeyboardKit's own invisible
            // margin-spacer items (its own internal convention for
            // identifying them, e.g. in KeyboardLayout+BaseLayoutService.
            // swift) used to center a shorter row (the 9-letter home row)
            // under a longer one (the 10-letter top row). This keeps
            // "index" meaning what you'd count by eye on the keyboard,
            // regardless of that bookkeeping.
            let realPositions = row.indices.filter { !isMarginItem(row[$0]) }

            for override in layoutConfig.overrides where override.row == rowIndex {
                guard override.index >= 0, override.index < realPositions.count else { continue }
                let itemIndex = realPositions[override.index]
                var item = row[itemIndex]

                if let action = override.action {
                    switch action.type {
                    case "character":
                        if let value = action.value, !value.isEmpty {
                            item.action = .character(value)
                        }
                    case "backspace":
                        item.action = .backspace
                    case "shift":
                        item.action = .shift(context.keyboardCase)
                    default:
                        break
                    }
                }

                if let weight = override.widthWeight, weight > 0 {
                    // .inputPercentage is a multiplier on the shared
                    // "input key" width unit that KeyboardKit's own width-
                    // resolution algorithm (KeyboardLayout+Size.swift)
                    // already redistributes remaining row space around -
                    // so untouched keys automatically shrink/grow to keep
                    // the row filling full width, the same way KeyboardKit
                    // itself keeps rows filled.
                    item.size = .init(
                        width: .inputPercentage(weight),
                        height: item.size.height
                    )
                }

                row[itemIndex] = item
            }

            layout.itemRows[rowIndex] = row
        }

        return layout
    }
}

private func isMarginItem(_ item: KeyboardLayout.Item) -> Bool {
    switch item.action {
    case .characterMargin, .none: return true
    default: return false
    }
}
