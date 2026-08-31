#!/usr/bin/env ruby
# frozen_string_literal: true
#
# Adds KeyboardKit as a remote Swift Package dependency to the Xcode project
# that `expo prebuild` just generated, links it into both the main app
# target and the keyboard extension target, and compiles the
# keyboard-preview native view directly into the main app target.
#
# WHY THIS SCRIPT EXISTS
# -----------------------
# @bacons/apple-targets (the Expo config plugin used for the keyboard
# extension target) does not yet have a stable, released way to declare SPM
# dependencies in expo-target.config.js - an attempt at this was closed in
# favor of a separate, not-yet-published plugin. Rather than depend on
# unpublished/experimental tooling, this script uses the `xcodeproj` Ruby
# gem - the same battle-tested library CocoaPods and fastlane use internally
# - to edit project.pbxproj directly.
#
# The keyboard-preview wiring rides along in this same script (rather than
# a separate one) for a specific reason: KeyboardPreviewContent.swift
# imports KeyboardKit, and KeyboardKit only exists on the main app target
# because of the SPM linking this script already does below. A separate
# CocoaPods pod (the old modules/keyboard-preview/expo-module.config.json
# approach) lives in its own Pods.xcodeproj and can never see an SPM
# package linked onto a target in *this* project, so it could never have
# compiled `import KeyboardKit` even with a correct podspec. Compiling
# these files straight into the `BetaParticle` target - the same place KeyboardKit
# is linked - is what actually makes that import resolve. See the comment
# in modules/keyboard-preview/ios/KeyboardPreviewManager.swift for the full
# story.

require "xcodeproj"

PROJECT_GLOB = Dir.glob("ios/*.xcodeproj").first
raise "No .xcodeproj found under ./ios - did `expo prebuild -p ios` run first?" unless PROJECT_GLOB

APP_TARGET_NAME = ENV.fetch("APP_TARGET_NAME", "BetaParticle")
KEYBOARD_TARGET_NAME = ENV.fetch("KEYBOARD_TARGET_NAME", "keyboard")

KEYBOARDKIT_URL = "https://github.com/KeyboardKit/KeyboardKit"
KEYBOARDKIT_PRODUCT = "KeyboardKit"
KEYBOARDKIT_MIN_VERSION = "9.0.0"

# Relative to this script's PROJECT_GLOB (i.e. relative to ios/), where the
# keyboard-preview module's native source lives.
KEYBOARD_PREVIEW_SOURCE_DIR = "../modules/keyboard-preview/ios"
KEYBOARD_PREVIEW_GROUP_NAME = "KeyboardPreview (inline)"

project = Xcodeproj::Project.open(PROJECT_GLOB)

def find_or_create_package_reference(project, url, min_version)
  existing = project.root_object.package_references&.find do |ref|
    ref.respond_to?(:repositoryURL) && ref.repositoryURL == url
  end
  return existing if existing

  ref = project.new(Xcodeproj::Project::Object::XCRemoteSwiftPackageReference)
  ref.repositoryURL = url
  ref.requirement = {
    "kind" => "upToNextMajorVersion",
    "minimumVersion" => min_version,
  }
  project.root_object.package_references ||= []
  project.root_object.package_references << ref
  ref
end

def link_product_to_target(project, target, package_ref, product_name)
  product = target.package_product_dependencies.find { |dep| dep.product_name == product_name }

  unless product
    product = project.new(Xcodeproj::Project::Object::XCSwiftPackageProductDependency)
    product.product_name = product_name
    product.package = package_ref
    target.package_product_dependencies << product
  end

  # Registering the product on the target above only records the *intent*
  # to link it. Xcode also needs a matching PBXBuildFile in the target's
  # Frameworks build phase - that's what actually feeds the module's search
  # paths to the compiler. This was the missing piece.
  frameworks_phase = target.frameworks_build_phase
  already_in_phase = frameworks_phase.files.any? { |bf| bf.respond_to?(:product_ref) && bf.product_ref == product }
  unless already_in_phase
    build_file = project.new(Xcodeproj::Project::Object::PBXBuildFile)
    build_file.product_ref = product
    frameworks_phase.files << build_file
  end
end

def find_target!(project, target_name)
  target = project.native_targets.find { |t| t.name == target_name }
  raise "Could not find a native target named '#{target_name}'. Targets found: #{project.native_targets.map(&:name)}" unless target

  target
end

# Adds the keyboard-preview .swift/.m sources as a group referencing
# modules/keyboard-preview/ios in place (no copying, so edits to those
# files don't need to be kept in sync with a duplicate), and compiles them
# into `target`'s Sources build phase if they aren't there already.
def add_keyboard_preview_sources(project, target, source_dir, group_name)
  absolute_source_dir = File.expand_path(source_dir, File.dirname(project.path))
  unless Dir.exist?(absolute_source_dir)
    raise "keyboard-preview source dir not found at #{absolute_source_dir} - did the repo layout change?"
  end

  group = project.main_group.children.find { |c| c.respond_to?(:display_name) && c.display_name == group_name }
  group ||= project.main_group.new_group(group_name, source_dir)

  filenames = Dir.children(absolute_source_dir).select { |f| f.end_with?(".swift", ".m") }.sort
  raise "No .swift/.m files found under #{absolute_source_dir}" if filenames.empty?

  existing_names = group.children.map { |c| c.respond_to?(:display_name) ? c.display_name : nil }

  filenames.each do |filename|
    file_ref = if existing_names.include?(filename)
      group.children.find { |c| c.respond_to?(:display_name) && c.display_name == filename }
    else
      group.new_reference(filename)
    end

    already_in_sources = target.source_build_phase.files.any? { |bf| bf.file_ref == file_ref }
    target.add_file_references([file_ref]) unless already_in_sources
  end

  puts "Compiled #{filenames.join(', ')} into #{target.name}'s Sources build phase."
end

package_ref = find_or_create_package_reference(project, KEYBOARDKIT_URL, KEYBOARDKIT_MIN_VERSION)

[APP_TARGET_NAME, KEYBOARD_TARGET_NAME].each do |target_name|
  target = find_target!(project, target_name)
  link_product_to_target(project, target, package_ref, KEYBOARDKIT_PRODUCT)
  puts "Linked #{KEYBOARDKIT_PRODUCT} -> #{target_name}"
end

# Only the main app target hosts the RN theme editor UI - the keyboard
# extension target never renders React Native views, so it has no use for
# this preview component.
app_target = find_target!(project, APP_TARGET_NAME)
add_keyboard_preview_sources(project, app_target, KEYBOARD_PREVIEW_SOURCE_DIR, KEYBOARD_PREVIEW_GROUP_NAME)

project.save
puts "Saved #{PROJECT_GLOB} with KeyboardKit SPM dependency and inline keyboard-preview sources."