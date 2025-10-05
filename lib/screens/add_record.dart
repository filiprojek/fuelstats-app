import 'package:flutter/material.dart';

class AddRecordScreen extends StatelessWidget {
  const AddRecordScreen({super.key});

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
              "Add Record",
              style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }
}
