# FuelStats

FuelStats is a Flutter application for tracking vehicle fuel consumption and service history. It lets you record refuels and maintenance, manage multiple vehicles, and visualise trends in cost and efficiency.

## Features
- Email-based authentication with login and sign-up flows
- Manage vehicles and choose a default one
- Log refuels with liters, price, mileage and notes
- Record maintenance/service events, including cost and optional photos
- Stats dashboard with consumption figures and kilometers driven
- Charts for gas price and fuel consumption trends
- User settings screen showing app version and build number

## Configuration
The app communicates with a backend API. Provide its base URL at build time using a compile-time define:

```bash
flutter run --dart-define=API_BASE_URL=https://api.example.com
```

If not supplied, the app defaults to `http://10.123.0.102:6060`.

## Getting Started
1. Install [Flutter](https://flutter.dev) (3.7 or later).
2. Fetch dependencies:
   ```bash
   flutter pub get
   ```
3. Run tests:
   ```bash
   flutter test
   ```
4. Launch the application:
   ```bash
   flutter run --dart-define=API_BASE_URL=http://localhost:6060
   ```

## CI/CD
A GitHub Actions workflow builds a profile APK on each push to the `dev` branch. The workflow reads the version from `pubspec.yaml`, uses the repository commit count as the build number, and uploads the APK as an artifact.

## Tests
Widget tests reside in the `test/` directory and can be executed with `flutter test`.

