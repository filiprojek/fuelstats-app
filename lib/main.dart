import 'package:flutter/material.dart';
import 'screens/home_screen.dart';
import 'screens/add_screen.dart';
import 'screens/vehicles_screen.dart';
import 'screens/history_screen.dart';
import 'screens/user_settings.dart';

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

  final List<Widget> _screens = [
    HomeScreen(),
    AddScreen(),
    VehiclesScreen(),
    HistoryScreen(),
    UserSettingsScreen(),
  ];

  final List<Widget> titles = [
    Text("Fuel Stats"),
    Text("Add record"),
    Text("Vehicles"),
    Text("History"),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: _currentIndex <= 3 ? titles[_currentIndex] : Text("Fuel Stats"),
        actions: [
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
        ],
      ),
      body: _screens[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
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
      ),
    );
  }
}
