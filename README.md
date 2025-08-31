# Fuel Stats

Fuel Stats is a Flutter application for tracking vehicle fuel consumption and service history. It lets you record refuels and maintenance, manage multiple vehicles, and visualise trends in cost and efficiency.

## Features
- Email-based authentication with login and sign-up flows
- Manage vehicles and choose a default one
- Log refuels with liters, price, mileage and notes
- Record maintenance/service events, including cost and optional photos
- Stats dashboard with consumption figures and kilometers driven
- Charts for gas price and fuel consumption trends

## Platform Support
The app is tested only on Android. A web build should also work, but iOS, macOS, Windows, and Linux have not been tested.

## Configuration
The app communicates with a Node.js backend maintained in a separate project: [Fuel Stats Server](https://github.com/filiprojek/fuelstats-server).
Provide the server's base URL at build time using a compile-time define:

```bash
flutter run --dart-define=API_BASE_URL=https://api.example.com
```

## Getting Started
1. Install [Flutter](https://flutter.dev) (3.7 or later).
2. Fetch dependencies:
   ```bash
   flutter pub get
   ```
3. Launch the application:
   ```bash
   flutter run --dart-define=API_BASE_URL=http://localhost:6060
   ```

## CI/CD
A GitHub Actions workflow builds a profile APK on each push to the `dev` branch. The workflow reads the version from `pubspec.yaml`, uses the repository commit count as the build number, and uploads the APK as an artifact.


