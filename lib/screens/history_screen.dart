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

  String _formatDateTime(DateTime? date) {
    if (date == null) return '';
    final d = date.toLocal();
    final day = d.day.toString().padLeft(2, '0');
    final month = d.month.toString().padLeft(2, '0');
    final hour = d.hour.toString().padLeft(2, '0');
    final minute = d.minute.toString().padLeft(2, '0');
    return '$day.$month.${d.year} $hour:$minute';
  }

  TableRow _detailRow(String label, String value) {
    return TableRow(
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 2, bottom: 2, right: 16),
          child: Text(label, style: TextStyle(fontWeight: FontWeight.bold)),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 2),
          child: Text(value),
        ),
      ],
    );
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
              return ListTile(
                leading: Icon(Icons.local_gas_station, color: Colors.green),
                title: Row(
                  children: [
                    Text(_formatCurrency(r.totalPrice)),
                    SizedBox(width: 16),
                    Text('${_formatCurrency(r.pricePerLiter)}/L'),
                    SizedBox(width: 16),
                    Text('${_formatNumber(r.liters)} L'),
                  ],
                ),
                subtitle: Text(_formatDateTime(r.createdAt)),
                onTap: () {
                  showDialog(
                    context: context,
                    builder: (context) => AlertDialog(
                      title: Text('Refuel Details'),
                      content: Table(
                        columnWidths: {0: IntrinsicColumnWidth()},
                        children: [
                          _detailRow('Total', _formatCurrency(r.totalPrice)),
                          _detailRow('Price/L', '${_formatCurrency(r.pricePerLiter)}'),
                          _detailRow('Liters', '${_formatNumber(r.liters)} L'),
                          _detailRow('Mileage', '${_formatNumber(r.mileage)} km'),
                          if (r.note != null && r.note!.isNotEmpty)
                            _detailRow('Note', r.note!),
                          _detailRow('Date', _formatDateTime(r.createdAt)),
                        ],
                      ),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(context),
                          child: Text('Close'),
                        ),
                      ],
                    ),
                  );
                },
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: Icon(Icons.edit, color: Colors.blue),
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => AddScreen(refuel: r, standalone: true),
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
