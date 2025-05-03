import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';

class UserSettingsScreen extends StatelessWidget {
  Future<String> _getVersion() async {
    final info = await PackageInfo.fromPlatform();
    //return 'Version: ${info.version}+${info.buildNumber}';
    return 'Version: ${info.version}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('User settings')),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              "Test User",
              style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
            ),

            SizedBox(height: 20),
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
            SizedBox(height: 8),
            FutureBuilder<String>(
              future: _getVersion(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.done) {
                  return Text(
                    snapshot.data ?? '',
                    style: TextStyle(color: Colors.grey),
                  );
                } else {
                  return SizedBox.shrink();
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}
