import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:provider/provider.dart';
import '../services/session_manager.dart';

class UserSettingsScreen extends StatelessWidget {
  final VoidCallback onLogout;

  const UserSettingsScreen({required this.onLogout, super.key});

  Future<String> _getVersion() async {
    final info = await PackageInfo.fromPlatform();
    return 'Version: ${info.version}+${info.buildNumber}';
  }

  @override
  Widget build(BuildContext context) {
    final session = Provider.of<SessionManager>(context);
    final userName = session.name ?? "Unknown User"; // fallback just in case
    final userEmail = session.email ?? '';

    return Scaffold(
      appBar: AppBar(title: Text('User settings')),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              userName,
              style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 8),
            if (userEmail.isNotEmpty)
              Text(
                userEmail,
                style: TextStyle(fontSize: 16),
              ),
            SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: () async {
                await session.logout();
                onLogout();
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

