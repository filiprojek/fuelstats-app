import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../models/refuel.dart';

class ConsumptionChart extends StatelessWidget {
  final List<Refuel> refuels;

  const ConsumptionChart({super.key, required this.refuels});

  @override
  Widget build(BuildContext context) {
    final spots = <FlSpot>[];
    for (var i = 1; i < refuels.length; i++) {
      final prev = refuels[i - 1];
      final curr = refuels[i];
      final distance = curr.mileage - prev.mileage;
      if (distance <= 0) continue;
      final consumption = curr.liters / distance * 100;
      spots.add(FlSpot((i - 1).toDouble(), consumption));
    }

    return LineChart(
      LineChartData(
        lineBarsData: [
          LineChartBarData(
            spots: spots,
            isCurved: true,
            barWidth: 3,
            color: Theme.of(context).colorScheme.secondary,
            dotData: const FlDotData(show: true),
          )
        ],
        titlesData: const FlTitlesData(show: false),
        gridData: const FlGridData(show: false),
        borderData: FlBorderData(show: false),
      ),
    );
  }
}
