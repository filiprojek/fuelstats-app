import 'package:flutter/material.dart';
import 'screens/home_screen.dart';
import 'screens/add_screen.dart';
import 'screens/vehicles_screen.dart';
import 'screens/history_screen.dart';
import 'screens/user_settings.dart';
import 'screens/login.dart';
import 'screens/signup.dart';

void main() {
  runApp(FuelStatsApp());
}

class FuelStatsApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      theme: ThemeData.dark(),
      themeMode: ThemeMode.dark,
      debugShowCheckedModeBanner: false,
      home: MainNavigation(),
      //home: LoginScreen(),
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
  bool loggedIn = false;
  bool get isAuthScreen => _currentIndex == 5 || _currentIndex == 6;

  @override
  void initState() {
    super.initState();

    if(loggedIn == false) {
      _currentIndex = 5;
    }
  }

  final List<Widget> titles = [
    Text("Fuel Stats"),
    Text("Add record"),
    Text("Vehicles"),
    Text("History"),
  ];

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
    List<Widget> screens = [
      HomeScreen(),
      AddScreen(),
      VehiclesScreen(),
      HistoryScreen(),
      UserSettingsScreen(),
      LoginScreen(
        onSwitchToSignup: () {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            setState(() => _currentIndex = 6);
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
        actions: !isAuthScreen ? [
          IconButton(
            icon: const Icon(Icons.person),
            tooltip: "User settings",
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => UserSettingsScreen()),
              );
            },
          ),
        ] : null,
      ),
      body: screens[_currentIndex],
      bottomNavigationBar: !isAuthScreen ?
        BottomNavigationBar(
          currentIndex: _currentIndex <= 3 ? _currentIndex : 0,
          onTap: (index) => setState(() => _currentIndex = index),
          backgroundColor: Colors.grey[900],
          selectedItemColor: Colors.white,
          unselectedItemColor: Colors.grey,
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
            BottomNavigationBarItem(icon: Icon(Icons.add), label: 'Add'),
            BottomNavigationBarItem(
              icon: Icon(Icons.directions_car),
              label: 'Vehicles',
            ),
            BottomNavigationBarItem(icon: Icon(Icons.history), label: 'History'),
          ],
        ) : null,
    );
  }
}
