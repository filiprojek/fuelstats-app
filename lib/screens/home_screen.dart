import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../widgets/data_section.dart';
import '../services/session_manager.dart';

class HomeScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final session = Provider.of<SessionManager>(context);
    final vehicle = session.defaultVehicle;
    return Scaffold(
      body: SingleChildScrollView(
        child: Column(
          children: [
            SizedBox(height: 16),
            Text(
              vehicle != null
                  ? 'Showing stats for ${vehicle.name}'
                  : 'No default vehicle selected',
              style: TextStyle(fontSize: 16),
            ),
            DataSection(title: 'Fuel Consumption'),
            DataSection(title: 'Cost Over Time'),
            DataSection(title: 'Mileage Trends'),
          ],
        ),
      ),
    );
  }
}
