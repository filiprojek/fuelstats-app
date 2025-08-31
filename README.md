# android_fuelstats

A new Flutter project.

## CI/CD

A GitHub Actions workflow builds a profile APK on each push to the `dev`
branch. The workflow reads the version name from `pubspec.yaml`, uses the
repository's commit count as the build number, and uploads the resulting APK
as a build artifact.

The app's User Settings screen displays the current version and build number
retrieved at runtime.

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Lab: Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Cookbook: Useful Flutter samples](https://docs.flutter.dev/cookbook)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.
