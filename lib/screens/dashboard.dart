import 'package:flutter/material.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.local_gas_station_rounded, size: 64),
            SizedBox(height: 8),
            Text(
              "Fuel Stats",
              style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 8),
            Text(
              "Created by Filip Rojek",
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.normal),
            ),
            SizedBox(height: 8),
            Text(
              "https://filiprojek.cz",
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.normal),
            ),
          ],
        ),
      ),
    );
  }
}
