import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'services/session_manager.dart';
import 'screens/home_screen.dart';
import 'screens/add_screen.dart';
import 'screens/vehicles_screen.dart';
import 'screens/history_screen.dart';
import 'screens/user_settings.dart';
import 'screens/login.dart';
import 'screens/signup.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SessionManager().init();

  runApp(
    ChangeNotifierProvider(
      create: (_) => SessionManager(),
      child: FuelStatsApp(),
    ),
  );
}

class FuelStatsApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      theme: ThemeData.dark(),
      themeMode: ThemeMode.dark,
      debugShowCheckedModeBanner: false,
      home: MainNavigation(),
    );
  }
}

class MainNavigation extends StatefulWidget {
  const MainNavigation({super.key});

  @override
  _MainNavigationState createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  int _currentIndex = 0;

  bool get isAuthScreen => _currentIndex == 5 || _currentIndex == 6;

  Widget get currentTitle {
    switch (_currentIndex) {
      case 0:
        return Text("Fuel Stats");
      case 1:
        return Text("Add record");
      case 2:
        return Text("Vehicles");
      case 3:
        return Text("History");
      case 4:
        return Text("Settings");
      case 5:
        return Text("Login");
      case 6:
        return Text("Sign up");
      default:
        return Text("Fuel Stats");
    }
  }

  @override
  Widget build(BuildContext context) {
    final session = Provider.of<SessionManager>(context);

    // Auto-redirect to login if not logged in and not already on auth screens
    Future.delayed(Duration(milliseconds: 100), () {
      if (!session.isLoggedIn && !isAuthScreen) {
        setState(() => _currentIndex = 5);
      }
    });

      final screens = [
      HomeScreen(),
      AddScreen(),
      VehiclesScreen(),
      HistoryScreen(),
      UserSettingsScreen(
        onLogout: () {
          setState(() => _currentIndex = 5); // Go to login
        },
      ),
      LoginScreen(
        onSwitchToSignup: () {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            setState(() => _currentIndex = 6);
          });
        },
        onLoginSuccess: () {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            setState(() => _currentIndex = 0); // Go to Home
          });
        },
      ),
      SignupScreen(
        onSwitchToLogin: () {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            setState(() => _currentIndex = 5);
          });
        },
      ),
    ];

    return Scaffold(
      appBar: AppBar(
        title: currentTitle,
        actions: !isAuthScreen
            ? [
                IconButton(
                  icon: const Icon(Icons.person),
                  tooltip: "User settings",
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => UserSettingsScreen(
                          onLogout: () {
                            Navigator.pop(context); // Close settings
                            setState(() => _currentIndex = 5); // Go to Login
                          },
                        ),
                      ),
                    );
                  },
                ),
              ]
            : null,
      ),
      body: screens[_currentIndex],
      bottomNavigationBar: !isAuthScreen
          ? BottomNavigationBar(
              currentIndex: _currentIndex <= 3 ? _currentIndex : 0,
              onTap: (index) => setState(() => _currentIndex = index),
              backgroundColor: Colors.grey[900],
              selectedItemColor: Colors.white,
              unselectedItemColor: Colors.grey,
              items: const [
                BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
                BottomNavigationBarItem(icon: Icon(Icons.add), label: 'Add'),
                BottomNavigationBarItem(icon: Icon(Icons.directions_car), label: 'Vehicles'),
                BottomNavigationBarItem(icon: Icon(Icons.history), label: 'History'),
              ],
            )
          : null,
    );
  }
}

