import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/refuel.dart';
import '../services/session_manager.dart';
import '../widgets/stat_card.dart';
import '../widgets/gas_price_chart.dart';
import '../widgets/consumption_chart.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  String _formatDouble(double value) {
    var s = value.toStringAsFixed(2);
    if (s.endsWith('.00')) {
      s = s.substring(0, s.length - 3);
    } else if (s.endsWith('0')) {
      s = s.substring(0, s.length - 1);
    }
    return s;
  }

  double? _allTimeConsumption(List<Refuel> refuels) {
    if (refuels.length < 2) return null;
    final distance = refuels.last.mileage - refuels.first.mileage;
    if (distance <= 0) return null;
    final liters =
        refuels.skip(1).fold<double>(0.0, (sum, r) => sum + r.liters);
    return liters / distance * 100;
  }

  double? _lastConsumption(List<Refuel> refuels) {
    if (refuels.length < 2) return null;
    final last = refuels[refuels.length - 1];
    final prev = refuels[refuels.length - 2];
    final distance = last.mileage - prev.mileage;
    if (distance <= 0) return null;
    return last.liters / distance * 100;
  }

  int? _kmSinceLast(List<Refuel> refuels) {
    if (refuels.length < 2) return null;
    return refuels.last.mileage - refuels[refuels.length - 2].mileage;
  }

  int _kmForPeriod(List<Refuel> refuels, DateTime from) {
    final list = refuels
        .where((r) => r.createdAt != null && r.createdAt!.isAfter(from))
        .toList();
    if (list.length < 2) return 0;
    return list.last.mileage - list.first.mileage;
  }

  int _kmAllTime(List<Refuel> refuels) {
    if (refuels.length < 2) return 0;
    return refuels.last.mileage - refuels.first.mileage;
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<SessionManager>(
      builder: (context, session, _) {
        final vehicle = session.defaultVehicle;
        if (vehicle == null) {
          return const Scaffold(
            body: Center(child: Text('No default vehicle selected')),
          );
        }

        final refuels = session.refuels
            .where((r) => r.vehicleId == vehicle.id)
            .toList();
        refuels.sort((a, b) => a.mileage.compareTo(b.mileage));

        final allCons = _allTimeConsumption(refuels);
        final lastCons = _lastConsumption(refuels);
        final kmLast = _kmSinceLast(refuels);
        final now = DateTime.now();
        final km1m = _kmForPeriod(refuels, now.subtract(const Duration(days: 30)));
        final km6m =
            _kmForPeriod(refuels, now.subtract(const Duration(days: 182)));
        final km1y =
            _kmForPeriod(refuels, now.subtract(const Duration(days: 365)));
        final kmAll = _kmAllTime(refuels);

        final lastRefuels =
            refuels.length > 14 ? refuels.sublist(refuels.length - 14) : refuels;

        return Scaffold(
          body: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Stats for ${vehicle.name}',
                      style: const TextStyle(fontSize: 18)),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      StatCard(
                        title: 'Avg consumption (all time)',
                        value: allCons != null
                            ? '${_formatDouble(allCons)} L/100km'
                            : '-',
                      ),
                      StatCard(
                        title: 'Since last refuel',
                        value: lastCons != null
                            ? '${_formatDouble(lastCons)} L/100km'
                            : '-',
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  const Text('Kilometers driven',
                      style:
                          TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      StatCard(
                        title: 'Since last refuel',
                        value: kmLast != null ? '$kmLast km' : '-',
                      ),
                      StatCard(title: 'Past month', value: '$km1m km'),
                      StatCard(title: 'Past 6 months', value: '$km6m km'),
                      StatCard(title: 'Past year', value: '$km1y km'),
                      StatCard(title: 'All time', value: '$kmAll km'),
                    ],
                  ),
                  if (lastRefuels.isNotEmpty) ...[
                    const SizedBox(height: 24),
                    Text('Gas price (last ${lastRefuels.length} refuels)',
                        style: const TextStyle(
                            fontSize: 18, fontWeight: FontWeight.bold)),
                    SizedBox(
                      height: 200,
                      child: GasPriceChart(refuels: lastRefuels),
                    ),
                  ],
                  if (lastRefuels.length > 1) ...[
                    const SizedBox(height: 24),
                    const Text('Consumption trend',
                        style: TextStyle(
                            fontSize: 18, fontWeight: FontWeight.bold)),
                    SizedBox(
                      height: 200,
                      child: ConsumptionChart(refuels: lastRefuels),
                    ),
                  ],
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

