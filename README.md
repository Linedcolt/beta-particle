# kbapp - custom iOS keyboard (Expo/TS host app + native KeyboardKit extension)

A from-scratch, MIT/free-tier custom iOS keyboard, built without ever needing
a Mac locally. The RN/Expo app is a theme editor; the actual keyboard is a
native Swift extension powered by [KeyboardKit](https://keyboardkit.com),
styled at runtime from whatever theme you save in the app. GitHub Actions
(macOS runner) does all the Xcode/Swift building and hands you back a `.ipa`
to sideload with AltStore or SideStore.

## What's in here

```
App.tsx                          RN host app entry
src/theme/                       Theme schema + App Group read/write
src/screens/ThemeEditorScreen.tsx   Color/layout editor with a JS preview
targets/keyboard/                The iOS Custom Keyboard Extension target
  expo-target.config.js            Target config for @bacons/apple-targets
  KeyboardViewController.swift     KeyboardKit setup + theme application
scripts/
  add_swift_packages.rb            Links KeyboardKit via SPM into the Xcode
                                    project (see "The one risky part" below)
  package_ipa.sh                   Archives -> ad-hoc signs -> zips the .ipa
.github/workflows/build-ipa.yml  The CI pipeline
```

`ios/` is intentionally **not** committed - it's regenerated fresh by
`expo prebuild` every CI run (this is Expo's "Continuous Native Generation"
pattern). Don't hand-edit anything under `ios/` locally; edit `app.json` or
the files under `targets/` instead.

## Before your first push: personalize the identifiers

Three files currently use placeholder identifiers (`com.example.kbapp` /
`group.com.example.kbapp`). They must all match each other exactly - swap
`example` for something like your GitHub username in all three:

- `app.json` -> `expo.ios.bundleIdentifier` and the app-group entitlement
- `targets/keyboard/expo-target.config.js` mirrors the app.json value
  automatically, so nothing to change there
- `src/theme/themeStorage.ts` -> `APP_GROUP`
- `targets/keyboard/KeyboardViewController.swift` -> `ThemeStore.appGroup`

You don't need `ios.appleTeamId` set in `app.json` for this pipeline - that
field only matters if you later switch to fully signing in CI yourself with
a real paid Apple Developer account. Here, AltStore/SideStore determine the
real team ID from your own Apple ID at install time on your phone.

## Getting this onto GitHub

You don't need Xcode or a Mac for any of this - just git and a GitHub
account.

```bash
# from inside this folder
git branch -M main
git add .
git commit -m "Initial scaffold: RN theme editor + KeyboardKit extension"
```

Create an empty repo on GitHub (via the web UI, "New repository" - don't
initialize it with a README/gitignore, since you already have those), then:

```bash
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

Pushing to `main` automatically triggers the build (see the `on: push`
trigger in `build-ipa.yml`). You can also trigger it manually from the
**Actions** tab -> "Build iOS IPA" -> "Run workflow", which is handy once
you're iterating and don't want every small commit to kick off a ~10-15
minute macOS build.

## Getting the .ipa

GitHub -> your repo -> **Actions** tab -> click the latest run -> scroll to
**Artifacts** -> download `kbapp-ipa`. Unzip it to get `kbapp-unsigned.ipa`.

## Sideloading (you're outside the EU, so classic AltStore/SideStore, not AltStore PAL)

1. Install [AltServer](https://faq.altstore.io/getting-started/installing-altserver)
   on a Windows/Mac/Linux machine once, or set up
   [SideStore](https://sidestore.io) if you'd rather not tether to a
   computer after the first install.
2. Open AltStore on your iPhone, go to **My Apps**, tap **+**, and pick the
   `.ipa` you downloaded.
3. Sign in with your Apple ID when prompted (free account is fine - no paid
   Apple Developer Program needed).
4. On the phone: **Settings -> General -> Keyboard -> Keyboards -> Add New
   Keyboard...** -> select kbapp.

Free-account caveats: the app needs re-signing every 7 days (AltStore/
SideStore do this automatically if left running/refreshed), and you're
limited to 3 sideloaded apps at a time unless you add
[LiveContainer](https://github.com/LiveContainer/LiveContainer) to get
around that limit.

## The one risky part: linking KeyboardKit via SPM

`@bacons/apple-targets` (the plugin that generates the keyboard extension
target) doesn't yet have a stable, released way to declare Swift Package
dependencies - the attempt at this was shelved in favor of a separate plugin
that isn't published yet. So `scripts/add_swift_packages.rb` edits
`project.pbxproj` directly with the `xcodeproj` Ruby gem (the same library
CocoaPods and fastlane use) right after `expo prebuild`.

This is the single step in the pipeline I could not fully verify end-to-end
without a real Xcode/macOS toolchain (I validated the target-generation and
App Group entitlement wiring for real by running `expo prebuild` in a
sandbox - that part works exactly as described above - but I can't compile
Swift or run `xcodebuild` outside of macOS). If the CI run fails specifically
at **Archive (unsigned)** with something like:

- `no such module 'KeyboardKit'` -> the SPM link step didn't actually attach
  the package to the target that's failing to compile. Check the "Link
  KeyboardKit via Swift Package Manager" step's log output for which
  target(s) it reported linking.
- `Multiple commands produce ... KeyboardKit.framework` / duplicate-symbol
  errors at the final link phase -> the package is linked into both the app
  and the extension in a way that's double-embedding it. Per KeyboardKit's
  own guidance, try removing the extension target from
  `[APP_TARGET_NAME, KEYBOARD_TARGET_NAME]` in `add_swift_packages.rb` so
  it's only linked to the main app.
- Anything about `XCRemoteSwiftPackageReference` / `XCSwiftPackageProductDependency`
  serialization -> likely an `xcodeproj` gem version quirk; try pinning an
  older/newer `xcodeproj` version in the "Install xcodeproj gem" step.

**Debugging without owning a Mac:** you can get an interactive shell on a
real macOS GitHub Actions runner using
[`mxschmitt/action-tmate`](https://github.com/mxschmitt/action-tmate). Add
this as a step (right before the one that's failing) temporarily:

```yaml
- uses: mxschmitt/action-tmate@v3
```

The workflow log will print an SSH command you can run from any terminal to
drop into a shell on the actual runner - from there you can run
`cat ios/kbapp.xcodeproj/project.pbxproj`, inspect the generated project with
`xcodebuild -list`, hand-run `xcodebuild archive` yourself with `-verbose`,
or even try adding the package by hand with `xcodebuild
-resolvePackageDependencies` to see the real error. It's not a GUI, so you
can't literally open Xcode's window, but it's the closest thing to "having a
Mac" you'll get for free. Remove the step again once you're done (it keeps
the job alive and billing until you disconnect or it times out).

## What's solid vs. what needs your eyes

Verified for real while building this scaffold (ran `expo prebuild` and
inspected the output): the keyboard extension target gets created, embedded
into the app via "Embed Foundation Extensions", and the App Group
entitlement is correctly mirrored into both the app's and the extension's
entitlements files.

Not verified (needs Xcode to actually compile): the exact KeyboardKit Swift
API surface in `KeyboardViewController.swift` (`KeyboardApp`,
`keyboardAppValue`, `viewWillSetupKeyboardView`, `KeyboardStyle.StandardStyleService`).
KeyboardKit ships frequent releases and has renamed things between major
versions before. Cross-check
[keyboardkit.com/getting-started](https://keyboardkit.com/getting-started)
and the styling guide once you get your first successful archive, and adjust
names if Xcode's error messages point at a mismatch.

## Iterating

Each push to `main` (or manual "Run workflow") costs a full macOS build
(~10-15 min of GitHub's free macOS-runner minutes, which are consumed
faster than Linux minutes - check your usage in Settings -> Billing if
you're on a free personal account). Consider doing several small
config/Swift edits between runs rather than triggering a build per line
changed.
