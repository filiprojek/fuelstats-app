import 'package:flutter/material.dart';

class UserSettingsScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('User settings')),
      body: Center(
        child: Column(
          spacing: 20.0,
          children: [
            const Text(
              "Test User",
              style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
            ),
            ElevatedButton.icon(
              onPressed: () {
                // TODO: Add sign-out logic here
              },
              icon: Icon(Icons.logout),
              label: Text("Sign Out"),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.redAccent,
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
