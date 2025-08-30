import 'dart:ui';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/refuel.dart';
import '../models/service.dart';
import '../models/vehicle.dart';
import '../services/session_manager.dart';
import 'add_screen.dart';
import 'add_service_screen.dart';

class HistoryScreen extends StatefulWidget {
  @override
  _HistoryScreenState createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _filter = 'all';
  String _search = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

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

  bool _matchesSearch(Refuel? r, ServiceRecord? s) {
    final q = _search.toLowerCase();
    if (q.isEmpty) return true;
    if (r != null) {
      return (r.note ?? '').toLowerCase().contains(q) ||
          r.fuelType.label.toLowerCase().contains(q);
    } else if (s != null) {
      return s.displayType.toLowerCase().contains(q) ||
          (s.note ?? '').toLowerCase().contains(q) ||
          (s.shop ?? '').toLowerCase().contains(q);
    }
    return false;
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<SessionManager>(
      builder: (context, session, _) {
        final items = <_HistoryItem>[];
        for (final r in session.refuels) {
          items.add(_HistoryItem(date: r.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0), refuel: r));
        }
        for (final s in session.services) {
          items.add(_HistoryItem(date: s.date ?? s.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0), service: s));
        }
        items.sort((a, b) => b.date.compareTo(a.date));

        final filtered = items.where((i) {
          if (_filter == 'refuel' && i.refuel == null) return false;
          if (_filter == 'service' && i.service == null) return false;
          return _matchesSearch(i.refuel, i.service);
        }).toList();

        return Scaffold(
          body: Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    prefixIcon: Icon(Icons.search),
                    hintText: 'Search...',
                  ),
                  onChanged: (v) => setState(() => _search = v),
                ),
              ),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    const SizedBox(width: 8),
                    ChoiceChip(
                      label: Text('All'),
                      selected: _filter == 'all',
                      onSelected: (_) => setState(() => _filter = 'all'),
                    ),
                    const SizedBox(width: 8),
                    ChoiceChip(
                      label: Text('Refuels'),
                      selected: _filter == 'refuel',
                      onSelected: (_) => setState(() => _filter = 'refuel'),
                    ),
                    const SizedBox(width: 8),
                    ChoiceChip(
                      label: Text('Services'),
                      selected: _filter == 'service',
                      onSelected: (_) => setState(() => _filter = 'service'),
                    ),
                    const SizedBox(width: 8),
                  ],
                ),
              ),
              Expanded(
                child: filtered.isEmpty
                    ? Center(child: Text('No history yet'))
                    : ListView.builder(
                        itemCount: filtered.length,
                        itemBuilder: (context, index) {
                          final item = filtered[index];
                          if (item.refuel != null) {
                            final r = item.refuel!;
                            final textStyle = const TextStyle(
                                fontFeatures: [FontFeature.tabularFigures()]);
                            return ListTile(
                              leading: Icon(Icons.local_gas_station, color: Colors.green),
                              title: Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      '${_formatNumber(r.liters)} L',
                                      style: textStyle,
                                    ),
                                  ),
                                  Expanded(
                                    child: Text(
                                      '${_formatCurrency(r.pricePerLiter)}/L',
                                      textAlign: TextAlign.center,
                                      style: textStyle,
                                    ),
                                  ),
                                  Expanded(
                                    child: Text(
                                      _formatCurrency(r.totalPrice),
                                      textAlign: TextAlign.end,
                                      style: textStyle,
                                    ),
                                  ),
                                ],
                              ),
                              subtitle: Text(_formatDateTime(r.createdAt), style: textStyle),
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
                                            content: Text('Are you sure you want to delete this record?'),
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
                          } else {
                            final s = item.service!;
                            final textStyle = const TextStyle(
                                fontFeatures: [FontFeature.tabularFigures()]);
                            return ListTile(
                              leading: Icon(Icons.build, color: Colors.orangeAccent),
                              title: Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      s.displayType,
                                      style: textStyle,
                                    ),
                                  ),
                                  Expanded(
                                    child: Text(
                                      _formatCurrency(s.cost),
                                      textAlign: TextAlign.end,
                                      style: textStyle,
                                    ),
                                  ),
                                ],
                              ),
                              subtitle: Text(_formatDateTime(s.date), style: textStyle),
                              onTap: () {
                                showDialog(
                                  context: context,
                                  builder: (context) => AlertDialog(
                                    title: Text('Service Details'),
                                    content: SingleChildScrollView(
                                      child: Column(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Table(
                                            columnWidths: {0: IntrinsicColumnWidth()},
                                            children: [
                                              _detailRow('Type', s.displayType),
                                              _detailRow('Cost', _formatCurrency(s.cost)),
                                              _detailRow('Mileage', '${_formatNumber(s.mileage)} km'),
                                              if (s.shop != null && s.shop!.isNotEmpty)
                                                _detailRow('Shop', s.shop!),
                                              _detailRow('Self service', s.selfService ? 'Yes' : 'No'),
                                              if (s.note != null && s.note!.isNotEmpty)
                                                _detailRow('Note', s.note!),
                                              _detailRow('Date', _formatDateTime(s.date)),
                                            ],
                                          ),
                                          if (s.photos.isNotEmpty) ...[
                                            SizedBox(height: 12),
                                            Wrap(
                                              spacing: 8,
                                              runSpacing: 8,
                                              children: s.photos
                                                  .map((p) => Image.memory(
                                                        base64Decode(p),
                                                        width: 100,
                                                        height: 100,
                                                        fit: BoxFit.cover,
                                                      ))
                                                  .toList(),
                                            ),
                                          ],
                                        ],
                                      ),
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
                                          builder: (_) => AddServiceScreen(service: s, standalone: true),
                                        ),
                                      );
                                    },
                                  ),
                                  if (s.id != null)
                                    IconButton(
                                      icon: Icon(Icons.delete, color: Colors.red),
                                      onPressed: () async {
                                        final confirm = await showDialog<bool>(
                                          context: context,
                                          builder: (context) => AlertDialog(
                                            title: Text('Confirm Deletion'),
                                            content: Text('Are you sure you want to delete this record?'),
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
                                          await session.removeService(s.id!);
                                        }
                                      },
                                    ),
                                ],
                              ),
                            );
                          }
                        },
                      ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _HistoryItem {
  final DateTime date;
  final Refuel? refuel;
  final ServiceRecord? service;
  _HistoryItem({required this.date, this.refuel, this.service});
}
