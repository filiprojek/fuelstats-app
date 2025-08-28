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
        lineTouchData: LineTouchData(
          touchTooltipData: LineTouchTooltipData(
            tooltipBgColor: Colors.black87,
            tooltipMargin: 40,
            fitInsideHorizontally: true,
            fitInsideVertically: true,
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
              child: Text('Refuel'),
            ),
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 28,
              getTitlesWidget: (value, meta) => Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text('${value.toInt() + 1}',
                    style: const TextStyle(fontSize: 10)),
              ),
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
