#!/usr/bin/env ruby
# frozen_string_literal: true
#
# Adds KeyboardKit as a remote Swift Package dependency to the Xcode project
# that `expo prebuild` just generated, and links it into both the main app
# target and the keyboard extension target.
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

require "xcodeproj"

PROJECT_GLOB = Dir.glob("ios/*.xcodeproj").first
raise "No .xcodeproj found under ./ios - did `expo prebuild -p ios` run first?" unless PROJECT_GLOB

APP_TARGET_NAME = ENV.fetch("APP_TARGET_NAME", "kbapp")
KEYBOARD_TARGET_NAME = ENV.fetch("KEYBOARD_TARGET_NAME", "keyboard")

KEYBOARDKIT_URL = "https://github.com/KeyboardKit/KeyboardKit"
KEYBOARDKIT_PRODUCT = "KeyboardKit"
KEYBOARDKIT_MIN_VERSION = "9.0.0"

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

package_ref = find_or_create_package_reference(project, KEYBOARDKIT_URL, KEYBOARDKIT_MIN_VERSION)

[APP_TARGET_NAME, KEYBOARD_TARGET_NAME].each do |target_name|
  target = project.native_targets.find { |t| t.name == target_name }
  raise "Could not find a native target named '#{target_name}'. Targets found: #{project.native_targets.map(&:name)}" unless target

  link_product_to_target(project, target, package_ref, KEYBOARDKIT_PRODUCT)
  puts "Linked #{KEYBOARDKIT_PRODUCT} -> #{target_name}"
end

project.save
puts "Saved #{PROJECT_GLOB} with KeyboardKit SPM dependency."