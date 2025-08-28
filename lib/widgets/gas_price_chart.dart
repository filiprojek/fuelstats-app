import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../models/refuel.dart';

class GasPriceChart extends StatelessWidget {
  final List<Refuel> refuels;

  const GasPriceChart({super.key, required this.refuels});

  @override
  Widget build(BuildContext context) {
    final spots = <FlSpot>[];
    for (var i = 0; i < refuels.length; i++) {
      spots.add(FlSpot(i.toDouble(), refuels[i].pricePerLiter));
    }

    return LineChart(
      LineChartData(
        lineBarsData: [
          LineChartBarData(
            spots: spots,
            isCurved: true,
            barWidth: 3,
            color: Theme.of(context).colorScheme.primary,
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
