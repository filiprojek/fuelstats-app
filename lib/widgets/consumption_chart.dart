import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../models/refuel.dart';

class ConsumptionChart extends StatelessWidget {
  final List<Refuel> refuels;

  const ConsumptionChart({super.key, required this.refuels});

  @override
  Widget build(BuildContext context) {
    final spots = <FlSpot>[];
    final labels = <String>[];
    for (var i = 1; i < refuels.length; i++) {
      final prev = refuels[i - 1];
      final curr = refuels[i];
      final distance = curr.mileage - prev.mileage;
      if (distance <= 0) continue;
      final consumption =
          double.parse((curr.liters / distance * 100).toStringAsFixed(2));
      spots.add(FlSpot(spots.length.toDouble(), consumption));
      final date = curr.createdAt;
      labels.add(date != null ? '${date.month}/${date.day}' : '');
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
        lineTouchData: LineTouchData(
          touchTooltipData: LineTouchTooltipData(
            tooltipBgColor: Colors.black87,
            tooltipMargin: 40,
            fitInsideHorizontally: true,
            fitInsideVertically: true,
            getTooltipItems: (spots) => spots
                .map((s) => LineTooltipItem(
                    '${s.y.toStringAsFixed(2)} L/100km',
                    const TextStyle(color: Colors.white)))
                .toList(),
          ),
        ),
        titlesData: FlTitlesData(
          leftTitles: AxisTitles(
            axisNameSize: 28,
            axisNameWidget: const Padding(
              padding: EdgeInsets.only(right: 8),
              child: Text('L/100km'),
            ),
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 50,
              getTitlesWidget: (value, meta) => Padding(
                padding: const EdgeInsets.only(right: 4),
                child: Text(value.toStringAsFixed(1),
                    style: const TextStyle(fontSize: 10)),
              ),
            ),
          ),
          bottomTitles: AxisTitles(
            axisNameSize: 24,
            axisNameWidget: const Padding(
              padding: EdgeInsets.only(top: 8),
              child: Text('Date'),
            ),
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 36,
              getTitlesWidget: (value, meta) {
                final index = value.toInt();
                if (index < 0 || index >= labels.length) {
                  return const SizedBox.shrink();
                }
                return Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(labels[index],
                      style: const TextStyle(fontSize: 10)),
                );
              },
            ),
          ),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        gridData: const FlGridData(show: false),
        borderData: FlBorderData(show: false),
      ),
    );
  }
}
