import 'package:flutter/material.dart';
import '../widgets/stat_card.dart';
import '../widgets/group_title.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  width: MediaQuery.of(context).size.width,
                  height: 80.0,
                  child: Card(
                    color: Theme.of(context).colorScheme.secondaryContainer,
                    child: ListTile(
                      leading: const Icon(Icons.directions_car),
                      title: Text(
                        "Octavia",
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      subtitle: Text("1AB1234"),
                      trailing: const Icon(Icons.star, color: Colors.amber),
                    ),
                  ),
                ),
                GroupTitle(title: "Refuel stats"),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  childAspectRatio: 2.0,
                  children: [
                    StatCard(
                      title: "Avg consumption (all time)",
                      value: "6.5 L/100 km",
                    ),
                    StatCard(title: "Since last refuel", value: "7.6 L/100 km"),
                  ],
                ),
                GroupTitle(title: "Kilometers driven"),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  childAspectRatio: 2.0,
                  children: [
                    StatCard(title: "Since last refuel", value: "-"),
                    StatCard(title: "Past month", value: "-"),
                    StatCard(title: "Past 6 months", value: "-"),
                    StatCard(title: "Past year", value: "-"),
                    StatCard(title: "All time", value: "-"),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
