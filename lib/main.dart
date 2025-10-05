import 'package:flutter/material.dart';
import 'screens/dashboard.dart';
import 'screens/login.dart';

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
        return Text("Fuel Stats");
      default:
        return Text("Fuel Stats");
    }
  }

  @override
  Widget build(BuildContext context) {
    final screens = [DashboardScreen(), LoginScreen()];

    return Scaffold(
      appBar: AppBar(title: currentTitle),
      body: screens[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex <= 3 ? _currentIndex : 0,
        onTap: (index) => setState(() => _currentIndex = index),
        backgroundColor: Colors.grey[900],
        selectedItemColor: Colors.white,
        unselectedItemColor: Colors.grey,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.info), label: 'About'),
          BottomNavigationBarItem(icon: Icon(Icons.info), label: 'About'),
        ],
      ),
    );
  }
}
