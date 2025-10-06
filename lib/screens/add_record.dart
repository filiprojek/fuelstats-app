import 'package:flutter/material.dart';

class AddRecordScreen extends StatelessWidget {
  const AddRecordScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                DropdownButtonFormField(
                  decoration: InputDecoration(labelText: 'Vehicle'),
                  //value: 0,
                  items:
                      ['Option 1', 'Option 2', 'Option 3']
                          .map(
                            (option) => DropdownMenuItem(
                              value: option,
                              child: Text(option),
                            ),
                          )
                          .toList(),
                  onChanged: (value) {},
                  validator:
                      (value) =>
                          value == null ? 'Please select a vehicle' : null,
                ),
                DropdownButtonFormField(
                  decoration: InputDecoration(labelText: 'Fuel Type'),
                  //value: 0,
                  items:
                      ['Option 1', 'Option 2', 'Option 3']
                          .map(
                            (option) => DropdownMenuItem(
                              value: option,
                              child: Text(option),
                            ),
                          )
                          .toList(),
                  onChanged: (value) {},
                  validator:
                      (value) =>
                          value == null ? 'Please select a vehicle' : null,
                ),

                TextFormField(
                  decoration: InputDecoration(labelText: 'Liters'),
                  keyboardType: TextInputType.number,
                ),
                TextFormField(
                  decoration: InputDecoration(labelText: 'Price per Liter'),
                  keyboardType: TextInputType.number,
                ),
                TextFormField(
                  decoration: InputDecoration(labelText: 'Total Price'),
                  keyboardType: TextInputType.number,
                ),
                TextFormField(
                  decoration: InputDecoration(labelText: 'Mileage'),
                  keyboardType: TextInputType.number,
                ),
                TextFormField(
                  decoration: InputDecoration(labelText: 'Note'),
                  keyboardType: TextInputType.text,
                ),
                SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: () {},
                  icon: Icon(Icons.add),
                  label: Text(
                    true ? "Create Fuel Record" : "Update Fuel Record",
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    foregroundColor: Theme.of(context).colorScheme.onPrimary,
                  ),
                ),
                SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: () {},
                  icon: Icon(Icons.build),
                  label: Text('Add Service Record'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
