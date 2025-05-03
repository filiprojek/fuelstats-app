import 'package:flutter/material.dart';

enum FuelType { Diesel, Gasoline95, Gasoline98, Other }

class Vehicle {
  final String name;
  final String registrationPlate;
  final FuelType fuelType;
  final String? note;

  Vehicle({
    required this.name,
    required this.registrationPlate,
    required this.fuelType,
    this.note,
  });
}

class VehiclesScreen extends StatefulWidget {
  @override
  _VehiclesScreenState createState() => _VehiclesScreenState();
}

class _VehiclesScreenState extends State<VehiclesScreen> {
  final List<Vehicle> _vehicles = [];

  void _addVehicle() async {
    final newVehicle = await showDialog<Vehicle>(
      context: context,
      builder: (context) => _AddVehicleDialog(),
    );
    if (newVehicle != null) {
      setState(() {
        _vehicles.add(newVehicle);
      });
    }
  }

  void _removeVehicle(int index) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder:
          (context) => AlertDialog(
            title: Text('Confirm Removal'),
            content: Text('Are you sure you want to delete this vehicle?'),
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
      setState(() {
        _vehicles.removeAt(index);
      });
    }
  }

  String _fuelTypeToString(FuelType fuelType) {
    switch (fuelType) {
      case FuelType.Diesel:
        return 'Diesel';
      case FuelType.Gasoline95:
        return 'Gasoline 95';
      case FuelType.Gasoline98:
        return 'Gasoline 98';
      case FuelType.Other:
        return 'Other';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Vehicles')),
      body:
          _vehicles.isEmpty
              ? Center(child: Text('No vehicles added yet.'))
              : ListView.builder(
                itemCount: _vehicles.length,
                itemBuilder: (context, index) {
                  final vehicle = _vehicles[index];
                  return ListTile(
                    title: Text(vehicle.name),
                    subtitle: Text(
                      '${vehicle.registrationPlate} • ${_fuelTypeToString(vehicle.fuelType)}${vehicle.note != null ? ' • ${vehicle.note}' : ''}',
                    ),
                    trailing: IconButton(
                      icon: Icon(Icons.delete, color: Colors.red),
                      onPressed: () => _removeVehicle(index),
                    ),
                  );
                },
              ),
      floatingActionButton: FloatingActionButton(
        onPressed: _addVehicle,
        child: Icon(Icons.add),
        tooltip: 'Add Vehicle',
      ),
    );
  }
}

class _AddVehicleDialog extends StatefulWidget {
  @override
  _AddVehicleDialogState createState() => _AddVehicleDialogState();
}

class _AddVehicleDialogState extends State<_AddVehicleDialog> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _plateController = TextEditingController();
  final _noteController = TextEditingController();
  FuelType? _selectedFuelType;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('Add New Vehicle'),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: _nameController,
                decoration: InputDecoration(labelText: 'Vehicle Name'),
                validator:
                    (value) =>
                        value == null || value.isEmpty
                            ? 'Enter a vehicle name'
                            : null,
              ),
              TextFormField(
                controller: _plateController,
                decoration: InputDecoration(labelText: 'Registration Plate'),
                validator:
                    (value) =>
                        value == null || value.isEmpty
                            ? 'Enter a plate number'
                            : null,
              ),
              DropdownButtonFormField<FuelType>(
                decoration: InputDecoration(labelText: 'Fuel Type'),
                value: _selectedFuelType,
                items:
                    FuelType.values.map((fuelType) {
                      return DropdownMenuItem(
                        value: fuelType,
                        child: Text(fuelType.name),
                      );
                    }).toList(),
                onChanged: (value) => setState(() => _selectedFuelType = value),
                validator:
                    (value) =>
                        value == null ? 'Please select a fuel type' : null,
              ),
              TextFormField(
                controller: _noteController,
                decoration: InputDecoration(labelText: 'Note (optional)'),
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () {
            if (_formKey.currentState?.validate() ?? false) {
              final vehicle = Vehicle(
                name: _nameController.text,
                registrationPlate: _plateController.text,
                fuelType: _selectedFuelType!,
                note:
                    _noteController.text.isEmpty ? null : _noteController.text,
              );
              Navigator.pop(context, vehicle);
            }
          },
          child: Text('Add'),
        ),
      ],
    );
  }
}
