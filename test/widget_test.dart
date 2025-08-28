import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:android_fuelstats/main.dart';
import 'package:android_fuelstats/services/session_manager.dart';

void main() {
  testWidgets('shows login screen when not authenticated', (WidgetTester tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => SessionManager(),
        child: FuelStatsApp(),
      ),
    );

    expect(find.text('Log in to Fuel Stats'), findsOneWidget);
  });
}
