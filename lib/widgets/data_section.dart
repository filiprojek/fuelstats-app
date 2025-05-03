import 'package:flutter/material.dart';

class DataSection extends StatelessWidget {
  final String title;

  const DataSection({required this.title});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.all(16),
      child: Container(
        height: 200,
        padding: EdgeInsets.all(16),
        child: Center(child: Text(title, style: TextStyle(fontSize: 18))),
      ),
    );
  }
}
