import 'package:flutter/material.dart';
import 'screens/dashboard.dart';
import 'screens/login.dart';
import 'screens/add_record.dart';
import 'screens/history.dart';
import 'screens/settings.dart';
import 'screens/vehicles.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(CalculatorApp());
}

class CalculatorApp extends StatelessWidget {
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

  Widget get currentTitle {
    switch (_currentIndex) {
      case 0:
        return Text("Dashboard");
      case 1:
        return Text("Add Record");
      case 2:
        return Text("Vehicles");
      case 3:
        return Text("History");
      case 4:
        return Text("Settings");
      default:
        return Text("Fuel Stats");
    }
  }

  @override
  Widget build(BuildContext context) {
    final screens = [
      DashboardScreen(),
      AddRecordScreen(),
      VehiclesScreen(),
      HistoryScreen(),
      SettingsScreen(),
    ];

    return Scaffold(
      appBar: AppBar(
        title: currentTitle,
        actions: [
          IconButton(
            icon: const Icon(Icons.person),
            tooltip: "User settings",
            onPressed: () {
              setState(() {
                _currentIndex = 4;
              });
            },
          ),
        ],
      ),

      body: screens[_currentIndex],
      bottomNavigationBar: NavigationBar(
        onDestinationSelected: (int index) {
          setState(() {
            _currentIndex = index;
          });
        },
        selectedIndex: _currentIndex <= 3 ? _currentIndex : 0,
        indicatorColor:
            _currentIndex <= 3
                ? Theme.of(context).colorScheme.secondaryContainer
                : Theme.of(context).colorScheme.surface,
        backgroundColor: Theme.of(context).colorScheme.surface,
        destinations: const <Widget>[
          NavigationDestination(
            selectedIcon: Icon(Icons.home),
            icon: Icon(Icons.home),
            label: 'Home',
          ),
          NavigationDestination(icon: Icon(Icons.add), label: 'Add'),
          NavigationDestination(
            icon: Icon(Icons.directions_car),
            label: 'History',
          ),
        ],
      ),
      //bottomNavigationBar: BottomNavigationBar(
      //  currentIndex: _currentIndex <= 3 ? _currentIndex : 0,
      //  onTap: (index) => setState(() => _currentIndex = index),
      //  backgroundColor: Colors.grey[900],
      //  selectedItemColor: _currentIndex <= 3 ? Colors.white : Colors.grey,
      //  unselectedItemColor: Colors.grey,
      //  items: const [
      //    BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
      //    BottomNavigationBarItem(icon: Icon(Icons.add), label: 'Add'),
      //    BottomNavigationBarItem(
      //      icon: Icon(Icons.directions_car),
      //      label: 'Vehicles',
      //    ),
      //    BottomNavigationBarItem(icon: Icon(Icons.history), label: 'History'),
      //  ],
      //),
    );
  }
}
