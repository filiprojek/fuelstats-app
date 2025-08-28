import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/session_manager.dart';
import 'add_screen.dart';

class HistoryScreen extends StatelessWidget {
  String _formatNumber(num value) {
    if (value % 1 == 0) {
      return value.toInt().toString();
    }
    return value
        .toStringAsFixed(2)
        .replaceFirst(RegExp(r'0+$'), '')
        .replaceFirst(RegExp(r'[.]$'), '');
  }

  String _formatCurrency(num value) => '${_formatNumber(value)},-';

  String _formatDate(DateTime? date) {
    if (date == null) return '';
    final d = date.toLocal();
    final day = d.day.toString().padLeft(2, '0');
    final month = d.month.toString().padLeft(2, '0');
    return '$day.$month.${d.year}';
  }

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
              final date =
                  r.createdAt != null ? ' | ${_formatDate(r.createdAt!)}' : '';
              return ListTile(
                leading: Icon(Icons.local_gas_station, color: Colors.green),
                title: Text(
                    '${_formatNumber(r.liters)} L | ${_formatCurrency(r.pricePerLiter)}'),
                subtitle: Text(
                    'Total: ${_formatCurrency(r.totalPrice)} | Mileage: ${_formatNumber(r.mileage)} km$date'),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: Icon(Icons.edit, color: Colors.blue),
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
                        icon: Icon(Icons.delete, color: Colors.red),
                        onPressed: () async {
                          final confirm = await showDialog<bool>(
                            context: context,
                            builder: (context) => AlertDialog(
                              title: Text('Confirm Deletion'),
                              content: Text(
                                  'Are you sure you want to delete this record?'),
                              actions: [
                                TextButton(
                                  onPressed: () => Navigator.pop(context, false),
                                  child: Text('Cancel'),
                                ),
                                TextButton(
                                  onPressed: () => Navigator.pop(context, true),
                                  child: Text('Delete'),
                                ),
                              ],
                            ),
                          );
                          if (confirm == true) {
                            await session.removeRefuel(r.id!);
                          }
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
