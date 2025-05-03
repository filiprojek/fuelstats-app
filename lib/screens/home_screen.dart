import 'package:flutter/material.dart';
import '../widgets/data_section.dart';

class HomeScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Fuel Stats')),
      body: SingleChildScrollView(
        child: Column(
          children: [
            DataSection(title: 'Fuel Consumption'),
            DataSection(title: 'Cost Over Time'),
            DataSection(title: 'Mileage Trends'),
          ],
        ),
      ),
    );
  }
}
