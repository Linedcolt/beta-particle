internal import ExpoModulesCore

class KeyboardPreviewModule: Module {
    func definition() -> ModuleDefinition {
        Name("KeyboardPreview")

        View(KeyboardPreviewView.self) {
            // JSON-encoded KeyboardThemeModel - see src/theme/types.ts and
            // KeyboardThemeModel in KeyboardThemeModel.swift (this module)
            // and KeyboardViewController.swift (the extension). All three
            // must agree on shape.
            Prop("themeJSON") { (view: KeyboardPreviewView, json: String) in
                view.setThemeJSON(json)
            }
        }
    }
}
