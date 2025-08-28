import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/session_manager.dart';
import 'add_screen.dart';

class HistoryScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Consumer<SessionManager>(
      builder: (context, session, _) {
        final refuels = [...session.refuels];
        refuels.sort((a, b) {
          final aDate = a.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0);
          final bDate = b.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0);
          return bDate.compareTo(aDate);
        });

        if (refuels.isEmpty) {
          return Scaffold(
            body: Center(child: Text('No history yet')),
          );
        }

        return Scaffold(
          body: ListView.builder(
            itemCount: refuels.length,
            itemBuilder: (context, index) {
              final r = refuels[index];
              return ListTile(
                leading: Icon(Icons.local_gas_station),
                title: Text('${r.liters} L @ ${r.pricePerLiter}'),
                subtitle: Text('Total: ${r.totalPrice} | Mileage: ${r.mileage}'),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: Icon(Icons.edit),
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => AddScreen(refuel: r),
                          ),
                        );
                      },
                    ),
                    if (r.id != null)
                      IconButton(
                        icon: Icon(Icons.delete),
                        onPressed: () async {
                          await session.removeRefuel(r.id!);
                        },
                      ),
                  ],
                ),
              );
            },
          ),
        );
      },
    );
  }
}
